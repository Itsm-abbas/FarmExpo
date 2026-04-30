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
        <div className="w-full flex items-center justify-between py-3 sm:py-4 px-3 sm:px-4 lg:px-0 max-w-7xl mx-auto">
          {/* Left Section - Logo and Mobile Menu Button */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile Menu Button - Only show on mobile */}
            <motion.button
              onClick={toggleSidebar}
              className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-primary text-white rounded-lg sm:rounded-xl hover:bg-accent transition-all duration-200 lg:hidden"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaBars className="text-xs sm:text-sm" />
            </motion.button>

            {/* Logo */}
            <Link href={"/"}>
              <motion.div
                className="flex items-center gap-1 sm:gap-2"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-baseline gap-0 sm:gap-1">
                  <motion.span
                    className="text-primary font-poppins text-xl sm:text-2xl lg:text-3xl font-bold"
                    whileHover={{ scale: 1.1 }}
                  >
                    Farm
                  </motion.span>
                  <motion.span
                    className="text-text font-poppins text-lg sm:text-xl lg:text-2xl font-semibold"
                    whileHover={{ scale: 1.1 }}
                  >
                    Expo
                  </motion.span>
                </div>
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-accent rounded-full hidden sm:block"></div>
              </motion.div>
            </Link>
          </div>

          {/* Right Section - Profile Dropdown */}
          <div
            className="flex items-center gap-2 sm:gap-3 relative"
            ref={dropdownRef}
          >
            {/* Profile Dropdown Trigger - Compact on mobile */}
            <motion.button
              className="flex items-center gap-1 sm:gap-3 bg-accent text-white hover:bg-accent/90 transition-all duration-200 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-inter font-medium group min-w-0"
              onClick={toggleDropdown}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Avatar - Always visible */}
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <FaUser className="text-xs sm:text-sm" />
              </div>

              {/* Text - Hidden on small mobile, visible on larger screens */}
              <div className="hidden xs:flex flex-col items-start max-w-[80px] sm:max-w-none">
                <span className="text-xs sm:text-sm font-semibold leading-none truncate">
                  Profile
                </span>
                <span className="text-[10px] sm:text-xs text-white/70 leading-none mt-0.5 truncate">
                  Admin
                </span>
              </div>

              {/* Dropdown Arrow - Hidden on smallest screens */}
              <motion.div
                animate={{ rotate: isDropdownOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="w-3 h-3 sm:w-4 sm:h-4 flex items-center justify-center hidden xs:flex"
              >
                <svg
                  className="w-2 h-2 sm:w-3 sm:h-3"
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
                  className="absolute right-0 top-10 sm:top-12 bg-background border-2 border-primary/20 rounded-xl shadow-2xl w-48 sm:w-56 p-2 z-50"
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  {/* User Info Section */}
                  <div className="px-2 sm:px-3 py-1.5 sm:py-2 border-b border-primary/10 mb-1 sm:mb-2">
                    <p className="text-text font-semibold text-xs sm:text-sm truncate">
                      Farm Expo Admin
                    </p>
                    <p className="text-text/60 text-[10px] sm:text-xs truncate">
                      admin@farmexpo.com
                    </p>
                  </div>

                  {/* Dropdown Items */}
                  <div className="space-y-0.5 sm:space-y-1">
                    <Link
                      onClick={() => setIsDropdownOpen(false)}
                      href="/admin/manage-users"
                      className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-1.5 sm:py-2 text-text hover:bg-primary/10 rounded-lg transition-all duration-200 group"
                    >
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary/20 rounded-lg flex items-center justify-center group-hover:bg-primary/30 transition-colors flex-shrink-0">
                        <FaUsers className="text-xs sm:text-sm text-primary" />
                      </div>
                      <span className="font-inter font-medium text-xs sm:text-sm">
                        Manage Users
                      </span>
                    </Link>

                    <Link
                      onClick={() => setIsDropdownOpen(false)}
                      href="/profile"
                      className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-1.5 sm:py-2 text-text hover:bg-primary/10 rounded-lg transition-all duration-200 group"
                    >
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary/20 rounded-lg flex items-center justify-center group-hover:bg-primary/30 transition-colors flex-shrink-0">
                        <FaCog className="text-xs sm:text-sm text-primary" />
                      </div>
                      <span className="font-inter font-medium text-xs sm:text-sm">
                        Settings
                      </span>
                    </Link>

                    <div className="border-t border-primary/10 pt-0.5 sm:pt-1 mt-0.5 sm:mt-1">
                      <button
                        onClick={LogoutUser}
                        className="flex items-center gap-2 sm:gap-3 w-full px-2 sm:px-3 py-1.5 sm:py-2 text-text hover:bg-red-500/10 hover:text-red-600 rounded-lg transition-all duration-200 group"
                      >
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-500/20 rounded-lg flex items-center justify-center group-hover:bg-red-500/30 transition-colors flex-shrink-0">
                          <FaSignOutAlt className="text-xs sm:text-sm text-red-500" />
                        </div>
                        <span className="font-inter font-medium text-xs sm:text-sm">
                          Logout
                        </span>
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
