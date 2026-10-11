// Color themes. Every color is an "R G B" triple consumed by Tailwind through
// CSS variables (see tailwind.config.mjs), so swapping the variables re-themes
// the whole app.

export const PALETTES = [
  {
    id: "orchard",
    name: "Orchard",
    light: {
      text: "20 35 28",
      background: "245 247 244",
      surface: "255 255 255",
      primary: "31 111 74",
      secondary: "169 191 174",
      accent: "22 82 55",
      highlight: "214 137 26",
      hover: "40 128 88",
      active: "24 92 62",
      selection: "31 111 74 / 0.2",
    },
    dark: {
      text: "231 238 233",
      background: "13 21 17",
      surface: "20 31 25",
      primary: "58 150 104",
      secondary: "64 92 76",
      accent: "41 120 82",
      highlight: "240 169 58",
      hover: "79 174 127",
      active: "45 125 86",
      selection: "79 174 127 / 0.3",
    },
  },
  {
    id: "teal",
    name: "Teal",
    light: {
      text: "20 24 24",
      background: "247 249 250",
      surface: "255 255 255",
      primary: "86 145 145",
      secondary: "134 180 180",
      accent: "52 109 109",
      highlight: "214 137 26",
      hover: "104 162 162",
      active: "72 130 130",
      selection: "86 145 145 / 0.25",
    },
    dark: {
      text: "235 240 240",
      background: "6 8 9",
      surface: "15 20 21",
      primary: "92 146 146",
      secondary: "132 170 170",
      accent: "58 115 115",
      highlight: "240 169 58",
      hover: "72 126 126",
      active: "51 95 95",
      selection: "72 126 126 / 0.35",
    },
  },
  {
    id: "earth",
    name: "Earth",
    light: {
      text: "27 24 22",
      background: "251 250 249",
      surface: "255 255 255",
      primary: "150 120 90",
      secondary: "209 189 164",
      accent: "128 102 77",
      highlight: "196 120 30",
      hover: "185 160 133",
      active: "145 118 93",
      selection: "185 160 133 / 0.25",
    },
    dark: {
      text: "248 247 247",
      background: "10 8 6",
      surface: "22 18 14",
      primary: "155 132 107",
      secondary: "113 91 68",
      accent: "201 172 141",
      highlight: "240 169 58",
      hover: "175 152 124",
      active: "131 112 90",
      selection: "175 152 124 / 0.35",
    },
  },
  {
    id: "ocean",
    name: "Ocean",
    light: {
      text: "10 12 14",
      background: "250 252 253",
      surface: "255 255 255",
      primary: "46 111 178",
      secondary: "137 187 226",
      accent: "36 92 150",
      highlight: "214 137 26",
      hover: "84 150 209",
      active: "52 116 162",
      selection: "84 150 209 / 0.25",
    },
    dark: {
      text: "244 245 246",
      background: "2 3 4",
      surface: "12 16 22",
      primary: "72 123 177",
      secondary: "33 74 115",
      accent: "108 178 222",
      highlight: "240 169 58",
      hover: "89 147 200",
      active: "54 97 140",
      selection: "89 147 200 / 0.35",
    },
  },
  {
    id: "indigo",
    name: "Indigo",
    light: {
      text: "15 17 20",
      background: "249 250 251",
      surface: "255 255 255",
      primary: "46 68 121",
      secondary: "79 103 163",
      accent: "116 142 210",
      highlight: "214 137 26",
      hover: "64 88 145",
      active: "35 55 100",
      selection: "116 142 210 / 0.25",
    },
    dark: {
      text: "248 247 247",
      background: "6 6 8",
      surface: "16 16 22",
      primary: "130 118 200",
      secondary: "95 85 153",
      accent: "171 159 243",
      highlight: "240 169 58",
      hover: "145 133 220",
      active: "108 98 173",
      selection: "145 133 220 / 0.35",
    },
  },
];

const ORCHARD = PALETTES[0];

