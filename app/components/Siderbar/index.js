"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FaArrowRight,
  FaChevronDown,
  FaChevronUp,
  FaTimes,
} from "react-icons/fa";
import { SidebarLinks } from "@constants/Links";
import { motion, AnimatePresence } from "framer-motion";

// Icon mapping for sidebar categories
const categoryIcons = {
  Consignee: "👤",
  Vendor: "🏪",
  Items: "📦",
  Reports: "📊",
  Settings: "⚙️",
};

export default function Sidebar({ isSidebarOpen, onClose }) {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const toggleDropdown = (index) => {
    setOpenDropdown(openDropdown === index ? null : index);
  };

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (event.target.closest(".sidebar-content")) return;
      if (isMobile && isSidebarOpen) {
        onClose();
      }
    };

    if (isMobile && isSidebarOpen) {
      document.addEventListener("click", handleOutsideClick);
    }

    return () => {
      document.removeEventListener("click", handleOutsideClick);
    };
  }, [isSidebarOpen, onClose, isMobile]);

  // Close sidebar on escape key (mobile only)
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape" && isSidebarOpen && isMobile) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isSidebarOpen, onClose, isMobile]);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isMobile) {
      if (isSidebarOpen) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "unset";
      }
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isSidebarOpen, isMobile]);

  const getCategoryIcon = (categoryName) => {
    return categoryIcons[categoryName] || "📁";
  };

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isSidebarOpen && isMobile && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        className={`
          font-inter sidebar-content fixed top-0 left-0 h-full z-50 overflow-y-auto
          transition-all duration-300 ease-in-out
          scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent
          hover:scrollbar-thumb-primary/40
          ${
            isMobile
              ? `w-80 bg-background border-r border-primary/20 shadow-2xl`
              : `bg-background/95 backdrop-blur-sm border-r border-primary/10 hover:border-primary/20 
             hover:bg-background hover:shadow-xl`
          }
          ${!isMobile && (isHovered ? "w-64" : "w-16")}
        `}
        initial={isMobile ? { x: "-100%" } : false}
        animate={isMobile ? { x: isSidebarOpen ? 0 : "-100%" } : { x: 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        onMouseEnter={() => !isMobile && setIsHovered(true)}
        onMouseLeave={() => !isMobile && setIsHovered(false)}
      >
        {/* Header Section - Only show on mobile or when expanded */}
        {(isMobile || isHovered) && (
          <div className="flex items-center justify-between p-4 border-b border-primary/10">
            <Link
              href="/"
              onClick={() => isMobile && onClose()}
              className="flex items-center gap-2 group"
            >
              <motion.div
                className="flex items-baseline gap-1"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <span className="text-primary font-poppins text-xl font-bold">
                  Farm
                </span>
                <span className="text-text font-poppins text-lg font-semibold">
                  Expo
                </span>
              </motion.div>
            </Link>

            {/* Close Button - Only show on mobile */}
            {isMobile && (
              <motion.button
                onClick={onClose}
                className="flex items-center justify-center w-8 h-8 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-white transition-all duration-200"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <FaTimes className="text-sm" />
              </motion.button>
            )}
          </div>
        )}

        {/* Navigation Section */}
        <nav className={`flex flex-col space-y-1 ${isMobile ? "p-4" : "p-2"}`}>
          {SidebarLinks.map((category, index) => (
            <div key={category.name} className="flex flex-col">
              {/* Category Header */}
              <motion.button
                onClick={() => toggleDropdown(index)}
                className={`
                  flex items-center w-full transition-all duration-200 group
                  ${
                    isMobile || isHovered
                      ? "justify-between p-3 hover:bg-primary/5 rounded-xl"
                      : "justify-center p-3 hover:bg-primary/10 rounded-lg"
                  }
                `}
                whileHover={{ x: isMobile || isHovered ? 2 : 0 }}
                whileTap={{ scale: 0.98 }}
              >
                <div
                  className={`flex items-center ${
                    isMobile || isHovered ? "gap-3" : "gap-0"
                  }`}
                >
                  <div
                    className={`
                    flex items-center justify-center transition-all duration-200
                    ${
                      isMobile || isHovered
                        ? "w-8 h-8 bg-primary/10 rounded-lg group-hover:bg-primary/20"
                        : "w-10 h-10 bg-primary/5 rounded-xl group-hover:bg-primary/10"
                    }
                  `}
                  >
                    <span
                      className={`
                      transition-all duration-200
                      ${isMobile || isHovered ? "text-base" : "text-lg"}
                    `}
                    >
                      {getCategoryIcon(category.name)}
                    </span>
                  </div>

                  {/* Category Name - Only show when expanded or on mobile */}
                  {(isMobile || isHovered) && (
                    <span className="text-text font-medium text-sm group-hover:text-primary transition-colors duration-200 truncate">
                      {category.name}
                    </span>
                  )}
                </div>

                {/* Dropdown Arrow - Only show when expanded or on mobile */}
                {(isMobile || isHovered) &&
                  category.links &&
                  category.links.length > 0 && (
                    <motion.div
                      animate={{ rotate: openDropdown === index ? 180 : 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="text-primary/40 group-hover:text-primary transition-colors duration-200"
                    >
                      {openDropdown === index ? (
                        <FaChevronUp size={12} />
                      ) : (
                        <FaChevronDown size={12} />
                      )}
                    </motion.div>
                  )}
              </motion.button>

              {/* Dropdown Content - Only show when expanded or on mobile */}
              <AnimatePresence>
                {(isMobile || isHovered) && openDropdown === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div
                      className={`flex flex-col border-l-2 border-primary/10 ${
                        isMobile ? "ml-4" : "ml-2"
                      } mt-1 mb-2 py-1`}
                    >
                      {category.links.map((link, idx) => (
                        <motion.div
                          key={link.name}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{
                            delay: idx * 0.05,
                            duration: 0.2,
                            ease: "easeOut",
                          }}
                          className="relative"
                        >
                          <Link
                            href={link.href}
                            onClick={() => isMobile && onClose()}
                            className={`
                              flex items-center transition-all duration-200 group
                              ${
                                isMobile
                                  ? "gap-3 pl-4 pr-3 py-2.5 hover:bg-primary/5 rounded-lg"
                                  : "gap-2 pl-3 pr-2 py-2 hover:bg-primary/5 rounded-md"
                              }
                            `}
                          >
                            {/* Animated Arrow */}
                            <motion.div
                              className="text-primary/30 group-hover:text-primary transition-colors duration-200"
                              whileHover={{ x: 2 }}
                              transition={{ duration: 0.2 }}
                            >
                              <FaArrowRight size={isMobile ? 10 : 8} />
                            </motion.div>

                            {/* Link Text */}
                            <span
                              className={`
                              text-text/80 group-hover:text-text transition-colors duration-200 flex-1 truncate
                              ${isMobile ? "text-sm" : "text-xs"}
                            `}
                            >
                              {link.name}
                            </span>

                            {/* Hover Effect Line */}
                            <motion.div
                              className="absolute left-0 top-1/2 w-0.5 h-4 bg-primary rounded-r -translate-y-1/2 opacity-0 group-hover:opacity-100"
                              initial={false}
                              transition={{ duration: 0.2 }}
                            />
                          </Link>

                          {/* Subtle separator */}
                          {idx < category.links.length - 1 && (
                            <div
                              className={`h-px bg-primary/5 ${
                                isMobile ? "mx-4" : "mx-2"
                              }`}
                            />
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </nav>
      </motion.div>
    </>
  );
}
