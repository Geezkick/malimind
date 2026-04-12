import { IsEnum, IsNumber, IsString, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTransactionDto {
  @ApiProperty({ enum: ['income', 'expense'] })
  @IsEnum(['income', 'expense'])
  type: 'income' | 'expense';

  @ApiProperty({ example: 5000 })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ example: 'Food & Dining' })
  @IsString()
  category: string;

  @ApiProperty({ example: 'Lunch at Java', required: false })
  @IsOptional()
  @IsString()
  note?: string;
}
