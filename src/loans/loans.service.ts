import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, Role } from '@prisma/client';
import { AuthUser } from '../common/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLoanDto, ListLoansQuery, UpdateStatusDto } from './dto';
import { calculateEmi } from './emi';
import { canTransition, nextStatuses } from './workflow';

@Injectable()
export class LoansService {
  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService) {}

  async create(user: AuthUser, dto: CreateLoanDto) {
    const annualRate = Number(this.config.get('DEFAULT_ANNUAL_RATE', 14));
    const monthlyEmi = calculateEmi(dto.amount, annualRate, dto.tenureMonths);

    return this.prisma.$transaction(async (tx) => {
      const loan = await tx.loan.create({
        data: { ...dto, applicantId: user.id, annualRate, monthlyEmi },
      });
      await tx.loanEvent.create({
        data: { loanId: loan.id, actorId: user.id, toStatus: loan.status, note: 'Application submitted' },
      });
      return loan;
    });
  }

  async list(user: AuthUser, query: ListLoansQuery) {
    const where: Prisma.LoanWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(user.role === Role.APPLICANT ? { applicantId: user.id } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.loan.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.loan.count({ where }),
    ]);
    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async findOne(user: AuthUser, id: string) {
    const loan = await this.prisma.loan.findUnique({
      where: { id },
      include: { events: { orderBy: { createdAt: 'asc' } } },
    });
    if (!loan) throw new NotFoundException('Loan not found');
    if (user.role === Role.APPLICANT && loan.applicantId !== user.id) {
      throw new ForbiddenException('You can only view your own applications');
    }
    return { ...loan, allowedNextStatuses: nextStatuses(loan.status, user.role) };
  }

  async updateStatus(user: AuthUser, id: string, dto: UpdateStatusDto) {
    const loan = await this.prisma.loan.findUnique({ where: { id } });
    if (!loan) throw new NotFoundException('Loan not found');
    if (!canTransition(loan.status, dto.status, user.role)) {
      throw new BadRequestException(`Cannot move loan from ${loan.status} to ${dto.status} as ${user.role}`);
    }

    return this.prisma.$transaction(async (tx) => {
      // Optimistic check: only update if the status has not changed since we read it.
      const result = await tx.loan.updateMany({
        where: { id, status: loan.status },
        data: { status: dto.status, reviewerId: user.id, remarks: dto.note ?? loan.remarks },
      });
      if (result.count === 0) throw new BadRequestException('Loan was updated by someone else, please retry');
      await tx.loanEvent.create({
        data: { loanId: id, actorId: user.id, fromStatus: loan.status, toStatus: dto.status, note: dto.note },
      });
      return tx.loan.findUniqueOrThrow({ where: { id } });
    });
  }

  async summary() {
    const rows = await this.prisma.loan.groupBy({
      by: ['status'],
      _count: { _all: true },
      _sum: { amount: true },
    });
    return rows.map((r) => ({ status: r.status, count: r._count._all, totalAmount: Number(r._sum.amount ?? 0) }));
  }
}
