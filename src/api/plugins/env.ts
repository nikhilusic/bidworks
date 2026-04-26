import { z } from 'zod';

const envSchema = z.object({
  PORT: z.string().default('3000'),
  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/bidworks')
});

export const env = envSchema.parse(process.env);
