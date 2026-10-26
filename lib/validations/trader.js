import { z } from "zod";

export const traderSchema = z.object({
  // Optional: farmers often have none.
  ntn: z.string().trim().default(""),
  name: z.string().min(1, "Name is required"),
  address: z.string().min(1, "Address is required"),
  country: z.string().min(1, "Country is required"),
});
