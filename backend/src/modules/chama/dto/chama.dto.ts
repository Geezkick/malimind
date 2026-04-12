import { IsString, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateChamaDto {
  @ApiProperty({ example: 'Nairobi Savers' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Monthly saving circle for investments', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 5000, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  targetAmount?: number;

  @ApiProperty({ example: 'monthly', required: false })
  @IsOptional()
  @IsString()
  frequency?: string;
}

export class JoinChamaDto {
  @ApiProperty({ example: 'ABC123' })
  @IsString()
  inviteCode: string;
}

export class ContributeDto {
  @ApiProperty({ example: 2000 })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ example: 'Monthly contribution', required: false })
  @IsOptional()
  @IsString()
  note?: string;
}
