import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Ravi Kumar' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({ example: 'ravi@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Strong@123', minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;
}

export class LoginDto {
  @ApiProperty({ example: 'applicant@loandesk.dev' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Password@123' })
  @IsString()
  password!: string;
}
