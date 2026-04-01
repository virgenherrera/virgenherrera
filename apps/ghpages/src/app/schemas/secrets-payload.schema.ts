import { z } from "zod";

export const secretsPayloadSchema = z.object({
  email: z.string().email(),
  phone: z.string().min(1),
});

export type SecretsPayload = z.infer<typeof secretsPayloadSchema>;
