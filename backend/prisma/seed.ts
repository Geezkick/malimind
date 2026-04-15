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
      aiState: {
        create: {
           riskScore: 85,
           safeToSpend: 154000,
           lastInsight: 'Capital is healthy. Perfect condition for secondary wealth allocation.'
        }
      }
    }
  });

  console.log('✅ Seeded User: john@example.com / password123');

  // Chama
  const chama = await prisma.chama.create({
    data: {
      name: 'Alpha Capital Syndicate',
      ownerId: user.id,
      inviteCode: 'ALPHA123',
      description: 'Strategic group capital accumulation',
      targetAmount: 500000,
      wallet: {
         create: { balance: 0 }
      }
    }
  });

  await prisma.chamaMember.create({
    data: {
      userId: user.id,
      chamaId: chama.id
    }
  });

  console.log('✅ Seeded Synergy Pool: Alpha Capital Syndicate');

  // Create some transactions
  await prisma.transaction.create({
    data: {
      userId: user.id,
      type: 'income',
      amount: 40000,
      category: 'Deposit',
      note: 'Initial Bank Transfer',
    }
  });

  console.log('✅ Seeded Transactions');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
