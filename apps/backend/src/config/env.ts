import { z } from 'zod';
import * as dotenv from 'dotenv';

// Load .env file into process.env if present
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('8080').transform((val) => parseInt(val, 10)),
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid connection string"),
  FRONTEND_URL: z.string().url("FRONTEND_URL must be a valid URL (e.g., http://localhost:3000)"),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:', parsedEnv.error.format());
  process.exit(1);
}

export const config = parsedEnv.data;
