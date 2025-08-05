"use client";

import { useState } from "react";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import fonts from "@utils/fonts";
import { setCookie } from "cookies-next";

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
        icon: "error",
        title: "Error",
        text: "All fields are required!",
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

      // Automatically redirect to the home page
      router.push("/");
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      className={`${fonts.poppins.className} py-14 flex flex-col gap-10 items-center justify-center bg-gray-100 dark:bg-gray-800`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <p className="hidden md:flex gap-1 items-center">
        <motion.span
          className="text-PrimaryButton text-3xl"
          whileHover={{ scale: 1.1 }}
        >
          Farm
        </motion.span>
        <motion.span
          className="text-LightPText dark:text-DarkPText text-2xl"
          whileHover={{ scale: 1.1 }}
        >
          Expo
        </motion.span>
      </p>
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
          Login
        </motion.h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">
              Email
            </label>
            <motion.input
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="text-black dark:text-white mb-4 block w-full border border-LightBorder dark:border-DarkBorder dark:bg-[#2d3748] rounded-md p-2 focus:ring-PrimaryButton focus:border-PrimaryButton dark:focus:ring-PrimaryButton dark:focus:border-PrimaryButton outline-none"
              whileFocus={{ scale: 1.02 }}
              required
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">
              Password
            </label>
            <div className="relative">
              <motion.input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="text-black dark:text-white mb-4 block w-full border border-LightBorder dark:border-DarkBorder dark:bg-[#2d3748] rounded-md p-2 pr-10 focus:ring-PrimaryButton focus:border-PrimaryButton dark:focus:ring-PrimaryButton dark:focus:border-PrimaryButton outline-none"
                whileFocus={{ scale: 1.02 }}
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-3 flex items-center text-gray-500 dark:text-gray-400"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <FaEyeSlash className="h-5 w-5" />
                ) : (
                  <FaEye className="h-5 w-5" />
                )}
              </button>
            </div>
          </motion.div>
          <motion.div
            className="flex items-center justify-between"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {/* <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={() => setRememberMe(!rememberMe)}
                className="text-green-600"
              />
              <span>Remember Me</span>
            </label> */}
            {/* <Link
              href="/auth/forgot-password"
              className="text-sm text-green-600 hover:underline"
            >
              Forgot Password?
            </Link> */}
          </motion.div>
          <motion.button
            type="submit"
            className="uppercase w-full px-4 py-2 rounded-md text-white bg-PrimaryButton hover:bg-PrimaryButtonHover disabled:bg-gray-400 disabled:text-black"
            disabled={isLoading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isLoading ? "Logging in..." : "Login"}
          </motion.button>
          {/* <div className="space-y-3 uppercase flex justify-center items-center w-full">
            or
          </div>

          <Link href="/auth/signup">
            <motion.button
              type="submit"
              className="uppercase w-full px-4 py-2 rounded-md text-white bg-SecondaryButton hover:bg-SecondaryButtonHover mt-4"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Create Account
            </motion.button>
          </Link> */}
        </form>
      </motion.div>
    </motion.div>
  );
}
