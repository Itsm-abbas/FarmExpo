import { Bricolage_Grotesque, Instrument_Sans } from "next/font/google";

// Display: headings, figures and the brand. Body: everything you read and type.
export const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  axes: ["opsz"],
});

export const body = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});
