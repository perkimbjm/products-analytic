import { z } from 'zod';
import 'dotenv/config';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  PORT: z.coerce.number().default(8080),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  CORS_ORIGIN: z.string().url().default('http://localhost:5173'),
  DATABASE_PATH: z.string().default('./data/app.sqlite'),
  SPATIALITE_EXTENSION_PATH: z.string().default('mod_spatialite'),
  // Import/seed only (never read at runtime)
  MAPID_DATASET_URL: z.string().url().optional(),
  MAPID_API_TOKEN: z.string().optional(),
});

type Env = z.infer<typeof envSchema>;

let env: Env | null = null;

export function loadEnv(): Env {
  if (!env) {
    env = envSchema.parse(process.env);
  }
  return env;
}

export const config = loadEnv();
