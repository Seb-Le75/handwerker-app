import "server-only";

import { z } from "zod";

const serverEnvironmentSchema = z.object({
  APP_ENV: z.enum(["development", "test", "staging", "production"]).default("development"),
  DATABASE_URL: z.string().url().startsWith("postgres://").or(z.string().url().startsWith("postgresql://")),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info")
});

export type ServerEnvironment = z.infer<typeof serverEnvironmentSchema>;

export function readServerEnvironment(environment: NodeJS.ProcessEnv = process.env): ServerEnvironment {
  return serverEnvironmentSchema.parse(environment);
}
