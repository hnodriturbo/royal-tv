import { PrismaClient } from '@prisma/client';

let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({
    log: ['warn', 'error'] // Log queries and warnings
  });
  console.log('✅ Prisma Client initialized in PRODUCTION mode.');
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: ['warn', 'error'] // Log all (took out for testing the following logging: 'query', 'info', )
    });
    console.log('✅ Prisma Client initialized in DEVELOPMENT mode.');
  } else {
    console.log('♻️ Reusing existing Prisma Client instance.');
  }
  prisma = global.prisma;
}

export default prisma;
