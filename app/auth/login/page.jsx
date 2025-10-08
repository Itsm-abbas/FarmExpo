"use client";

import { useState } from "react";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  FaEye,
  FaEyeSlash,
  FaUser,
  FaLock,
  FaArrowRight,
  FaSeedling,
} from "react-icons/fa";
import { setCookie } from "cookies-next";
import Link from "next/link";

export default function Login() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      Swal.fire({
        position: "top-center",
        icon: "warning",
        title: "Missing Information",
        text: "Please fill in all required fields!",
        background: "rgb(var(--color-background))",
        color: "rgb(var(--color-text))",
        confirmButtonColor: "rgb(var(--color-primary))",
      });
      return;
    }

    setIsLoading(true);
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

      Swal.fire({
        position: "top-center",
        icon: "success",
        title: "Welcome Back!",
        text: "Login successful",
        showConfirmButton: false,
        timer: 1500,
        background: "rgb(var(--color-background))",
        color: "rgb(var(--color-text))",
      });

      // Redirect to home page after success
      router.push("/");
    } catch (error) {
      Swal.fire({
        position: "top-center",
        icon: "error",
        title: "Login Failed",
        text: error.message,
        confirmButtonColor: "rgb(var(--color-primary))",
        background: "rgb(var(--color-background))",
        color: "rgb(var(--color-text))",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background font-inter flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Header Section */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Logo */}
          <Link href="/">
            <motion.div
              className="flex items-center justify-center gap-2 mb-6 group cursor-pointer"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-baseline gap-1">
                <span className="text-primary font-poppins text-3xl sm:text-4xl font-bold">
                  Farm
                </span>
                <span className="text-text font-poppins text-2xl sm:text-3xl font-semibold">
                  Expo
                </span>
              </div>
              <div className="w-2 h-2 bg-accent rounded-full group-hover:scale-110 transition-transform"></div>
            </motion.div>
          </Link>

          <h1 className="text-2xl sm:text-3xl font-poppins font-bold text-text mb-2">
            Welcome Back
          </h1>
          <p className="text-text/60 text-lg">Sign in to your account</p>
        </motion.div>

        {/* Login Form */}
        <motion.div
          className="bg-background border-2 border-primary/20 rounded-2xl shadow-xl p-6 sm:p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <label
                htmlFor="email"
                className="flex items-center gap-2 text-text text-sm font-medium mb-3"
              >
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

            {/* Password Field */}
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
                >
                  {showPassword ? (
                    <FaEyeSlash className="text-sm" />
                  ) : (
                    <FaEye className="text-sm" />
                  )}
                </button>
              </div>
            </motion.div>

            {/* Remember Me & Forgot Password */}
            <motion.div
              className="flex items-center justify-between"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <label className="flex items-center gap-2 text-text/60 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                  className="w-4 h-4 text-primary bg-background border-primary/30 rounded focus:ring-primary/20 focus:ring-2"
                  disabled={isLoading}
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

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 bg-primary text-white hover:bg-accent disabled:bg-text/30 disabled:cursor-not-allowed px-6 py-3 rounded-xl transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
              whileHover={!isLoading ? { scale: 1.02, y: -1 } : {}}
              whileTap={!isLoading ? { scale: 0.98 } : {}}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing In...
                </>
              ) : (
                <>
                  Sign In
                  <FaArrowRight className="text-sm" />
                </>
              )}
            </motion.button>
          </form>

          {/* Divider */}
          {/* <motion.div
            className="flex items-center my-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <div className="flex-1 border-t border-primary/10"></div>
            <span className="px-4 text-text/40 text-sm">New to Farm Expo?</span>
            <div className="flex-1 border-t border-primary/10"></div>
          </motion.div> */}

          {/* Create Account Button */}
          {/* <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <Link href="/auth/signup">
              <button
                className="w-full flex items-center justify-center gap-2 bg-secondary/10 text-text border-2 border-secondary/20 hover:bg-secondary/20 px-6 py-3 rounded-xl transition-all duration-200 font-medium"
                disabled={isLoading}
              >
                <FaSeedling className="text-sm" />
                Create New Account
              </button>
            </Link>
          </motion.div> */}
        </motion.div>

        {/* Footer */}
        <motion.div
          className="text-center mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <p className="text-text/40 text-sm">
            Secure login with Farm Expo Management System
          </p>
        </motion.div>
      </div>
    </div>
  );
}
