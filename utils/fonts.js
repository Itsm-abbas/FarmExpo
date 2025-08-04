import {
  Poppins,
  Montserrat,
  Roboto,
  Lato,
  Playfair_Display,
  Raleway,
  Open_Sans,
  Inter
} from "next/font/google";

// Declare fonts at the top level
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "600"] }); // Button
const montserrat = Montserrat({ subsets: ["latin"], weight: ["700"] }); // Heading
const roboto = Roboto({ subsets: ["latin"], weight: ["400", "500"] }); // Table
const lato = Lato({ subsets: ["latin"], weight: ["400"] }); // Links
const openSans = Open_Sans({ subsets: ["latin"], weight: ["400", "600"] }); // Alert
const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["700"],
}); // Logo/Branding
const raleway = Raleway({ subsets: ["latin"], weight: ["400"] }); // Branding
const inter = Inter({ subsets: ["latin"], weight: ["400"] }); // Branding

// Group fonts into an object after declarations
let fonts = {
  poppins,
  montserrat,
  roboto,
  lato,
  openSans,
  playfairDisplay,
  raleway,
  inter
};

export default fonts;
