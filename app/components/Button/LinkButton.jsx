import React from "react";
import Link from "next/link";
import fonts from "@utils/fonts";
import { motion } from "framer-motion";

const LinkButton = ({ title, desc, href, icon: Icon }) => {
  return (
    <Link href={href} legacyBehavior>
      <motion.a
        className={`cursor-pointer group block rounded-lg border border-gray-300 dark:border-gray-700 shadow-md hover:shadow-lg transition-shadow duration-300 p-3 hover:bg-gray-200 dark:hover:bg-gray-700 ${fonts.poppins.className}`}
        whileHover={{ scale: 1.01 }} // Scale up on hover
        whileTap={{ scale: 0.99 }} // Scale down on tap
        initial={{ opacity: 0, y: 10 }} // Initial animation state
        animate={{ opacity: 1, y: 0 }} // Animate to this state
        transition={{ duration: 0.3 }} // Animation duration
      >
        <div className="flex items-center space-x-4">
          {Icon && (
            <motion.div
              className="p-2 rounded-full bg-PrimaryButton text-white"
              whileHover={{ rotate: 10 }} // Rotate icon on hover
              transition={{ type: "spring", stiffness: 300 }} // Spring animation
            >
              <Icon className="text-lg" />
            </motion.div>
          )}
          <div>
            <h3 className="text-base sm:text-lg text-gray-800 dark:text-gray-200">
              {title}
            </h3>
            {desc && (
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                {desc}
              </p>
            )}
          </div>
        </div>
      </motion.a>
    </Link>
  );
};

export default LinkButton;
