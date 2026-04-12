import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChatPromptDto {
  @ApiProperty({ example: 'Can I spend 1000 KES today?' })
  @IsString()
  @IsNotEmpty()
  prompt: string;
}
