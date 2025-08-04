"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import font from "@utils/fonts";
import { FaBars, FaTimes } from "react-icons/fa";
import ThemeToggle from "../ThemeToggle";
import Sidebar from "../Siderbar";
import { motion, AnimatePresence } from "framer-motion";
import { deleteCookie } from "cookies-next";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

export default function Header() {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null); // Added ref for dropdown

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const LogoutUser = async () => {
    setIsDropdownOpen(false);

    try {
      // Call the logout API to remove cookie from the server
      await fetch("/api/auth/logout", {
        method: "POST",
      });

      // Optional: Clear local cookies too (double safety)
      deleteCookie("token");

      // Clear react-query cache if you're using it
      queryClient.clear();

      // Redirect to login page
      router.replace("/auth/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <>
      {/* Header */}
      <motion.div
        className="bg-white dark:bg-gray-900 text-black dark:text-white sticky top-0 left-0 right-0 z-50 shadow-lg w-full flex items-center justify-between py-4 px-5 sm:px-8 md:px-16"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div
          className={`${font.montserrat.className} font-medium md:flex gap-16 items-center text-2xl max-sm:text-[18px]`}
        >
          <Link href={"/"}>
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
          </Link>
          <motion.button
            onClick={toggleSidebar}
            className={`text-white md:text-xl bg-PrimaryButton px-4 py-2 rounded-md block md:ml-6`}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            {isSidebarOpen ? <FaTimes /> : <FaBars />}
          </motion.button>
        </div>

        <ThemeToggle />

        <div className="flex gap-8 max-sm:gap-4 relative" ref={dropdownRef}>
          <motion.button
            className={`${font.poppins.className} text-white flex items-center gap-3 bg-PrimaryButton hover:bg-PrimaryButtonHover transition-all duration-200 px-2 py-1 md:px-4 md:py-2 rounded-md rounded-r-xl`}
            onClick={toggleDropdown}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <p className="truncate">
              Profile
              {/* {data?.fullName.trim().split(" ")[0]} */}
            </p>
          </motion.button>

          {/* Profile Dropdown */}
          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                className="absolute right-0 capitalize top-10 md:top-14 bg-white dark:bg-DarkSBg shadow-lg rounded-md w-36 md:w-48 p-1 md:p-2 text-black dark:text-white"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Link
                  onClick={() => setIsDropdownOpen(false)}
                  href="/admin/manage-users"
                  className="block px-2 md:px-4 py-1 md:py-2 hover:bg-LightPBg dark:hover:bg-DarkPBg rounded-md"
                >
                  Manage users
                </Link>
                <Link
                  onClick={() => setIsDropdownOpen(false)}
                  href="/profile"
                  className="block px-2 md:px-4 py-1 md:py-2 hover:bg-LightPBg dark:hover:bg-DarkPBg rounded-md"
                >
                  Settings
                </Link>

                <button
                  onClick={() => LogoutUser()}
                  className="block w-full text-left px-2 md:px-4 py-1 md:py-2 hover:bg-LightPBg dark:hover:bg-DarkPBg rounded-md"
                >
                  Logout
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Sidebar */}
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
    </>
  );
}
