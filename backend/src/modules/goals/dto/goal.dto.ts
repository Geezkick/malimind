import { IsString, IsNumber, IsDateString, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateGoalDto {
  @ApiProperty({ example: 'MacBook Pro' })
  @IsString()
  title: string;

  @ApiProperty({ example: 150000 })
  @IsNumber()
  @Min(1)
  targetAmount: number;

  @ApiProperty({ example: '2024-12-31' })
  @IsDateString()
  deadline: string;

  @ApiProperty({ example: '💻', required: false })
  @IsOptional()
  @IsString()
  emoji?: string;
}

export class UpdateGoalDto {
  @ApiProperty({ example: 5000 })
  @IsNumber()
  @Min(0)
  amount: number;
}
