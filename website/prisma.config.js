import 'dotenv/config'; // 👈 Forces .env to be loaded
import path from 'node:path';
import { defineConfig } from 'prisma/config';

// 🔧 Prisma 7 configuration with database URL
export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  datasource: {
    url: process.env.DATABASE_URL
  }
});
