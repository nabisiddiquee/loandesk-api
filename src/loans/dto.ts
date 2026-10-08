import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LoanStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNumber, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';

export class CreateLoanDto {
  @ApiProperty({ example: 'Sharma Traders' })
  @IsString()
  @MaxLength(120)
  businessName!: string;

  @ApiProperty({ example: '07AAGFF2194N1Z1', description: '15-character GSTIN' })
  @Matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/, { message: 'gstin must be a valid 15-character GSTIN' })
  gstin!: string;

  @ApiProperty({ example: 500000, minimum: 10000, maximum: 50000000 })
  @Type(() => Number)
  @IsNumber()
  @Min(10000)
  @Max(50000000)
  amount!: number;

  @ApiProperty({ example: 24, minimum: 3, maximum: 120 })
  @Type(() => Number)
  @IsInt()
  @Min(3)
  @Max(120)
  tenureMonths!: number;

  @ApiProperty({ example: 'Working capital for inventory' })
  @IsString()
  @MaxLength(300)
  purpose!: string;
}

export class UpdateStatusDto {
  @ApiProperty({ enum: LoanStatus })
  @IsEnum(LoanStatus)
  status!: LoanStatus;

  @ApiPropertyOptional({ example: 'Bank statements verified' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class ListLoansQuery {
  @ApiPropertyOptional({ enum: LoanStatus })
  @IsOptional()
  @IsEnum(LoanStatus)
  status?: LoanStatus;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 10, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize = 10;
}

export class EmiQuery {
  @ApiProperty({ example: 500000 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  amount!: number;

  @ApiProperty({ example: 14 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(60)
  annualRate!: number;

  @ApiProperty({ example: 24 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(360)
  tenureMonths!: number;
}
