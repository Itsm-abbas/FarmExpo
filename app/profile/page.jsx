"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { motion } from "framer-motion";
import Image from "next/image";
import fonts from "@utils/fonts";

export default function ProfileSettings() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "Abbas",
    email: "abbas@example.com",
    password: "",
  });
  const [avatar, setAvatar] = useState("/profile.png");
  const [isLoading, setIsLoading] = useState(false);

  // Handle profile update
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch(`${apiUrl}/auth/update-profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to update profile.");

      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Profile updated successfully!",
      });
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle avatar upload
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setAvatar(imageUrl);
    }
  };

  return (
    <motion.div
      className={`${fonts.poppins.className} flex items-center justify-center py-14 bg-gray-100 dark:bg-gray-800`}
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
          Profile Settings
        </motion.h2>

        {/* Profile Picture */}
        <motion.div
          className="flex flex-col items-center mb-6"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Image
            src={avatar}
            alt="Profile Picture"
            width={80}
            height={80}
            className="rounded-full border-2 border-PrimaryButton"
          />
          <label
            htmlFor="avatarUpload"
            className="mt-2 text-sm text-PrimaryButton cursor-pointer"
          >
            Change Avatar
          </label>
          <input
            id="avatarUpload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </motion.div>

        <motion.form
          onSubmit={handleSubmit}
          className="space-y-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          {/* Name Input */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">
              Name
            </label>
            <motion.input
              type="text"
              placeholder="Your name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="text-black dark:text-white mb-2 block w-full border border-LightBorder dark:border-DarkBorder dark:bg-[#2d3748] rounded-md p-2 focus:ring-PrimaryButton focus:border-PrimaryButton dark:focus:ring-PrimaryButton dark:focus:border-PrimaryButton outline-none"
              whileFocus={{ scale: 1.02 }}
              required
            />
          </div>

          {/* Email Input */}
          <div>
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
              className="text-black dark:text-white mb-2 block w-full border border-LightBorder dark:border-DarkBorder dark:bg-[#2d3748] rounded-md p-2 focus:ring-PrimaryButton focus:border-PrimaryButton dark:focus:ring-PrimaryButton dark:focus:border-PrimaryButton outline-none"
              whileFocus={{ scale: 1.02 }}
              required
            />
          </div>

          {/* Password Input */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">
              Password (leave empty to keep current password)
            </label>
            <motion.input
              type="password"
              placeholder="New password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="text-black dark:text-white mb-2 block w-full border border-LightBorder dark:border-DarkBorder dark:bg-[#2d3748] rounded-md p-2 focus:ring-PrimaryButton focus:border-PrimaryButton dark:focus:ring-PrimaryButton dark:focus:border-PrimaryButton outline-none"
              whileFocus={{ scale: 1.02 }}
            />
          </div>

          {/* Save Button */}
          <motion.button
            type="submit"
            className="uppercase w-full px-4 py-2 rounded-md text-white bg-PrimaryButton hover:bg-PrimaryButtonHover disabled:bg-gray-400 disabled:text-black"
            disabled={isLoading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isLoading ? "Updating..." : "Save Changes"}
          </motion.button>
        </motion.form>
      </motion.div>
    </motion.div>
  );
}
