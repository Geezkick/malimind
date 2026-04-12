import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Database...');

  // Opportunities / Gigs
  const ops = [
    {
      title: 'Freelance Software Developer',
      type: 'gig',
      description: 'Build a simple MVP for a startup. React Native and Node.js.',
      link: 'https://upwork.com',
      location: 'Remote',
      salary: 'KES 50,000 - 100,000',
      company: 'Tech Startup X',
    },
    {
      title: 'Delivery Rider',
      type: 'job',
      description: 'Full-time delivery rider around Nairobi CBD.',
      link: 'https://glovoapp.com',
      location: 'Nairobi',
      salary: 'KES 25,000/month',
      company: 'Glovo',
    },
    {
      title: 'Data Entry Clerk',
      type: 'gig',
      description: 'Short-term data entry for historical records. 2 weeks.',
      link: 'https://fiverr.com',
      location: 'Remote',
      salary: 'KES 15,000',
      company: 'Research Inst.',
    },
  ];

  for (const op of ops) {
    await prisma.opportunity.create({ data: op });
  }

  console.log('✅ Seeded Opportunities');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
