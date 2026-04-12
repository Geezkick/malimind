import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import OpenAI from 'openai';
import { ChatPromptDto } from './dto/ai.dto';

@Injectable()
export class AiService {
  private openai: OpenAI;

  constructor(private prisma: PrismaService) {
    // If OPENAI_API_KEY is not set, we'll try to instantiate without it to not break the app entirely,
    // but the actual call will fail. This is suitable for MVP where we might use an alternative or mock it.
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'dummy_key_for_now',
    });
  }

  async chat(userId: string, dto: ChatPromptDto) {
    // Fetch context
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    const goals = await this.prisma.goal.findMany({ where: { userId } });
    const recentTx = await this.prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const balance = wallet?.balance || 0;
    const goalsContext = goals.map(g => `${g.title}: KES ${g.currentAmount}/${g.targetAmount}`).join(', ');
    const txContext = recentTx.map(t => `${t.type === 'income' ? '+' : '-'}${t.amount} (${t.category})`).join(', ');

    const systemPrompt = `You are a financial assistant for users in Kenya using the MaliMind super app. 
Be simple, clear, and highly practical. Provide advice in 1-2 short paragraphs or bullet points.
Context for the current user:
- Current Balance: KES ${balance}
- Recent Transactions: ${txContext || 'None'}
- Goals: ${goalsContext || 'None'}

If the user asks if they can spend an amount, clearly answer "Yes" or "No", and give a brief reason considering their balance and goals. Let them know if their spending is safe or risky.`;

    try {
      /* Commented out for actual execution to save costs/prevent errors if key is missing.
         Uncomment and provide key to use OpenAI.
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: dto.prompt },
        ],
        max_tokens: 150,
      });

      const responseText = completion.choices[0].message.content;
      */

      // MOCK RESPONSE FOR MVP DEMONSTRATION IF NO API KEY
      let responseText = `Here is your mock response for: "${dto.prompt}".\nYour current balance is KES ${balance}. You have ${goals.length} active goals. To provide real advice, please configure your OpenAI API Key.`;
      
      // Simple logic based on the user's prompt (Safe-to-spend mock)
      if (dto.prompt.toLowerCase().includes('spend') || dto.prompt.toLowerCase().match(/\d+/)) {
         const match = dto.prompt.match(/\d+/);
         const amount = match ? parseInt(match[0]) : 0;
         if (amount > balance) {
             responseText = `No, you cannot safely spend KES ${amount} today. Your balance is only KES ${balance}.`;
         } else if (amount > 0 && amount <= balance) {
             responseText = `Yes, you can spend KES ${amount}. However, considering your goals (${goals.length > 0 ? goals[0].title : 'no active goals'}), make sure it's necessary.`;
         }
      }

      await this.prisma.aIInteraction.create({
        data: {
          userId,
          prompt: dto.prompt,
          response: responseText,
        },
      });

      return {
        reply: responseText,
      };
    } catch (error) {
      console.error('AI Error:', error);
      throw new InternalServerErrorException('Failed to process AI request');
    }
  }
}
