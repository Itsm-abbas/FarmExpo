import { useTheme } from "@context/ThemeContext";
import { FaSun, FaMoon } from "react-icons/fa"; // Import icons
import fonts from "@utils/fonts"; // Import fonts
import { motion } from "framer-motion"; // Import Framer Motion

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.div
      className={`relative w-fit`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.button
        onClick={toggleTheme}
        className={`${fonts.poppins.className} flex items-center gap-2 p-2 px-4 bg-DarkPBg dark:bg-LightPBg rounded-md text-DarkPText dark:text-LightPText transition-all`}
        whileTap={{
          scale: 0.95,
          rotate: 10,
          transition: { duration: 0.2 },
        }}
      >
        {theme === "light" ? (
          <>
            <motion.div
              initial={{ rotate: -90 }}
              animate={{ rotate: 0 }}
              transition={{ duration: 0.3 }}
            >
              <FaMoon className="text-purple-600" />
            </motion.div>
            <span className="hidden md:block">Switch to Dark</span>
          </>
        ) : (
          <>
            <motion.div
              initial={{ rotate: 90 }}
              animate={{ rotate: 0 }}
              transition={{ duration: 0.3 }}
            >
              <FaSun className="text-yellow-400" />
            </motion.div>
            <span className="hidden md:block">Switch to Light</span>
          </>
        )}
      </motion.button>

      {/* Background Swipe Effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-dark to-light rounded-md"
        style={{
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: -1, // To make sure it is behind the button
        }}
        initial={{ width: "0%" }}
        animate={{
          width: theme === "light" ? "100%" : "0%",
        }}
        transition={{
          duration: 0.5,
          ease: "easeInOut",
        }}
      />
    </motion.div>
  );
}