const hexToRgb = (hex) => {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const triple = (rgb) => rgb.join(" ");

// WCAG relative luminance / contrast, to keep white text readable on buttons.
const luminance = (rgb) => {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

// A full theme generated from an organization's brand color. The primary is
// also used as text (links, active items), so it is adjusted to stay legible:
// in light mode against white button text, in dark mode against the dark
// background while keeping white button text readable.
export function brandColors(hex, mode) {
  const white = [255, 255, 255];
  const black = [0, 0, 0];
  const brand = hexToRgb(hex);
  let primary = brand;

  if (mode === "dark") {
    const base = [13, 17, 15];
    for (let i = 0; i < 20 && contrast(mix(base, primary, 0.06), primary) < 4.5; i++) {
      const lighter = mix(primary, white, 0.08);
      if (contrast(lighter, white) < 3) break;
      primary = lighter;
    }
    for (let i = 0; i < 20 && contrast(primary, white) < 3; i++) {
      primary = mix(primary, black, 0.08);
    }
    const background = mix(base, primary, 0.06);
    return {
      text: triple(mix([232, 237, 234], primary, 0.06)),
      background: triple(background),
      surface: triple(mix(background, primary, 0.06)),
      primary: triple(primary),
      secondary: triple(mix(primary, background, 0.55)),
      accent: triple(mix(primary, black, 0.18)),
      highlight: ORCHARD.dark.highlight,
      hover: triple(mix(primary, white, 0.15)),
      active: triple(mix(primary, black, 0.12)),
      selection: `${triple(primary)} / 0.3`,
    };
  }

  for (let i = 0; i < 20 && contrast(primary, white) < 4.5; i++) {
    primary = mix(primary, black, 0.08);
  }
  return {
    text: triple(mix([20, 26, 23], primary, 0.18)),
    background: triple(mix([246, 247, 246], primary, 0.03)),
    surface: "255 255 255",
    primary: triple(primary),
    secondary: triple(mix(primary, white, 0.6)),
    accent: triple(mix(primary, black, 0.25)),
    highlight: ORCHARD.light.highlight,
    hover: triple(mix(primary, white, 0.12)),
    active: triple(mix(primary, black, 0.15)),
    selection: `${triple(primary)} / 0.2`,
  };
}

// The theme to show. `palette` "brand" (or no choice, when the organization
// has a brand color) follows the organization; otherwise a named palette.
export function resolveTheme({ palette, mode }, brandColor) {
  const dark =
    mode === "dark" ||
    (mode !== "light" &&
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-color-scheme: dark)").matches);
  const scheme = dark ? "dark" : "light";

  if ((palette === "brand" || !palette) && brandColor) {
    return { scheme, colors: brandColors(brandColor, scheme) };
  }
  const named = PALETTES.find((p) => p.id === palette) || ORCHARD;
  return { scheme, colors: named[scheme] };
}

export const APPEARANCE_KEY = "farmexpo.appearance";
export const THEME_CACHE_KEY = "farmexpo.theme";

export function applyTheme({ scheme, colors }) {
  const root = document.documentElement;
  for (const [key, value] of Object.entries(colors)) {
    root.style.setProperty(`--color-${key}`, value);
  }
  root.classList.remove("light", "dark");
  root.classList.add(scheme);
  root.style.colorScheme = scheme;
  try {
    localStorage.setItem(THEME_CACHE_KEY, JSON.stringify({ scheme, colors }));
  } catch {}
}

// Runs before the page paints (inlined in app/layout.js) so the last theme
// shows immediately instead of flashing the defaults.
export const THEME_BOOT_SCRIPT = `(function(){try{var t=JSON.parse(localStorage.getItem("${THEME_CACHE_KEY}"));if(!t)return;var r=document.documentElement;for(var k in t.colors)r.style.setProperty("--color-"+k,t.colors[k]);r.classList.add(t.scheme);r.style.colorScheme=t.scheme;}catch(e){}})();`;
