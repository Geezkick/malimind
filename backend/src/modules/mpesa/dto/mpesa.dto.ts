import { IsString, IsPhoneNumber, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class StkPushDto {
  @ApiProperty({ example: '254712345678', description: 'Phone number starting with 254' })
  @IsString()
  phone: string;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(1)
  amount: number;
}
