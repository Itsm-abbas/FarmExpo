/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class", // Enable class-based dark mode
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // For light theme
        LightPBg: "#F3F4F6",
        LightSBg: "#D1D5DB",

        LightBorder: "#D1D5DB",
        LightFocusLine: "#3B82F6",
        LightPText: "#1F2937",
        LightSText: "#6B7280",
        LightSidebar: "#F9FAFB",
        // For dark theme
        DarkPBg: "#1F2937",
        DarkSBg: "#374151",
        DarkBorder: "#4B5563",
        DarkFocusLine: "#10B981",
        DarkPText: "#F3F4F6",
        DarkSText: "#9CA3AF",
        DarkSidebar: "#374151",
        DarkInput: "#2d3748",
        //Button
        PrimaryButton: "#10B981",
        PrimaryButtonHover: "#059669",
        SecondaryButton: "#3B82F6",
        SecondaryButtonHover: "#2563EB",
        CancelButton: "#dc2626",
        CancelButtonHover: "#ef4444",
        // primaryColor: "rgb(22 163 74)",
        // hover1: "#15803d",
        // secondaryColor: "rgb(37 99 235)",
        // themeDark: "rgb(31 41 55)",
      },
    },
  },
};
