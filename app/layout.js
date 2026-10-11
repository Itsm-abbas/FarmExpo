import "./globals.css";
import Providers from "@utils/provider";
import { body, display } from "@utils/fonts";
import { THEME_BOOT_SCRIPT } from "@utils/theme";

export const metadata = {
  title: "FarmExpo",
  description: "Consignments, partners and ledgers for produce exporters",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${body.variable} ${display.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Applies the last theme before paint, avoiding a flash of the default. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body className="font-body">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
