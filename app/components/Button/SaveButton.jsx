import React from "react";
import { motion } from "framer-motion";
const SaveButton = ({ handleSubmit, isLoading, existingData }) => {
  return (
    <motion.button
      onClick={handleSubmit}
      className={`
        relative w-full px-6 py-3 rounded-xl font-poppins font-medium text-white
        uppercase tracking-wide transition-all duration-300 overflow-hidden
        ${
          isLoading
            ? "bg-primary/70 cursor-not-allowed"
            : existingData
            ? "bg-accent hover:bg-accent/90 shadow-lg hover:shadow-xl"
            : "bg-accent hover:bg-accent/90 shadow-lg hover:shadow-xl"
        }
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
      disabled={isLoading}
      whileHover={!isLoading ? { scale: 1.02, y: -1 } : {}}
      whileTap={!isLoading ? { scale: 0.98 } : {}}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Loading animation */}
      {isLoading && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}

      {/* Button content */}
      <span className="relative z-10 flex items-center justify-center space-x-2">
        {isLoading && (
          <motion.svg
            className="w-4 h-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </motion.svg>
        )}
        <span>
          {isLoading ? "Saving..." : existingData ? "Update" : "Save"}
        </span>
      </span>
    </motion.button>
  );
};

export default SaveButton;
