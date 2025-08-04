"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FaArrowRight, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { SidebarLinks } from "@constants/Links";
import fonts from "@utils/fonts";
import { motion, AnimatePresence } from "framer-motion";
// import { useQuery } from "@tanstack/react-query";
// import { fetchUser } from "@constants/consignmentAPI";

export default function Sidebar({ isSidebarOpen, onClose }) {
  const [openDropdown, setOpenDropdown] = useState(null);

  const toggleDropdown = (index) => {
    setOpenDropdown(openDropdown === index ? null : index);
  };

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (event.target.closest(".sidebar-content")) return;
      onClose();
    };

    if (isSidebarOpen) {
      document.addEventListener("click", handleOutsideClick);
    }

    return () => {
      document.removeEventListener("click", handleOutsideClick);
    };
  }, [isSidebarOpen, onClose]);

  return (
    <>
      {isSidebarOpen && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-70 z-40"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}

      <motion.div
        className={`${fonts?.poppins.className}   sidebar-content fixed top-0 left-0 h-full w-64 sm:w-72 bg-gray-200 shadow-lg text-black dark:bg-gray-900 dark:text-white z-50 
          overflow-y-scroll scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-300 dark:scrollbar-track-gray-800`}
        initial={{ x: "-100%" }}
        animate={{ x: isSidebarOpen ? "0%" : "-100%" }}
        transition={{ duration: 0.3 }}
      >
        <p className=" flex items-center justify-center w-full py-4">
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
        {/* <div className="w-full flex flex-col items-center justify-center p-4">
          <Image
            className="rounded-full border-2 border-white"
            src="/profile.png"
            width={70}
            height={70}
            alt="profile"
          />
          <p className="mt-2 font-semibold text-base sm:text-lg">
            {data?.fullName}
            User
          </p>
        </div> */}

        <nav className="flex flex-col space-y-4 p-4">
          {SidebarLinks.map((category, index) => (
            <div key={index} className="flex flex-col">
              <button
                onClick={() => toggleDropdown(index)}
                className="flex items-center justify-between p-2 sm:p-3 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 rounded-lg text-sm sm:text-base transition-colors duration-200"
              >
                <span>{category.name}</span>
                <motion.div
                  animate={{ rotate: openDropdown === index ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {openDropdown === index ? <FaChevronUp /> : <FaChevronDown />}
                </motion.div>
              </button>

              <AnimatePresence>
                {openDropdown === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden pl-2 mt-1"
                  >
                    <div className="flex flex-col border-l-2 border-gray-400 dark:border-gray-600">
                      {category.links.map((link, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1, duration: 0.2 }}
                          className="flex truncate items-center space-x-2 pl-4 py-1 sm:py-1.5 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                        >
                          <FaArrowRight className="text-xs text-gray-600 dark:text-gray-400" />
                          <Link href={link.href} onClick={onClose}>
                            <span className="hover:text-PrimaryButton cursor-pointer text-xs sm:text-sm">
                              {link.name}
                            </span>
                          </Link>
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
