"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { FaBars, FaUser, FaCog, FaUsers, FaSignOutAlt } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { deleteCookie } from "cookies-next";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import Sidebar from "@components/Siderbar";

export default function Header() {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

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
      await fetch("/api/auth/logout", {
        method: "POST",
      });
      deleteCookie("token");
      queryClient.clear();
      router.replace("/auth/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <>
      {/* Header */}
      <motion.header
        className="bg-background border-b-2 border-primary/20 sticky top-0 left-0 right-0 z-50 shadow-lg font-inter"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="w-full flex items-center justify-between py-4 px-4 lg:px-0 max-w-7xl mx-auto">
          {/* Left Section - Logo and Mobile Menu Button */}
          <div className="flex items-center gap-4">
            {/* Logo */}
            <Link href={"/"}>
              <motion.div
                className="flex items-center gap-2"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-baseline gap-1">
                  <motion.span
                    className="text-primary font-poppins text-2xl sm:text-3xl font-bold"
                    whileHover={{ scale: 1.1 }}
                  >
                    Farm
                  </motion.span>
                  <motion.span
                    className="text-text font-poppins text-xl sm:text-2xl font-semibold"
                    whileHover={{ scale: 1.1 }}
                  >
                    Expo
                  </motion.span>
                </div>
                <div className="w-2 h-2 bg-accent rounded-full"></div>
              </motion.div>
            </Link>

            {/* Mobile Menu Button - Only show on mobile */}
            <motion.button
              onClick={toggleSidebar}
              className="flex items-center justify-center w-10 h-10 bg-primary text-white rounded-xl hover:bg-accent transition-all duration-200 lg:hidden"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaBars className="text-sm" />
            </motion.button>
          </div>

          {/* Right Section - Profile Dropdown */}
          <div className="flex items-center gap-4 relative" ref={dropdownRef}>
            {/* Profile Dropdown Trigger */}
            <motion.button
              className="flex items-center gap-3 bg-accent text-white hover:bg-accent transition-all duration-200 px-4 py-2 rounded-xl font-inter font-medium group"
              onClick={toggleDropdown}
              whileHover={{ scale: 1.05, y: -1 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <FaUser className="text-sm" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-sm font-semibold leading-none">
                  Profile
                </span>
                <span className="text-xs text-white/70 leading-none mt-1">
                  Administrator
                </span>
              </div>
              <motion.div
                animate={{ rotate: isDropdownOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="w-4 h-4 flex items-center justify-center"
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </motion.div>
            </motion.button>

            {/* Enhanced Profile Dropdown */}
            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  className="absolute right-0 top-14 bg-background border-2 border-primary/20 rounded-xl shadow-2xl w-56 p-2 z-50"
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  {/* User Info Section */}
                  <div className="px-3 py-2 border-b border-primary/10 mb-2">
                    <p className="text-text font-semibold text-sm">
                      Farm Expo Admin
                    </p>
                    <p className="text-text/60 text-xs">admin@farmexpo.com</p>
                  </div>

                  {/* Dropdown Items */}
                  <div className="space-y-1">
                    <Link
                      onClick={() => setIsDropdownOpen(false)}
                      href="/admin/manage-users"
                      className="flex items-center gap-3 px-3 py-2 text-text hover:bg-primary/10 rounded-lg transition-all duration-200 group"
                    >
                      <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                        <FaUsers className="text-sm text-primary" />
                      </div>
                      <span className="font-inter font-medium">
                        Manage Users
                      </span>
                    </Link>

                    <Link
                      onClick={() => setIsDropdownOpen(false)}
                      href="/profile"
                      className="flex items-center gap-3 px-3 py-2 text-text hover:bg-primary/10 rounded-lg transition-all duration-200 group"
                    >
                      <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                        <FaCog className="text-sm text-primary" />
                      </div>
                      <span className="font-inter font-medium">Settings</span>
                    </Link>

                    <div className="border-t border-primary/10 pt-1 mt-1">
                      <button
                        onClick={LogoutUser}
                        className="flex items-center gap-3 w-full px-3 py-2 text-text hover:bg-red-500/10 hover:text-red-600 rounded-lg transition-all duration-200 group"
                      >
                        <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center group-hover:bg-red-500/30 transition-colors">
                          <FaSignOutAlt className="text-sm text-red-500" />
                        </div>
                        <span className="font-inter font-medium">Logout</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.header>

      {/* Sidebar */}
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
    </>
  );
}
