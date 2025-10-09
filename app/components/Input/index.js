import React, { useState } from "react";
import { motion } from "framer-motion";
import { FaEye, FaEyeSlash, FaCalendarAlt } from "react-icons/fa";

const Input = ({
  id,
  type,
  value,
  onChange,
  placeholder,
  classes = "",
  label,
  error,
  success,
  disabled = false,
  required = false,
  icon: Icon,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const inputType = type === "password" && showPassword ? "text" : type;
  const isDateType = type === "date";
  const DateIcon = isDateType && !Icon ? FaCalendarAlt : Icon;

  const getBorderColor = () => {
    if (error) return "border-red-500";
    if (success) return "border-green-500";
    if (isFocused) return "border-primary";
    return "border-primary/30";
  };

  const getTextColor = () => {
    if (error) return "text-red-500";
    if (success) return "text-green-500";
    if (isFocused) return "text-primary";
    return "text-text/60";
  };

  const getRingColor = () => {
    if (error) return "focus:ring-red-500/20 focus:border-red-500";
    if (success) return "focus:ring-green-500/20 focus:border-green-500";
    return "focus:ring-primary/20 focus:border-primary";
  };

  const getLabelLeftPosition = () => {
    return DateIcon ? "left-12" : "left-4";
  };

  const hasValue = Boolean(value);
  const shouldLabelFloat = isFocused || hasValue;

  // For date inputs, we need special handling to show native placeholder
  const showDatePlaceholder = isDateType && !value && !isFocused;

  return (
    <div className={`font-inter relative w-full ${classes}`}>
      <div className="relative">
        {/* Input Field - Special handling for date inputs */}
        <motion.input
          id={id}
          type={inputType}
          className={`
            w-full bg-background text-text
            border-2 ${getBorderColor()} rounded-xl pt-3 md:pt-5 pb-3 px-4
            ${getRingColor()} outline-none transition-all duration-200
            ${
              disabled
                ? "opacity-50 cursor-not-allowed"
                : "hover:border-primary/50"
            }
            ${DateIcon ? "pl-12" : "pl-4"}
            ${type === "password" || success ? "pr-12" : ""}
            ${isDateType ? "" : "placeholder-transparent"}
          `}
          value={value}
          onChange={onChange}
          onFocus={() => !disabled && setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          // For date inputs, use empty placeholder to show native "mm/dd/yyyy"
          // For other inputs, use the provided placeholder for floating label
          placeholder={isDateType ? "" : placeholder}
          disabled={disabled}
          required={required}
          initial={{ scale: 1 }}
          whileFocus={{ scale: disabled ? 1 : 1.02 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          {...props}
        />

        {/* Animated Label - Show for all inputs */}
        <motion.label
          htmlFor={id}
          className={`
            absolute ${getLabelLeftPosition()} pointer-events-none transition-all duration-200 font-medium
            ${getTextColor()} ${disabled ? "opacity-50" : ""} origin-left
          `}
          initial={{
            top: "50%",
            y: "-50%",
            fontSize: "16px",
          }}
          animate={{
            top: shouldLabelFloat ? "8px" : "50%",
            y: shouldLabelFloat ? "-80%" : "-50%",
            fontSize: shouldLabelFloat ? "12px" : "16px",
            scale: shouldLabelFloat ? 0.85 : 1,
            backgroundColor: shouldLabelFloat
              ? "rgb(var(--color-background))"
              : "transparent",
            padding: shouldLabelFloat ? "0 8px" : "0 0px",
            transformOrigin: "left center",
          }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {label || placeholder}
          {required && <span className="text-red-500 ml-1">*</span>}
        </motion.label>

        {/* Left Icon */}
        {DateIcon && (
          <motion.div
            className="absolute left-4 text-text/40"
            animate={{
              top: shouldLabelFloat ? "20px" : "50%",
              y: shouldLabelFloat ? "0%" : "-50%",
            }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <DateIcon className="text-lg" />
          </motion.div>
        )}

        {/* Password Visibility Toggle */}
        {type === "password" && (
          <motion.button
            type="button"
            className="absolute right-4 text-text/40 hover:text-text/60 transition-colors duration-200"
            animate={{
              top: shouldLabelFloat ? "20px" : "50%",
              y: shouldLabelFloat ? "0%" : "-50%",
            }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={() => setShowPassword(!showPassword)}
            disabled={disabled}
          >
            {showPassword ? (
              <FaEyeSlash className="text-lg" />
            ) : (
              <FaEye className="text-lg" />
            )}
          </motion.button>
        )}

        {/* Success Icon */}
        {success && (
          <motion.div
            className="absolute right-4 text-green-500"
            animate={{
              top: shouldLabelFloat ? "20px" : "50%",
              y: shouldLabelFloat ? "0%" : "-50%",
            }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </motion.div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-500 text-xs mt-2 flex items-center gap-1"
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </motion.p>
      )}

      {/* Success Message */}
      {success && typeof success === "string" && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-green-500 text-xs mt-2 flex items-center gap-1"
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          {success}
        </motion.p>
      )}

      {/* Character Count */}
      {props.maxLength && (
        <div className="flex justify-between text-xs mt-1">
          <span className="text-text/40">
            {value?.length || 0} / {props.maxLength} characters
          </span>
        </div>
      )}
    </div>
  );
};

export default Input;
