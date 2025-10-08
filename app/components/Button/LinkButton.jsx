import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";

const LinkButton = ({ title, desc, href, icon: Icon }) => {
  return (
    <Link href={href} legacyBehavior>
      <motion.a
        className="group relative block cursor-pointer overflow-hidden rounded-xl border border-primary/20 bg-background p-4 font-poppins shadow-sm transition-all duration-300 hover:border-primary/40 hover:shadow-lg"
        whileHover={{
          scale: 1.02,
          y: -2,
        }}
        whileTap={{ scale: 0.98 }}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.4,
          type: "spring",
          stiffness: 200,
        }}
      >
        {/* Background gradient on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        <div className="relative z-10 flex items-center space-x-4">
          {Icon && (
            <motion.div
              className="flex items-center justify-center rounded-xl bg-primary p-3 text-white shadow-lg"
              whileHover={{
                scale: 1.1,
              }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 10,
              }}
            >
              <Icon className="text-xl" />
            </motion.div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-text truncate">
              {title}
            </h3>
            {desc && (
              <p className="mt-1 text-sm text-text/70 font-inter line-clamp-2">
                {desc}
              </p>
            )}
          </div>

          {/* Arrow indicator */}
          <motion.div
            className="text-primary opacity-0 group-hover:opacity-100 transition-all duration-300"
            initial={{ x: -5 }}
            whileHover={{ x: 0 }}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </motion.div>
        </div>
      </motion.a>
    </Link>
  );
};

export default LinkButton;
