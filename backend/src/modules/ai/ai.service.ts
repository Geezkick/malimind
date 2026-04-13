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
    // Fetch deep context
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        wallet: true,
        goals: { where: { currentAmount: { lt: this.prisma.goal.fields.targetAmount } } },
        skillProfile: true,
        chamaMembers: { include: { chama: true } },
      }
    });

    const recentTx = await this.prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // Find nearby jobs if user has location
    let nearbyJobs = [];
    if (user?.latitude && user?.longitude) {
       const allJobs = await this.prisma.job.findMany({ where: { status: 'open' }, take: 20 });
       nearbyJobs = allJobs.filter(j => {
          if (!j.latitude || !j.longitude) return false;
          const dist = this.calculateDistance(user.latitude!, user.longitude!, j.latitude, j.longitude);
          return dist < 20; // Within 20km
       }).slice(0, 3);
    }

    const balance = user?.wallet?.balance || 0;
    const goalsContext = user?.goals.map(g => `${g.title}: KES ${g.currentAmount}/${g.targetAmount}`).join(', ');
    const txContext = recentTx.map(t => `${t.type === 'income' ? '+' : '-'}${t.amount} (${t.category})`).join(', ');
    const profileContext = user?.skillProfile ? `Worker Profile: ${user.skillProfile.title}, Skills: ${user.skillProfile.skills}, Rating: ${user.skillProfile.rating}` : 'No worker profile yet.';
    const chamaContext = user?.chamaMembers.map(m => m.chama.name).join(', ');
    const jobsContext = nearbyJobs.map(j => `${j.title} (KES ${j.budget})`).join(', ');

    const systemPrompt = `You are a financial & opportunity assistant for users in Kenya using the MaliMind super app. 
Be simple, clear, and highly practical. Provide advice in 1-2 short paragraphs or bullet points.
Context for the current user:
- Current Balance: KES ${balance}
- Recent Transactions: ${txContext || 'None'}
- Goals: ${goalsContext || 'None'}
- Chamas: ${chamaContext || 'None'}
- Marketplace: ${profileContext}
- Nearby Earning Opportunities: ${jobsContext || 'None'}

If the user asks for ways to earn more, suggest the nearby jobs or setting up their skill profile.
If they ask about spending, consider their goals and chama commitments.`;

    try {
      let responseText = '';
      
      const apiKey = process.env.OPENAI_API_KEY;
      if (apiKey && apiKey !== 'dummy_key_for_now' && apiKey !== '') {
        const completion = await this.openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: dto.prompt },
          ],
          max_tokens: 150,
        });

        responseText = completion.choices[0].message.content || 'I could not generate a response.';
      } else {
        // FALLBACK MOCK IF NO API KEY
        responseText = `[MOCK] Here is your mock response for: "${dto.prompt}".\nYour balance is KES ${balance}. You have ${user?.goals.length || 0} active goals. Configure OPENAI_API_KEY for real advice.`;
        if (dto.prompt.toLowerCase().includes('spend') || dto.prompt.toLowerCase().match(/\d+/)) {
           const match = dto.prompt.match(/\d+/);
           const amount = match ? parseInt(match[0], 10) : 0;
           if (amount > balance) {
               responseText = `[MOCK] No, you cannot safely spend KES ${amount}. Your balance is KES ${balance}.`;
           } else if (amount > 0) {
               responseText = `[MOCK] Yes, you can spend KES ${amount}. However, considering your goals (${user?.goals && user.goals.length > 0 ? user.goals[0].title : 'no active goals'}), tread carefully.`;
           }
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

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
}
