import React, { useState } from "react";
import fonts from "@utils/fonts";
import { motion } from "framer-motion";

const Input = ({ id, type, value, onChange, placeholder, classes = "" }) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className={`${fonts.poppins.className} relative w-full`}>
      {/* Animated Label */}
      {type !== "date" && (
        <motion.label
          htmlFor={id}
          className="absolute text-gray-500 transition-all pointer-events-none"
          initial={{ top: "50%", left: "12px", fontSize: "16px", opacity: 0.8 }}
          animate={{
            top: isFocused || value ? "-18px" : "20%",
            left: isFocused || value ? "8px" : "12px",
            fontSize: isFocused || value ? "12px" : "15px",
            opacity: isFocused || value ? 1 : 0.8,
            color: isFocused ? "#3b82f6" : "#6b7280", // Change label color on focus
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }} // Smoother animation
        >
          {placeholder}
        </motion.label>
      )}
      {type === "date" && (
        <motion.label
          htmlFor={id}
          className=" text-gray-500 text-sm transition-all"
        >
          {placeholder}
        </motion.label>
      )}

      {/* Input Field */}
      <motion.input
        id={id}
        type={type}
        min={1}
        className={`${classes} text-black dark:text-white mb-4 ${
          type !== "date" && "mt-7"
        } block w-full border border-LightBorder dark:border-DarkBorder dark:bg-DarkInput rounded-md p-2 focus:ring-PrimaryButton focus:border-PrimaryButton dark:focus:ring-PrimaryButton dark:focus:border-PrimaryButton outline-none`}
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        required
        initial={{ scale: 1 }}
        whileFocus={{ scale: 1.02 }} // Slight scale-up on focus
        transition={{ duration: 0.3, ease: "easeInOut" }} // Smooth transition
      />
    </div>
  );
};

export default Input;
