import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoansService } from './loans.service';

function makePrisma() {
  const prisma: any = {
    loan: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      updateMany: jest.fn(),
    },
    loanEvent: { create: jest.fn() },
  };
  prisma.$transaction = jest.fn((fn: any) => fn(prisma));
  return prisma;
}

const applicant = { id: 'u1', email: 'a@x.dev', role: 'APPLICANT' as const };
const analyst = { id: 'u2', email: 'b@x.dev', role: 'ANALYST' as const };
const config = { get: (_k: string, d: unknown) => d } as unknown as ConfigService;

describe('LoansService', () => {
  it('calculates EMI and records a submission event on create', async () => {
    const prisma = makePrisma();
    prisma.loan.create.mockImplementation(({ data }: any) => ({ id: 'l1', status: 'SUBMITTED', ...data }));
    const service = new LoansService(prisma, config);

    const loan: any = await service.create(applicant, {
      businessName: 'Sharma Traders', gstin: '07AAGFF2194N1Z1', amount: 500000, tenureMonths: 24, purpose: 'Inventory',
    });

    expect(loan.monthlyEmi).toBeCloseTo(24006.44, 2);
    expect(prisma.loanEvent.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ loanId: 'l1', toStatus: 'SUBMITTED' }),
    }));
  });

  it('stops an applicant from reading someone else\'s loan', async () => {
    const prisma = makePrisma();
    prisma.loan.findUnique.mockResolvedValue({ id: 'l1', applicantId: 'other', status: 'SUBMITTED', events: [] });
    await expect(new LoansService(prisma, config).findOne(applicant, 'l1')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects an invalid status jump', async () => {
    const prisma = makePrisma();
    prisma.loan.findUnique.mockResolvedValue({ id: 'l1', status: 'SUBMITTED' });
    await expect(new LoansService(prisma, config).updateStatus(analyst, 'l1', { status: 'APPROVED' }))
      .rejects.toBeInstanceOf(BadRequestException);
  });

  it('reports a concurrent update instead of overwriting it', async () => {
    const prisma = makePrisma();
    prisma.loan.findUnique.mockResolvedValue({ id: 'l1', status: 'SUBMITTED' });
    prisma.loan.updateMany.mockResolvedValue({ count: 0 });
    await expect(new LoansService(prisma, config).updateStatus(analyst, 'l1', { status: 'UNDER_REVIEW' }))
      .rejects.toThrow('updated by someone else');
  });
});
