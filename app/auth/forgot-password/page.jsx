"use client";

import { useState } from "react";
import Swal from "sweetalert2";
import { motion } from "framer-motion";

export default function ForgotPassword() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      Swal.fire({ icon: "error", title: "Error", text: "Email is required!" });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${apiUrl}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error("Failed to send reset email.");
      }

      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Password reset email sent. Please check your inbox.",
      });
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-800"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="bg-white dark:bg-gray-900 shadow-lg rounded-lg p-8 w-full max-w-md"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <motion.h2
          className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-white"
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Forgot Password
        </motion.h2>

        <motion.form
          onSubmit={handleSubmit}
          className="space-y-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">
              Email
            </label>
            <motion.input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="text-black dark:text-white mb-2 block w-full border border-LightBorder dark:border-DarkBorder dark:bg-[#2d3748] rounded-md p-2 focus:ring-PrimaryButton focus:border-PrimaryButton dark:focus:ring-PrimaryButton dark:focus:border-PrimaryButton outline-none"
              whileFocus={{ scale: 1.02 }}
              required
            />
          </motion.div>

          <motion.button
            type="submit"
            className="uppercase w-full px-4 py-2 rounded-md text-white bg-PrimaryButton hover:bg-PrimaryButtonHover disabled:bg-gray-400 disabled:text-black"
            disabled={isLoading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isLoading ? "Sending..." : "Send Reset Link"}
          </motion.button>
        </motion.form>
      </motion.div>
    </motion.div>
  );
}
