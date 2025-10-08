"use client";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { useRouter, redirect } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaCheckCircle,
  FaArrowLeft,
} from "react-icons/fa";

export default function Register() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.fullName ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      Swal.fire({
        icon: "error",
        title: "Missing Information",
        text: "Please fill in all fields to continue.",
        background: "rgb(var(--color-background))",
        color: "rgb(var(--color-text))",
        confirmButtonColor: "rgb(var(--color-primary))",
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Swal.fire({
        icon: "error",
        title: "Password Mismatch",
        text: "Your passwords don't match. Please try again.",
        background: "rgb(var(--color-background))",
        color: "rgb(var(--color-text))",
        confirmButtonColor: "rgb(var(--color-primary))",
      });
      return;
    }

    if (formData.password.length < 6) {
      Swal.fire({
        icon: "warning",
        title: "Weak Password",
        text: "Password should be at least 6 characters long.",
        background: "rgb(var(--color-background))",
        color: "rgb(var(--color-text))",
        confirmButtonColor: "rgb(var(--color-primary))",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          name: formData.fullName,
          password: formData.password,
        }),
      });

      if (!response.ok) {
        const errorMessage = await response.json();
        throw new Error(
          errorMessage.error || "Registration failed, please try again."
        );
      }

      await Swal.fire({
        icon: "success",
        title: "Welcome Aboard!",
        text: "Your account has been created successfully!",
        showConfirmButton: false,
        timer: 2000,
        background: "rgb(var(--color-background))",
        color: "rgb(var(--color-text))",
        iconColor: "rgb(var(--color-primary))",
      });

      router.push("/auth/login");
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Registration Failed",
        text: error.message,
        background: "rgb(var(--color-background))",
        color: "rgb(var(--color-text))",
        confirmButtonColor: "rgb(var(--color-primary))",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, color: "bg-gray-300" };
    if (password.length < 6) return { strength: 33, color: "bg-red-500" };
    if (password.length < 8) return { strength: 66, color: "bg-yellow-500" };
    return { strength: 100, color: "bg-green-500" };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Back Button */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 text-text/60 hover:text-text transition-colors duration-200 group"
          >
            <FaArrowLeft className="group-hover:-translate-x-1 transition-transform duration-200" />
            <span>Back to Login</span>
          </Link>
        </motion.div>

        {/* Card */}
        <motion.div
          className="bg-background rounded-2xl shadow-2xl border border-primary/20 overflow-hidden"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-8 text-center border-b border-primary/20">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: "spring" }}
              className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <FaUser className="text-2xl text-primary" />
            </motion.div>
            <motion.h1
              className="text-3xl font-bold font-poppins text-text"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              Create Account
            </motion.h1>
            <motion.p
              className="text-text/60 mt-2 font-inter"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              Join us and get started today
            </motion.p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Full Name */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
            >
              <div className="relative">
                <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-text/40 text-lg" />
                <input
                  type="text"
                  placeholder="Full Name"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  onFocus={() => setFocusedField("fullName")}
                  onBlur={() => setFocusedField("")}
                  className="w-full bg-background border-2 border-primary/20 rounded-xl pl-12 pr-4 py-4 text-text placeholder:text-text/40 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all duration-200"
                  required
                />
              </div>
            </motion.div>

            {/* Email */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
            >
              <div className="relative">
                <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-text/40 text-lg" />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField("")}
                  className="w-full bg-background border-2 border-primary/20 rounded-xl pl-12 pr-4 py-4 text-text placeholder:text-text/40 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all duration-200"
                  required
                />
              </div>
            </motion.div>

            {/* Password */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9 }}
            >
              <div className="relative">
                <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-text/40 text-lg" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField("")}
                  className="w-full bg-background border-2 border-primary/20 rounded-xl pl-12 pr-12 py-4 text-text placeholder:text-text/40 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all duration-200"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text/40 hover:text-text transition-colors duration-200"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {formData.password && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-2"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-full bg-gray-300 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${passwordStrength.color}`}
                        style={{ width: `${passwordStrength.strength}%` }}
                      />
                    </div>
                    <span className="text-xs text-text/60">
                      {passwordStrength.strength}%
                    </span>
                  </div>
                  <p className="text-xs text-text/60">
                    {passwordStrength.strength < 33 && "Weak password"}
                    {passwordStrength.strength >= 33 &&
                      passwordStrength.strength < 66 &&
                      "Medium strength"}
                    {passwordStrength.strength >= 66 && "Strong password"}
                  </p>
                </motion.div>
              )}
            </motion.div>

            {/* Confirm Password */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.0 }}
            >
              <div className="relative">
                <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-text/40 text-lg" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                  onFocus={() => setFocusedField("confirmPassword")}
                  onBlur={() => setFocusedField("")}
                  className="w-full bg-background border-2 border-primary/20 rounded-xl pl-12 pr-12 py-4 text-text placeholder:text-text/40 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all duration-200"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text/40 hover:text-text transition-colors duration-200"
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>

              {/* Password Match Indicator */}
              {formData.confirmPassword && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 mt-2"
                >
                  <FaCheckCircle
                    className={`text-sm ${
                      formData.password === formData.confirmPassword
                        ? "text-green-500"
                        : "text-red-500"
                    }`}
                  />
                  <span
                    className={`text-xs ${
                      formData.password === formData.confirmPassword
                        ? "text-green-500"
                        : "text-red-500"
                    }`}
                  >
                    {formData.password === formData.confirmPassword
                      ? "Passwords match"
                      : "Passwords don't match"}
                  </span>
                </motion.div>
              )}
            </motion.div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-primary to-accent text-white font-poppins font-semibold py-4 rounded-xl hover:from-primary/90 hover:to-accent/90 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl relative overflow-hidden group"
              whileHover={{ scale: isLoading ? 1 : 1.02 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 }}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isLoading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <FaUser className="text-sm" />
                    Create Account
                  </>
                )}
              </span>

              {/* Animated background */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                initial={false}
              />
            </motion.button>
          </form>

          {/* Footer */}
          <motion.div
            className="px-8 py-6 bg-primary/5 border-t border-primary/10 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            <p className="text-text/60 font-inter">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="text-primary hover:text-accent font-semibold transition-colors duration-200 hover:underline"
              >
                Sign In
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
