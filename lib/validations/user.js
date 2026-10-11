import { z } from "zod";

export const signupSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6),
  name: z.string().trim().optional(),
  organizationName: z.string().trim().max(120).optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6),
});
