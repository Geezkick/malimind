import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AiService } from './ai.service';
import { ChatPromptDto } from './dto/ai.dto';

@ApiTags('AI Assistant')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('chat')
  @ApiOperation({ summary: 'Chat with MaliMind AI' })
  chat(@Request() req, @Body() dto: ChatPromptDto) {
    return this.aiService.chat(req.user.id, dto);
  }
}
