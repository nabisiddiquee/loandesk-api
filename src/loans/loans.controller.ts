import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthUser, CurrentUser } from '../common/current-user.decorator';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { CreateLoanDto, EmiQuery, ListLoansQuery, UpdateStatusDto } from './dto';
import { amortizationSchedule, calculateEmi } from './emi';
import { LoansService } from './loans.service';

@ApiTags('loans')
@Controller('loans')
export class LoansController {
  constructor(private readonly loans: LoansService) {}

  /** Public EMI calculator with full amortization schedule. */
  @Get('emi-calculator')
  emi(@Query() q: EmiQuery) {
    return {
      monthlyEmi: calculateEmi(q.amount, q.annualRate, q.tenureMonths),
      schedule: amortizationSchedule(q.amount, q.annualRate, q.tenureMonths),
    };
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.APPLICANT)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateLoanDto) {
    return this.loans.create(user, dto);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  list(@CurrentUser() user: AuthUser, @Query() query: ListLoansQuery) {
    return this.loans.list(user, query);
  }

  @Get('summary')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ANALYST, Role.ADMIN)
  summary() {
    return this.loans.summary();
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  findOne(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.loans.findOne(user, id);
  }

  @Patch(':id/status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ANALYST, Role.ADMIN)
  updateStatus(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateStatusDto) {
    return this.loans.updateStatus(user, id, dto);
  }
}
