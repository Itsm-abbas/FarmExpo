"use client";

import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DataLoader from "@components/Loader/dataLoader";
import Swal from "sweetalert2";
import { useEffect, useState } from "react";
import {
  FaArrowRight,
  FaEye,
  FaPrint,
  FaWindowClose,
  FaPlus,
} from "react-icons/fa";
import { MdDelete, MdEdit, MdVisibility, MdMoreVert } from "react-icons/md";
import { AnimatePresence, motion } from "framer-motion";
import LinkButton from "@components/Button/LinkButton";
import axiosInstance from "@utils/axiosConfig";
import { fetchConsignments } from "@constants/consignmentAPI";

export default function Home() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [greeting, setGreeting] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(null);

  const {
    data: consignments,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["consignments"],
    queryFn: fetchConsignments,
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 10,
  });

  // Mutation for starting a new consignment
  const startConsignmentMutation = useMutation({
    mutationFn: async (date) => {
      const response = await axiosInstance.post(`/consignment`, {
        date: date,
        status: "Not started",
      });
      return response.data;
    },
    onSuccess: (data) => {
      router.push(`/items-selection/${data.id}`);
    },
    onError: (error) => {
      Swal.fire("Error!", error.message, "error");
    },
  });

  // Mutation for deleting a consignment
  const deleteConsignmentMutation = useMutation({
    mutationFn: async (id) => {
      await axiosInstance.delete(`/consignment/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["consignments"]);
      Swal.fire({
        position: "top-center",
        icon: "success",
        title: "Deleted!",
        showConfirmButton: false,
        timer: 1000,
      });
    },
    onError: (error) => {
      Swal.fire("Error!", error.message, "error");
    },
  });

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Do you really want to delete this consignment? This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      deleteConsignmentMutation.mutate(id);
    }
  };

  const handleEdit = (id) => {
    try {
      router.push(`/startconsignment/${id}`);
    } catch (error) {
      console.error("Navigation error:", error);
    }
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSave = () => {
    if (!selectedDate) {
      Swal.fire("Error!", "Please select a date.", "error");
      return;
    }
    startConsignmentMutation.mutate(selectedDate);
    closeModal();
  };

  const toggleMobileMenu = (id) => {
    setMobileMenuOpen(mobileMenuOpen === id ? null : id);
  };

  useEffect(() => {
    const getGreeting = () => {
      const currentHour = new Date().getHours();
      if (currentHour < 12 && currentHour > 4) {
        return "Good Morning";
      } else if (currentHour < 12 && currentHour > 16) {
        return "Good Afternoon";
      } else {
        return "Good Evening";
      }
    };
    setGreeting(getGreeting());
  }, []);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-yellow-500/20 text-yellow-600 border-yellow-500/30";
      case "fulfilled":
        return "bg-green-500/20 text-green-600 border-green-500/30";
      case "in progress":
        return "bg-blue-500/20 text-blue-600 border-blue-500/30";
      default:
        return "bg-gray-500/20 text-gray-600 border-gray-500/30";
    }
  };

  return (
    <motion.div
      className="min-h-screen py-4 sm:py-8 bg-background font-inter px-4  lg:px-6 "
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Enhanced Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-3 sm:p-4"
          >
            <motion.div
              initial={{ y: 50, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 50, opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="bg-background border border-primary/20 rounded-xl sm:rounded-2xl shadow-2xl max-w-md w-full p-4 sm:p-6 mx-2"
            >
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-poppins font-semibold text-text">
                  Select Consignment Date
                </h2>
                <button
                  onClick={closeModal}
                  className="text-text/60 hover:text-text transition-colors"
                >
                  <FaWindowClose className="text-xl" />
                </button>
              </div>

              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-background text-text border-2 border-primary/30 rounded-lg sm:rounded-xl p-3 mb-4 sm:mb-6 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 font-inter text-sm sm:text-base"
              />

              <div className="flex gap-2 sm:gap-3">
                <motion.button
                  onClick={closeModal}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-text/10 text-text rounded-lg sm:rounded-xl hover:bg-text/20 transition-all duration-200 font-inter font-medium text-sm sm:text-base"
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleSave}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-primary text-white rounded-lg sm:rounded-xl hover:bg-accent transition-all duration-200 font-inter font-medium shadow-lg text-sm sm:text-base"
                >
                  Start Consignment
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto py-16">
        <div className="flex flex-col gap-6 sm:gap-8 lg:gap-16">
          {/* Left Section - Enhanced */}
          <motion.div
            className="flex flex-col space-y-8"
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="space-y-4">
              <motion.h1
                className="text-4xl sm:text-5xl lg:text-6xl font-poppins font-bold text-text "
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                {greeting}!
              </motion.h1>
              <p className="text-text/70 text-lg font-inter">
                Manage your consignments efficiently and effectively
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <motion.button
                onClick={openModal}
                className="flex items-center justify-center gap-3 px-6 py-4 bg-primary text-white rounded-xl hover:bg-accent transition-all duration-200 shadow-lg hover:shadow-xl font-inter font-semibold"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                disabled={startConsignmentMutation.isPending}
              >
                {startConsignmentMutation.isPending ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <span>Start New Consignment</span>
                    <FaArrowRight className="text-sm" />
                  </>
                )}
              </motion.button>

              <motion.button
                onClick={() => router.push("/vendors/transactions")}
                className="flex items-center justify-center gap-3 px-6 py-4 bg-secondary/10 text-text border-2 border-secondary/20 rounded-xl hover:bg-secondary/20 transition-all duration-200 font-inter font-semibold"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <span>View Ledger</span>
                <FaEye className="text-sm" />
              </motion.button>
            </div>
          </motion.div>

          {/* Right Section - Enhanced */}
          <motion.div
            className="bg-background border-2 border-primary/20 rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-poppins font-semibold text-text">
                Recent Consignments
              </h2>
              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-primary rounded-full animate-pulse"></div>
            </div>

            {isLoading && (
              <div className="flex justify-center py-8 sm:py-12">
                <DataLoader />
              </div>
            )}

            {!isLoading && (
              <div className="space-y-4">
                {/* Desktop Table */}
                <div className="hidden lg:block">
                  <div className="overflow-hidden rounded-xl border border-primary/20">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[600px] font-inter">
                        <thead>
                          <tr className="bg-primary text-white">
                            {[
                              "No",
                              "Date",
                              "Consignee",
                              "Destination",
                              "Status",
                              "Actions",
                            ].map((item, index) => (
                              <th
                                key={index}
                                className="px-4 py-3 sm:py-4 text-left font-poppins font-semibold text-sm uppercase tracking-wider"
                              >
                                {item}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-primary/10">
                          {consignments?.length > 0 ? (
                            [...consignments]
                              .reverse()
                              .slice(0, 5)
                              .map((item, index) => (
                                <motion.tr
                                  key={item.id}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{
                                    duration: 0.4,
                                    delay: index * 0.1,
                                  }}
                                  className="hover:bg-primary/5 transition-colors duration-200 group"
                                >
                                  <td className="px-4 py-3 sm:py-4 text-text font-medium text-sm">
                                    {index + 1}
                                  </td>
                                  <td className="px-4 py-3 sm:py-4 text-text text-sm">
                                    {item?.date?.slice(0, 10) || "N/A"}
                                  </td>
                                  <td className="px-4 py-3 sm:py-4 text-text font-medium text-sm">
                                    {item?.consignee?.vendor?.name || "N/A"}
                                  </td>
                                  <td className="px-4 py-3 sm:py-4 text-text/80 text-sm">
                                    {item?.consignee?.vendor?.address || "N/A"}
                                  </td>
                                  <td className="px-4 py-3 sm:py-4">
                                    <span
                                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                                        item?.status
                                      )}`}
                                    >
                                      {item?.status || "N/A"}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 sm:py-4">
                                    <div className="flex items-center gap-2">
                                      <motion.button
                                        onClick={() =>
                                          router.push(`/invoice/${item.id}`)
                                        }
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        className="p-2 bg-text/10 text-text rounded-lg hover:bg-primary hover:text-white transition-all duration-200"
                                        title="Print Invoice"
                                      >
                                        <FaPrint className="text-sm" />
                                      </motion.button>
                                      <motion.button
                                        onClick={() => handleEdit(item?.id)}
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        className="p-2 bg-text/10 text-text rounded-lg hover:bg-blue-500 hover:text-white transition-all duration-200"
                                        title="Edit Consignment"
                                      >
                                        <MdEdit className="text-sm" />
                                      </motion.button>
                                      <motion.button
                                        onClick={() => handleDelete(item.id)}
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        className="p-2 bg-text/10 text-text rounded-lg hover:bg-red-500 hover:text-white transition-all duration-200"
                                        title="Delete Consignment"
                                      >
                                        <MdDelete className="text-sm" />
                                      </motion.button>
                                    </div>
                                  </td>
                                </motion.tr>
                              ))
                          ) : (
                            <tr>
                              <td
                                colSpan="6"
                                className="px-4 py-8 sm:py-12 text-center"
                              >
                                <div className="flex flex-col items-center space-y-3 text-text/60">
                                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center">
                                    <MdVisibility className="text-xl sm:text-2xl text-primary" />
                                  </div>
                                  <p className="font-inter text-base sm:text-lg">
                                    No consignments found
                                  </p>
                                  <p className="text-xs sm:text-sm">
                                    Start by creating your first consignment
                                  </p>
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Mobile Cards */}
                <div className="lg:hidden space-y-3">
                  <AnimatePresence>
                    {consignments?.length > 0 ? (
                      [...consignments]
                        .reverse()
                        .slice(0, 5)
                        .map((item, index) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            className="bg-background rounded-lg border border-primary/20 shadow-lg p-3 space-y-3"
                          >
                            {/* Header */}
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-text text-sm">
                                    #{item.id}
                                  </h3>
                                  <span
                                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                                      item?.status
                                    )}`}
                                  >
                                    {item?.status || "Unknown"}
                                  </span>
                                </div>
                                <p className="text-text/80 text-xs">
                                  {item?.date?.slice(0, 10) || "N/A"}
                                </p>
                              </div>

                              {/* Mobile Menu */}
                              <div className="relative">
                                <button
                                  onClick={() => toggleMobileMenu(item.id)}
                                  className="p-1 rounded-lg hover:bg-primary/10 transition-colors"
                                >
                                  <MdMoreVert className="text-text/60" />
                                </button>

                                <AnimatePresence>
                                  {mobileMenuOpen === item.id && (
                                    <motion.div
                                      initial={{ opacity: 0, scale: 0.95 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      exit={{ opacity: 0, scale: 0.95 }}
                                      className="absolute right-0 top-8 bg-background border border-primary/20 rounded-lg shadow-lg z-10 min-w-[120px]"
                                    >
                                      <button
                                        onClick={() => {
                                          router.push(`/invoice/${item.id}`);
                                          setMobileMenuOpen(null);
                                        }}
                                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text hover:bg-primary/5 transition-colors"
                                      >
                                        <FaPrint className="text-xs" />
                                        Print
                                      </button>
                                      <button
                                        onClick={() => {
                                          handleEdit(item?.id);
                                          setMobileMenuOpen(null);
                                        }}
                                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text hover:bg-primary/5 transition-colors"
                                      >
                                        <MdEdit className="text-xs" />
                                        Edit
                                      </button>
                                      <button
                                        onClick={() => {
                                          handleDelete(item.id);
                                          setMobileMenuOpen(null);
                                        }}
                                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-500/5 transition-colors"
                                      >
                                        <MdDelete className="text-xs" />
                                        Delete
                                      </button>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </div>

                            {/* Content */}
                            <div className="space-y-2">
                              <div>
                                <p className="text-xs text-text/60 font-medium">
                                  Consignee
                                </p>
                                <p className="text-sm text-text font-medium">
                                  {item?.consignee?.vendor?.name || "N/A"}
                                </p>
                              </div>

                              <div>
                                <p className="text-xs text-text/60 font-medium">
                                  Destination
                                </p>
                                <p className="text-sm text-text/80">
                                  {item?.consignee?.vendor?.address || "N/A"}
                                </p>
                              </div>

                              {/* Quick Actions */}
                              <div className="flex items-center gap-2 pt-2 border-t border-primary/10">
                                <motion.button
                                  onClick={() =>
                                    router.push(`/invoice/${item.id}`)
                                  }
                                  whileTap={{ scale: 0.95 }}
                                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-gray-500 text-white rounded-lg text-xs font-medium transition-colors"
                                >
                                  <FaPrint className="text-xs" />
                                  Invoice
                                </motion.button>

                                <motion.button
                                  onClick={() => handleEdit(item?.id)}
                                  whileTap={{ scale: 0.95 }}
                                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-medium transition-colors"
                                >
                                  <MdEdit className="text-xs" />
                                  Edit
                                </motion.button>
                              </div>
                            </div>
                          </motion.div>
                        ))
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-background rounded-lg border border-primary/20 shadow-lg p-6 text-center"
                      >
                        <div className="flex flex-col items-center space-y-3">
                          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                            <MdVisibility className="text-xl text-primary" />
                          </div>
                          <p className="text-text/70 font-inter text-sm">
                            No consignments found
                          </p>
                          <p className="text-xs text-text/60">
                            Start by creating your first consignment
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Show All Button */}
                <div className="pt-3 sm:pt-4 border-t border-primary/10">
                  <LinkButton
                    title="Show All Consignments"
                    desc="View complete consignment history"
                    href="consignment/all-consignments"
                    icon={MdVisibility}
                    className="text-sm"
                  />
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
