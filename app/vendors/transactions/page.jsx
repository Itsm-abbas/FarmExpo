// app/vendors/transactions/page.jsx
"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaBuilding,
  FaExchangeAlt,
  FaEye,
  FaUsers,
  FaWallet,
} from "react-icons/fa";

export default function VendorsTransactionsPage() {
  const {
    data: vendors = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["vendors-list"],
    queryFn: async () => {
      const res = await fetch("/api/vendors/transactions");
      if (!res.ok) throw new Error("Failed to load vendors");
      return res.json();
    },
    staleTime: 1000 * 60 * 2,
  });

  if (isError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaExchangeAlt className="text-2xl text-red-500" />
          </div>
          <h2 className="text-xl font-poppins font-semibold text-text mb-2">
            Failed to Load Vendors
          </h2>
          <p className="text-text/60">
            There was an error loading the vendor data.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-inter py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
              <FaUsers className="text-3xl text-primary" />
            </div>
          </div>
          <h1 className="text-3xl lg:text-4xl font-poppins font-bold text-text mb-2">
            Vendors & Balances
          </h1>
          <p className="text-text/60 text-lg">
            Manage and monitor vendor transactions and balances
          </p>
        </motion.div>

        {/* Stats Overview */}
        {!isLoading && vendors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          >
            <div className="bg-background border-2 border-primary/20 rounded-2xl p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                <FaBuilding className="text-primary text-xl" />
              </div>
              <h3 className="text-text font-semibold text-lg">
                {vendors.length}
              </h3>
              <p className="text-text/60 text-sm">Total Vendors</p>
            </div>

            <div className="bg-background border-2 border-primary/20 rounded-2xl p-6 text-center">
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                <FaExchangeAlt className="text-green-500 text-xl" />
              </div>
              <h3 className="text-text font-semibold text-lg">
                {vendors.reduce(
                  (total, v) => total + (v._count?.transactions || 0),
                  0
                )}
              </h3>
              <p className="text-text/60 text-sm">Total Transactions</p>
            </div>

            <div className="bg-background border-2 border-primary/20 rounded-2xl p-6 text-center">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                <FaWallet className="text-blue-500 text-xl" />
              </div>
              <h3 className="text-text font-semibold text-lg">
                {vendors.filter((v) => (v.balance || 0) > 0).length}
              </h3>
              <p className="text-text/60 text-sm">Active Balances</p>
            </div>
          </motion.div>
        )}

        {/* Vendors Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-poppins font-semibold text-text">
              Vendor Accounts
            </h2>
            <p className="text-text/60 text-sm">
              Click a vendor to view detailed transactions
            </p>
          </div>

          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-background border-2 border-primary/20 rounded-2xl p-6 animate-pulse"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="h-4 bg-text/20 rounded w-24 mb-2"></div>
                      <div className="h-3 bg-text/20 rounded w-16"></div>
                    </div>
                    <div className="text-right">
                      <div className="h-3 bg-text/20 rounded w-12 mb-1"></div>
                      <div className="h-4 bg-text/20 rounded w-16"></div>
                    </div>
                  </div>
                  <div className="h-3 bg-text/20 rounded w-20"></div>
                </motion.div>
              ))}
            </div>
          ) : (
            <AnimatePresence>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {vendors.map((vendor, index) => (
                  <motion.div
                    key={vendor.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    whileHover={{ y: -4, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Link
                      href={`/vendor/transaction/${vendor.id}`}
                      className="block bg-background border-2 border-primary/20 rounded-2xl p-6 hover:border-primary/40 hover:shadow-xl transition-all duration-300 group"
                    >
                      {/* Vendor Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                            <FaBuilding className="text-primary text-lg" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-text text-lg group-hover:text-primary transition-colors">
                              {vendor.name}
                            </h3>
                            <p className="text-text/60 text-sm">
                              {vendor._count?.transactions || 0} transaction
                              {vendor._count?.transactions !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Balance Section */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-text/60 text-sm">
                          Current Balance
                        </div>
                        <div className="text-right">
                          <div
                            className={`text-lg font-semibold ${
                              (vendor.balance || 0) > 0
                                ? "text-primary"
                                : (vendor.balance || 0) < 0
                                ? "text-red-500"
                                : "text-text"
                            }`}
                          >
                            {vendor.currency}{" "}
                            {Math.abs(
                              Number(vendor.balance || 0)
                            ).toLocaleString()}
                            {/* {(vendor.balance || 0) < 0 && " CR"} */}
                          </div>
                          <div className="text-text/40 text-xs">
                            {vendor.currency} Account
                          </div>
                        </div>
                      </div>

                      {/* Status Bar */}
                      <div className="w-full bg-text/10 rounded-full h-2 mb-3">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            (vendor.balance || 0) > 0
                              ? "bg-primary"
                              : (vendor.balance || 0) < 0
                              ? "bg-secondary"
                              : "bg-text/40"
                          }`}
                          style={{
                            width: `${Math.min(
                              (Math.abs(Number(vendor.balance || 0)) / 10000) *
                                100,
                              100
                            )}%`,
                          }}
                        ></div>
                      </div>

                      {/* Action Footer */}
                      <div className="flex items-center justify-between pt-3 border-t border-primary/10">
                        <span className="text-primary text-sm font-medium group-hover:text-accent transition-colors flex items-center gap-2">
                          <FaEye className="text-xs" />
                          View Full Ledger
                        </span>
                        <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                          <FaExchangeAlt className="text-xs" />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          )}

          {/* Empty State */}
          {!isLoading && vendors.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="w-24 h-24 bg-text/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaUsers className="text-3xl text-text/40" />
              </div>
              <h3 className="text-xl font-poppins font-semibold text-text mb-2">
                No Vendors Found
              </h3>
              <p className="text-text/60 mb-6">
                There are no vendors with transactions in the system yet.
              </p>
              <button className="bg-primary text-white px-6 py-3 rounded-xl hover:bg-accent transition-all duration-200 font-medium">
                Add First Vendor
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
