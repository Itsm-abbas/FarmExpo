import { z } from "zod";

export const commoditySchema = z.object({
  number: z.string().min(1, "Number is required"),
  name: z.string().min(1, "Name is required"),
});
