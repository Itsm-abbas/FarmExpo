"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaEye,
  FaEyeSlash,
  FaUser,
  FaLock,
  FaArrowRight,
  FaLeaf,
  FaCheck,
  FaShieldAlt,
} from "react-icons/fa";
import { setCookie, getCookie } from "cookies-next";
import Link from "next/link";

export default function Login() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    const token = getCookie("token");
    if (token) {
      router.push("/");
    }
  }, [router]);

  const showError = (message) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(""), 4000);
  };

  const showSuccessMessage = () => {
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      window.location.replace("/");
    }, 2200);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      showError("Please fill in all required fields!");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch(`/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorMessage = await response.json();
        throw new Error(
          errorMessage.description || "Invalid credentials, please try again."
        );
      }

      const result = await response.json();

      // Set cookie if remember me is checked
      if (rememberMe) {
        setCookie("token", result.token, { maxAge: 30 * 24 * 60 * 60 }); // 30 days
      } else {
        setCookie("token", result.token);
      }

      showSuccessMessage();
    } catch (error) {
      showError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Professional Loading Component
  const ProfessionalLoader = () => (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="relative">
        {/* Outer rotating ring */}
        <motion.div
          className="w-16 h-16 border-4 border-primary/20 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />

        {/* Inner pulsing circle */}
        <motion.div
          className="absolute inset-0 m-auto w-8 h-8 bg-gradient-to-r from-primary to-accent rounded-full"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [1, 0.8, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Shield icon */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <FaShieldAlt className="text-white text-sm" />
        </motion.div>
      </div>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-text/70 text-sm font-medium tracking-wide"
      >
        SECURING YOUR ACCESS
      </motion.p>

      {/* Dots animation */}
      <div className="flex space-x-1">
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className="w-1 h-1 bg-primary rounded-full"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: index * 0.2,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </div>
  );

  // Professional Success Component
  const ProfessionalSuccess = () => (
    <div className="flex flex-col items-center justify-center space-y-6">
      {/* Animated checkmark */}
      <div className="relative">
        {/* Background circle */}
        <motion.div
          className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full shadow-2xl"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 15,
            delay: 0.1,
          }}
        />

        {/* Checkmark */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{
            duration: 0.8,
            delay: 0.5,
            ease: "easeInOut",
          }}
        >
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <motion.path
              d="M20 6L9 17l-5-5"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{
                duration: 0.6,
                delay: 0.8,
                ease: "easeInOut",
              }}
            />
          </svg>
        </motion.div>

        {/* Pulsing rings */}
        <motion.div
          className="absolute inset-0 border-2 border-green-500/30 rounded-full"
          initial={{ scale: 1, opacity: 0.8 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeOut",
            delay: 1,
          }}
        />
        <motion.div
          className="absolute inset-0 border-2 border-green-500/20 rounded-full"
          initial={{ scale: 1, opacity: 0.6 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeOut",
            delay: 1.2,
          }}
        />
      </div>

      {/* Success text */}
      <div className="text-center space-y-3">
        <motion.h3
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="text-2xl font-bold text-text bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent"
        >
          Access Granted
        </motion.h3>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="text-text/60 text-sm"
        >
          Welcome to FarmExpo Management
        </motion.p>
      </div>

      {/* Progress bar */}
      <div className="w-48 bg-gray-200/20 rounded-full h-1 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{
            duration: 2,
            ease: "linear",
            delay: 0.5,
          }}
        />
      </div>

      {/* Security badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.2 }}
        className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full"
      >
        <FaShieldAlt className="text-green-500 text-xs" />
        <span className="text-green-600 text-xs font-medium">SECURE LOGIN</span>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-emerald-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 font-inter flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating particles */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-primary/10 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.3, 0.8, 0.3],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Success Overlay */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-white/95 dark:bg-gray-800/95 border border-white/20 rounded-3xl shadow-2xl p-8 max-w-sm w-full backdrop-blur-sm"
            >
              <ProfessionalSuccess />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-md w-full relative z-10">
        {/* Error Message */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl backdrop-blur-sm"
            >
              <div className="flex items-center gap-3">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0"
                >
                  <span className="text-white text-xs font-bold">!</span>
                </motion.div>
                <p className="text-red-700 dark:text-red-300 text-sm font-medium">
                  {errorMessage}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header Section */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Logo */}
          <Link href="/">
            <motion.div
              className="flex items-center justify-center gap-3 mb-6 group cursor-pointer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center shadow-lg"
              >
                <FaLeaf className="text-white text-xl" />
              </motion.div>
              <div className="flex items-baseline gap-1">
                <motion.span
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-primary font-poppins text-3xl sm:text-4xl font-bold"
                >
                  Farm
                </motion.span>
                <motion.span
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-text font-poppins text-2xl sm:text-3xl font-semibold"
                >
                  Expo
                </motion.span>
              </div>
            </motion.div>
          </Link>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-2xl sm:text-3xl font-poppins font-bold text-text mb-2"
          >
            Secure Access
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-text/60 text-lg"
          >
            Enter your credentials to continue
          </motion.p>
        </motion.div>

        {/* Login Form */}
        <motion.div
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-white/20 dark:border-gray-700/50 rounded-2xl shadow-2xl p-6 sm:p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {isLoading ? (
            <div className="py-12">
              <ProfessionalLoader />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Form fields remain the same as before */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
<<<<<<< HEAD
                <label
                  htmlFor="email"
                  className="flex items-center gap-2 text-text text-sm font-medium mb-3"
=======
                <FaUser className="text-primary/60 text-sm" />
                Email Address
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full p-3 border-2 border-primary/20 rounded-xl bg-background text-text placeholder:text-text/40 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 outline-none pl-10"
                  required
                  disabled={isLoading}
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text/40">
                  <FaUser className="text-sm" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <label
                htmlFor="password"
                className="flex items-center gap-2 text-text text-sm font-medium mb-3"
              >
                <FaLock className="text-primary/60 text-sm" />
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full p-3 border-2 border-primary/20 rounded-xl bg-background text-text placeholder:text-text/40 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 outline-none pl-10 pr-10"
                  required
                  disabled={isLoading}
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text/40">
                  <FaLock className="text-sm" />
                </div>
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text/40 hover:text-text/60 transition-colors duration-200"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
>>>>>>> 89c1ee4bf1e88431cdeb1ef51420b8c1ba0da593
                >
                  <FaUser className="text-primary/60 text-sm" />
                  Email Address
                </label>
                <div className="relative">
                  <motion.input
                    whileFocus={{ scale: 1.01 }}
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-text placeholder:text-text/40 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 outline-none pl-10"
                    required
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text/40">
                    <FaUser className="text-sm" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <label
                  htmlFor="password"
                  className="flex items-center gap-2 text-text text-sm font-medium mb-3"
                >
                  <FaLock className="text-primary/60 text-sm" />
                  Password
                </label>
                <div className="relative">
                  <motion.input
                    whileFocus={{ scale: 1.01 }}
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-text placeholder:text-text/40 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 outline-none pl-10 pr-10"
                    required
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text/40">
                    <FaLock className="text-sm" />
                  </div>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text/40 hover:text-text/60 transition-colors duration-200"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <FaEyeSlash className="text-sm" />
                    ) : (
                      <FaEye className="text-sm" />
                    )}
                  </motion.button>
                </div>
              </motion.div>

              <motion.div
                className="flex items-center justify-between"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <label className="flex items-center gap-2 text-text/60 text-sm cursor-pointer">
                  <motion.input
                    whileTap={{ scale: 0.9 }}
                    type="checkbox"
                    checked={rememberMe}
                    onChange={() => setRememberMe(!rememberMe)}
                    className="w-4 h-4 text-primary bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-primary/20 focus:ring-2"
                  />
                  Remember me
                </label>

                <Link
                  href="/auth/forgot-password"
                  className="text-primary hover:text-accent text-sm font-medium transition-colors duration-200"
                >
                  Forgot Password?
                </Link>
              </motion.div>

              <motion.button
                type="submit"
                className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-primary to-accent text-white hover:from-primary/90 hover:to-accent/90 px-6 py-4 rounded-xl transition-all duration-200 font-semibold shadow-lg hover:shadow-xl relative overflow-hidden group"
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "200%" }}
                  transition={{ duration: 1, ease: "easeInOut" }}
                />
                <span>Secure Login</span>
                <FaArrowRight className="text-sm group-hover:translate-x-1 transition-transform duration-200" />
              </motion.button>
            </form>
          )}
        </motion.div>

        {/* Footer */}
        <motion.div
          className="text-center mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <p className="text-text/40 text-sm flex items-center justify-center gap-2">
            <FaShieldAlt className="text-primary/60 text-xs" />
            Protected by FarmExpo Security
          </p>
        </motion.div>
      </div>
    </div>
  );
}
