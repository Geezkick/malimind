import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Database...');

  // Demo User
  const password = await bcrypt.hash('password123', 10);
  
  const user = await prisma.user.upsert({
    where: { email: 'john@example.com' },
    update: {},
    create: {
      name: 'John Doe',
      email: 'john@example.com',
      password,
      wallet: {
        create: {
          balance: 154000,
        }
      },
      goals: {
        create: [
          {
            title: 'Macbook Pro',
            targetAmount: 250000,
            currentAmount: 150000,
            emoji: '💻',
            deadline: new Date('2026-12-31')
          },
          {
             title: 'Emergency Fund',
             targetAmount: 500000,
             currentAmount: 125000,
             emoji: '🏦',
             deadline: new Date('2027-06-30')
          }
        ]
      }
    }
  });

  console.log('✅ Seeded User: john@example.com / password123');

  // Gigs / Jobs
  const jobs = [
    {
      title: 'Freelance Software Developer',
      description: 'Build a simple MVP for a startup. React Native and Node.js.',
      category: 'Development',
      location: 'Remote',
      budget: 75000,
      employerId: user.id,
    },
    {
      title: 'Delivery Rider',
      description: 'Full-time delivery rider around Nairobi CBD.',
      category: 'Logistics',
      location: 'Nairobi',
      budget: 25000,
      employerId: user.id,
    },
    {
      title: 'Graphic Designer',
      description: 'Create a logo and branding for a new fintech app.',
      category: 'Design',
      location: 'Remote',
      budget: 15000,
      employerId: user.id,
    },
  ];

  // Try to clear jobs - but wrap in try/catch in case model isn't generated yet or table doesn't exist
  try {
     await (prisma as any).job.deleteMany();
     console.log('Cleared old jobs');
  } catch(e) {}

  for (const job of jobs) {
    await (prisma as any).job.create({ data: job });
  }

  console.log('✅ Seeded Jobs');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
