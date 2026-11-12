import { z } from "zod";

const clientEnvironmentSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().min(1).default("Handwerker Service App")
});

export type ClientEnvironment = z.infer<typeof clientEnvironmentSchema>;

export function readClientEnvironment(
  environment: Record<string, string | undefined> = process.env
): ClientEnvironment {
  return clientEnvironmentSchema.parse({
    NEXT_PUBLIC_APP_NAME: environment.NEXT_PUBLIC_APP_NAME
  });
}
