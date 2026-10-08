import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const passwordHash = await bcrypt.hash('Password@123', 10);
  const users = [
    { name: 'Demo Applicant', email: 'applicant@loandesk.dev', role: Role.APPLICANT },
    { name: 'Demo Analyst', email: 'analyst@loandesk.dev', role: Role.ANALYST },
    { name: 'Demo Admin', email: 'admin@loandesk.dev', role: Role.ADMIN },
  ];
  for (const u of users) {
    await prisma.user.upsert({ where: { email: u.email }, update: {}, create: { ...u, passwordHash } });
  }
  console.log('Seeded demo users (password: Password@123)');
}

main().finally(() => prisma.$disconnect());
