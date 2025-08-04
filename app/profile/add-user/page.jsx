"use client";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { useRouter, redirect } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import fonts from "@utils/fonts";

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
        title: "Error",
        text: "All fields are required!",
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Passwords do not match!",
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
        const errorMessage = await response.json(); // Get detailed error
        throw new Error(
          errorMessage.description || "Registration failed, please try again."
        );
      }

      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Account created successfully!",
      });
      // router.push("/auth/login");
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      className={`${fonts.poppins.className} capitalize py-14 flex items-center justify-center bg-gray-100 dark:bg-gray-800`}
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
          add user
        </motion.h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <label
              htmlFor="fullName"
              className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300"
            >
              Full Name
            </label>
            <motion.input
              id="fullName"
              type="text"
              placeholder="Enter your full name"
              value={formData.fullName}
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
              className="text-black dark:text-white mb-4 block w-full border border-LightBorder dark:border-DarkBorder dark:bg-[#2d3748] rounded-md p-2 focus:ring-PrimaryButton focus:border-PrimaryButton dark:focus:ring-PrimaryButton dark:focus:border-PrimaryButton outline-none placeholder:text-sm"
              whileFocus={{ scale: 1.02 }}
              required
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <label
              htmlFor="email"
              className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300"
            >
              Email
            </label>
            <motion.input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="text-black dark:text-white mb-4 block w-full border border-LightBorder dark:border-DarkBorder dark:bg-[#2d3748] rounded-md p-2 focus:ring-PrimaryButton focus:border-PrimaryButton dark:focus:ring-PrimaryButton dark:focus:border-PrimaryButton outline-none placeholder:text-sm"
              whileFocus={{ scale: 1.02 }}
              required
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <label
              htmlFor="password"
              className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300"
            >
              Password
            </label>
            <motion.input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="text-black dark:text-white mb-4 block w-full border border-LightBorder dark:border-DarkBorder dark:bg-[#2d3748] rounded-md p-2 focus:ring-PrimaryButton focus:border-PrimaryButton dark:focus:ring-PrimaryButton dark:focus:border-PrimaryButton outline-none placeholder:text-sm"
              whileFocus={{ scale: 1.02 }}
              required
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <label
              htmlFor="confirmpassword"
              className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300"
            >
              Confirm Password
            </label>
            <motion.input
              id="confirmpassword"
              type="password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
              className="text-black dark:text-white mb-4 block w-full border border-LightBorder dark:border-DarkBorder dark:bg-[#2d3748] rounded-md p-2 focus:ring-PrimaryButton focus:border-PrimaryButton dark:focus:ring-PrimaryButton dark:focus:border-PrimaryButton outline-none placeholder:text-sm"
              whileFocus={{ scale: 1.02 }}
              required
            />
          </motion.div>
          <motion.button
            type="submit"
            className="capitalize w-full px-4 py-2 rounded-md text-white bg-PrimaryButton hover:bg-PrimaryButtonHover disabled:bg-gray-400 disabled:text-black"
            disabled={isLoading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isLoading ? "adding user..." : "add user"}
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  );
}
