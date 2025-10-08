"use client";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { useRouter, redirect } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FaUserPlus,
  FaUser,
  FaEnvelope,
  FaLock,
  FaCheck,
  FaArrowLeft,
} from "react-icons/fa";

export default function AddUser() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Check password strength
  useEffect(() => {
    const strength = calculatePasswordStrength(formData.password);
    setPasswordStrength(strength);
  }, [formData.password]);

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    return strength;
  };

  const getPasswordStrengthColor = (strength) => {
    if (strength === 0) return "bg-text/20";
    if (strength <= 2) return "bg-red-500";
    if (strength <= 3) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getPasswordStrengthText = (strength) => {
    if (strength === 0) return "Enter a password";
    if (strength <= 2) return "Weak";
    if (strength <= 3) return "Medium";
    return "Strong";
  };

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
        text: "Please fill in all required fields!",
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
        text: "Passwords do not match!",
        background: "rgb(var(--color-background))",
        color: "rgb(var(--color-text))",
        confirmButtonColor: "rgb(var(--color-primary))",
      });
      return;
    }

    if (passwordStrength < 3) {
      Swal.fire({
        icon: "warning",
        title: "Weak Password",
        text: "Please choose a stronger password for better security.",
        background: "rgb(var(--color-background))",
        color: "rgb(var(--color-text))",
        confirmButtonColor: "rgb(var(--color-primary))",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${apiUrl}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
        }),
      });

      if (!response.ok) {
        const errorMessage = await response.json();
        throw new Error(
          errorMessage.description || "Registration failed, please try again."
        );
      }

      Swal.fire({
        position: "top-center",
        icon: "success",
        title: "User Created!",
        text: "Account created successfully!",
        showConfirmButton: false,
        timer: 2000,
        background: "rgb(var(--color-background))",
        color: "rgb(var(--color-text))",
      });

      // Reset form
      setFormData({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
    } catch (error) {
      Swal.fire({
        position: "top-center",
        icon: "error",
        title: "Registration Failed",
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
    <div className="min-h-screen bg-background font-inter py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        {/* Header Section */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Back Button */}
          <div className="flex justify-start mb-6">
            <motion.button
              onClick={() => router.back()}
              whileHover={{ scale: 1.02, x: -2 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all duration-300 font-medium"
            >
              <FaArrowLeft className="text-sm" />
              Back
            </motion.button>
          </div>

          {/* Main Icon and Title */}
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
              <FaUserPlus className="text-3xl text-primary" />
            </div>
          </div>

          <h1 className="text-3xl font-poppins font-bold text-text mb-2">
            Add New User
          </h1>
          <p className="text-text/60 text-lg">
            Create a new account for team member
          </p>
        </motion.div>

        {/* Registration Form */}
        <motion.div
          className="bg-background border-2 border-primary/20 rounded-2xl shadow-xl p-6 sm:p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name Field */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <label
                htmlFor="fullName"
                className="flex items-center gap-2 text-text text-sm font-medium mb-3"
              >
                <FaUser className="text-primary/60 text-sm" />
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                placeholder="Enter full name"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                className="w-full p-3 border-2 border-primary/20 rounded-xl bg-background text-text placeholder:text-text/40 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 outline-none"
                required
              />
            </motion.div>

            {/* Email Field */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <label
                htmlFor="email"
                className="flex items-center gap-2 text-text text-sm font-medium mb-3"
              >
                <FaEnvelope className="text-primary/60 text-sm" />
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="Enter email address"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full p-3 border-2 border-primary/20 rounded-xl bg-background text-text placeholder:text-text/40 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 outline-none"
                required
              />
            </motion.div>

            {/* Password Field */}
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
              <input
                id="password"
                type="password"
                placeholder="Create a strong password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full p-3 border-2 border-primary/20 rounded-xl bg-background text-text placeholder:text-text/40 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 outline-none"
                required
              />

              {/* Password Strength Indicator */}
              {formData.password && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-2"
                >
                  <div className="flex justify-between text-xs text-text/60 mb-1">
                    <span>Password Strength</span>
                    <span
                      className={
                        passwordStrength >= 3
                          ? "text-green-500"
                          : passwordStrength >= 2
                          ? "text-yellow-500"
                          : "text-red-500"
                      }
                    >
                      {getPasswordStrengthText(passwordStrength)}
                    </span>
                  </div>
                  <div className="w-full bg-text/20 rounded-full h-2">
                    <motion.div
                      className={`h-2 rounded-full ${getPasswordStrengthColor(
                        passwordStrength
                      )}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${(passwordStrength / 5) * 100}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Confirm Password Field */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <label
                htmlFor="confirmpassword"
                className="flex items-center gap-2 text-text text-sm font-medium mb-3"
              >
                <FaCheck className="text-primary/60 text-sm" />
                Confirm Password
              </label>
              <input
                id="confirmpassword"
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                className={`w-full p-3 border-2 rounded-xl bg-background text-text placeholder:text-text/40 focus:ring-2 focus:ring-primary/20 transition-all duration-200 outline-none ${
                  formData.confirmPassword &&
                  formData.password !== formData.confirmPassword
                    ? "border-red-500 focus:border-red-500"
                    : "border-primary/20 focus:border-primary"
                }`}
                required
              />

              {/* Password Match Indicator */}
              {formData.confirmPassword && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`flex items-center gap-2 mt-2 text-xs ${
                    formData.password === formData.confirmPassword
                      ? "text-green-500"
                      : "text-red-500"
                  }`}
                >
                  {formData.password === formData.confirmPassword ? (
                    <>
                      <FaCheck className="text-xs" />
                      Passwords match
                    </>
                  ) : (
                    <>
                      <FaCheck className="text-xs opacity-50" />
                      Passwords do not match
                    </>
                  )}
                </motion.div>
              )}
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
              transition={{ delay: 0.6 }}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating User...
                </>
              ) : (
                <>
                  <FaUserPlus className="text-sm" />
                  Create User Account
                </>
              )}
            </motion.button>
          </form>
        </motion.div>

        {/* Additional Information */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-6 text-center"
        >
          <p className="text-text/40 text-sm">
            User will receive an email confirmation and can reset their password
            if needed.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
