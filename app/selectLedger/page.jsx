"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getCookie } from "cookies-next";

export default function LedgerSelection() {
  const router = useRouter();
  const [consignments, setConsignments] = useState([]);
  const token = getCookie("token");
  useEffect(() => {
    // Fetch consignments (Replace with API call if needed)
    const fetchConsignments = async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/consignment`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      setConsignments(data);
    };

    fetchConsignments();
  }, []);

  return (
    <motion.div
      className="min-h-screen p-6 bg-gray-100 dark:bg-gray-900 flex flex-col items-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.h1
        className="text-3xl font-bold mb-6 text-gray-800 dark:text-white"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        Select a Consignment for Ledger
      </motion.h1>

      <motion.div
        className="max-w-3xl w-full bg-white dark:bg-gray-800 shadow-md p-6 rounded-lg"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        {consignments.length === 0 ? (
          <motion.p
            className="text-center text-gray-600 dark:text-gray-300"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            No consignments found.
          </motion.p>
        ) : (
          <motion.ul className="space-y-4">
            {consignments.map((consignment, index) => (
              <motion.li
                key={consignment.id}
                className="flex justify-between items-center bg-gray-200 dark:bg-gray-700 p-4 rounded-md shadow-sm cursor-pointer"
                whileHover={{ scale: 1.02 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 + index * 0.1 }}
              >
                <span className="text-lg text-gray-800 dark:text-white">
                  Consignment #{consignment.id}
                </span>
                <motion.button
                  onClick={() => router.push(`/ledger/${consignment.id}`)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-all"
                  whileTap={{ scale: 0.95 }}
                >
                  View Ledger
                </motion.button>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </motion.div>
    </motion.div>
  );
}
