"use client";

import { useState, useEffect, useRef } from "react";
import {
  FaPalette,
  FaCheck,
  FaMoon,
  FaSun,
  FaTimes,
  FaInfoCircle,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
const palettes = {
  dark: [
    {
      id: "dark-1",
      name: "Dark Teal",
      colors: {
        text: "235 240 240",
        background: "6 8 9",
        primary: "92 146 146",
        secondary: "132 170 170",
        accent: "58 115 115",
        hover: "72 126 126",
        active: "51 95 95",
        selection: "72 126 126 / 0.35", // translucent teal glow
      },
    },
    {
      id: "dark-2",
      name: "Dark Brown",
      colors: {
        text: "248 247 247",
        background: "10 8 6",
        primary: "155 132 107",
        secondary: "113 91 68",
        accent: "201 172 141",
        hover: "175 152 124",
        active: "131 112 90",
        selection: "175 152 124 / 0.35",
      },
    },
    {
      id: "dark-3",
      name: "Dark Blue",
      colors: {
        text: "244 245 246",
        background: "2 3 4",
        primary: "72 123 177",
        secondary: "33 74 115",
        accent: "108 178 222",
        hover: "89 147 200",
        active: "54 97 140",
        selection: "89 147 200 / 0.35",
      },
    },
    {
      id: "dark-4",
      name: "Dark Gold",
      colors: {
        text: "244 245 246",
        background: "5 5 5",
        primary: "173 136 36",
        secondary: "112 104 90",
        accent: "218 187 92",
        hover: "191 154 44",
        active: "145 112 27",
        selection: "191 154 44 / 0.35",
      },
    },
    {
      id: "dark-5",
      name: "Dark Purple",
      colors: {
        text: "248 247 247",
        background: "6 6 8",
        primary: "130 118 200",
        secondary: "95 85 153",
        accent: "171 159 243",
        hover: "145 133 220",
        active: "108 98 173",
        selection: "145 133 220 / 0.35",
      },
    },
  ],

  light: [
    {
      id: "light-1",
      name: "Light Teal",
      colors: {
        text: "20 24 24",
        background: "247 249 250",
        primary: "86 145 145",
        secondary: "134 180 180",
        accent: "52 109 109",
        hover: "104 162 162",
        active: "72 130 130",
        selection: "86 145 145 / 0.25",
      },
    },
    {
      id: "light-2",
      name: "Light Brown",
      colors: {
        text: "27 24 22",
        background: "251 250 249",
        primary: "168 142 115",
        secondary: "209 189 164",
        accent: "128 102 77",
        hover: "185 160 133",
        active: "145 118 93",
        selection: "185 160 133 / 0.25",
      },
    },
    {
      id: "light-3",
      name: "Light Blue",
      colors: {
        text: "10 12 14",
        background: "250 252 253",
        primary: "68 133 192",
        secondary: "137 187 226",
        accent: "46 111 178",
        hover: "84 150 209",
        active: "52 116 162",
        selection: "84 150 209 / 0.25",
      },
    },
    {
      id: "light-4",
      name: "Light Gold",
      colors: {
        text: "20 20 20",
        background: "250 250 249",
        primary: "229 185 71",
        secondary: "113 104 90",
        accent: "43 33 9",
        hover: "240 198 93",
        active: "197 158 54",
        selection: "240 198 93 / 0.25",
      },
    },
    {
      id: "light-5",
      name: "Light Navy",
      colors: {
        text: "15 17 20",
        background: "249 250 251",
        primary: "46 68 121",
        secondary: "79 103 163",
        accent: "116 142 210",
        hover: "64 88 145",
        active: "35 55 100",
        selection: "116 142 210 / 0.25",
      },
    },
  ],
};

export default function PaletteSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPalette, setCurrentPalette] = useState("dark-1");
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    // Load saved preferences
    const savedPalette = localStorage.getItem("colorPalette");
    const savedTheme = localStorage.getItem("theme");
    const hasSeenTutorial = localStorage.getItem("hasSeenPaletteTutorial");

    if (savedPalette) setCurrentPalette(savedPalette);
    if (savedTheme) setIsDarkMode(savedTheme === "dark");

    // Show tutorial on first visit
    if (!hasSeenTutorial) {
      setTimeout(() => setShowTutorial(true), 2000);
    }

    applyPalette(savedPalette || "dark-1", savedTheme !== "light");

    // Add click outside listener
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        // Check if the click is not on the toggle button
        const toggleButton = document.querySelector(".palette-toggle-button");
        if (toggleButton && !toggleButton.contains(event.target)) {
          setIsOpen(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const applyPalette = (paletteId, darkMode) => {
    const paletteType = paletteId.split("-")[0];
    const palette =
      palettes[paletteType].find((p) => p.id === paletteId) || palettes.dark[0];

    const root = document.documentElement;
    const theme = darkMode ? "dark" : "light";

    // Apply CSS variables
    Object.entries(palette.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });

    // Apply theme class
    root.classList.remove("light", "dark");
    root.classList.add(theme);

    // Save preferences
    localStorage.setItem("colorPalette", paletteId);
    localStorage.setItem("theme", theme);

    setCurrentPalette(paletteId);
    setIsDarkMode(darkMode);
  };

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    const newPaletteId = currentPalette.replace(
      isDarkMode ? "dark" : "light",
      newTheme ? "dark" : "light"
    );
    applyPalette(newPaletteId, newTheme);
  };

  const closeTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem("hasSeenPaletteTutorial", "true");
  };

  return (
    <>
      {/* Tutorial Message */}
      <AnimatePresence>
        {showTutorial && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-20 right-6 z-50 max-w-xs bg-background border border-accent rounded-2xl shadow-2xl p-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <FaInfoCircle className="text-accent text-sm" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-text mb-1">
                  Customize Your Experience
                </h4>
                <p className="text-text/70 text-sm mb-3">
                  Click the palette button to change colors and switch between
                  dark/light mode!
                </p>
                <button
                  name="closetutorial"
                  onClick={closeTutorial}
                  className="w-full py-2 bg-accent text-background rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors"
                >
                  Got It!
                </button>
              </div>
            </div>

            {/* Pointer arrow */}
            <div className="absolute -bottom-2 right-8 w-4 h-4 bg-accent transform rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Palette Switcher */}
      <div className="fixed bottom-6 right-6 z-50">
        {/* Main toggle button */}
        <motion.button
          aria-label="colorswitch"
          onClick={() => setIsOpen(!isOpen)}
          className="palette-toggle-button w-14 h-14 bg-background rounded-full shadow-2xl border-2 border-accent/30 flex items-center justify-center hover:shadow-xl transition-all duration-300 group"
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.9 }}
          animate={{
            boxShadow: isOpen
              ? "0 0 0 4px rgba(var(--color-accent), 0.2)"
              : "0 10px 25px rgba(0, 0, 0, 0.1)",
          }}
        >
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <FaPalette className="text-text text-xl group-hover:text-accent transition-colors" />
          </motion.div>

          {/* Pulse animation effect */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-accent/50"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeOut",
            }}
          />
        </motion.button>

        {/* Palette panel */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={panelRef}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="absolute bottom-16 right-0 w-80 bg-background rounded-2xl shadow-2xl border border-secondary/20 p-6 backdrop-blur-sm bg-background/95"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-text">
                  Theme Customizer
                </h3>
                <button
                  name="closebutton"
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-secondary/10 transition-colors"
                >
                  <FaTimes className="text-text/70 text-sm" />
                </button>
              </div>

              {/* Theme Toggle */}
              <div className="flex items-center justify-between mb-6 p-3 bg-secondary/5 rounded-xl">
                <div className="flex items-center gap-3">
                  {isDarkMode ? (
                    <FaMoon className="text-accent text-lg" />
                  ) : (
                    <FaSun className="text-accent text-lg" />
                  )}
                  <span className="text-text font-medium">
                    {isDarkMode ? "Dark Mode" : "Light Mode"}
                  </span>
                </div>
                <button
                  name="toggletheme"
                  onClick={toggleTheme}
                  className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${
                    isDarkMode ? "bg-accent" : "bg-primary"
                  }`}
                >
                  <motion.div
                    className={`absolute top-1 w-4 h-4 rounded-full bg-background shadow-lg`}
                    initial={false}
                    animate={{
                      x: isDarkMode ? 26 : 2,
                    }}
                    transition={{ duration: 0.3 }}
                  />
                </button>
              </div>

              {/* Color Palettes */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-text/70 mb-3 uppercase tracking-wide">
                  Color Schemes
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {palettes[isDarkMode ? "dark" : "light"].map((palette) => (
                    <motion.button
                      key={palette.id}
                      onClick={() => applyPalette(palette.id, isDarkMode)}
                      className="relative p-3 rounded-xl border-2 transition-all duration-200 group"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      style={{
                        borderColor:
                          currentPalette === palette.id
                            ? "rgb(var(--color-accent))"
                            : "rgb(var(--color-secondary)/0.2)",
                        background: "rgb(var(--color-background))",
                      }}
                    >
                      <div className="flex gap-1 mb-2 justify-center">
                        <div
                          className="w-5 h-5 rounded-full shadow-sm"
                          style={{
                            backgroundColor: `rgb(${palette.colors.primary})`,
                          }}
                        />
                        <div
                          className="w-5 h-5 rounded-full shadow-sm"
                          style={{
                            backgroundColor: `rgb(${palette.colors.accent})`,
                          }}
                        />
                        <div
                          className="w-5 h-5 rounded-full shadow-sm"
                          style={{
                            backgroundColor: `rgb(${palette.colors.secondary})`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-text block text-center font-medium">
                        {palette.name}
                      </span>
                      {currentPalette === palette.id && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-accent rounded-full flex items-center justify-center shadow-md"
                        >
                          <FaCheck className="text-white text-xs" />
                        </motion.div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-secondary/10">
                <p className="text-xs text-text/60 text-center">
                  Customize your browsing experience
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
