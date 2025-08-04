"use client";

import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DataLoader from "@components/Loader/dataLoader";
import Swal from "sweetalert2";
import { useEffect, useState } from "react";
import { FaArrowRight, FaEye, FaPrint, FaWindowClose } from "react-icons/fa";
import fonts from "@utils/fonts";
import { MdDelete, MdEdit, MdVisibility } from "react-icons/md";
import { AnimatePresence, motion } from "framer-motion";
import LinkButton from "@components/Button/LinkButton";
// import { fetchConsignments } from "@constants/consignmentAPI";
import axiosInstance from "@utils/axiosConfig";

export default function Home() {
  // const userData = getUserDataFromToken();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [greeting, setGreeting] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false); // State to control modal visibility
  const [selectedDate, setSelectedDate] = useState(""); // State to store the selected date
  const [data, setData] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
      fetchConsignments();
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

  // Open the modal
  const openModal = () => {
    setIsModalOpen(true);
  };

  // Close the modal
  const closeModal = () => {
    setIsModalOpen(false);
  };

  // Handle date selection and start consignment
  const handleSave = () => {
    if (!selectedDate) {
      Swal.fire("Error!", "Please select a date.", "error");
      return;
    }

    // Start the consignment with the selected date
    startConsignmentMutation.mutate(selectedDate);
    closeModal();
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

  // Fetch consignments
  const fetchConsignments = async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get("/consignment");
      setData(response.data); // Update the data state
    } catch (error) {
      console.error("Failed to fetch consignments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch consignments on component mount
  useEffect(() => {
    fetchConsignments();
  }, []);
  return (
    <motion.div
      className="py-24 "
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50"
          >
            <motion.div
              initial={{ y: 50, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 50, opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="bg-LightSBg w-80 text-LightPText dark:text-DarkPText dark:bg-DarkPBg p-6 rounded-lg shadow-2xl"
            >
              <h2 className="text-xl font-semibold mb-4">
                Select Consignment Date
              </h2>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full  text-LightPText dark:bg-DarkPBg dark:text-DarkPText p-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-PrimaryButton focus:outline-none"
              />
              <div className="flex justify-end gap-2">
                <motion.button
                  onClick={closeModal}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all duration-200"
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleSave}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 bg-PrimaryButton text-white rounded-lg hover:bg-PrimaryButtonHover transition-all duration-200"
                >
                  Save
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex flex-col md:flex-row gap-20 md:gap-8 md:justify-between">
        {/* Left Section */}
        <motion.div
          className="flex flex-col  items-start space-y-10 md:py-10 "
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h1 className="text-3xl sm:text-3xl md:text-5xl font-bold gap-2 flex flex-wrap">
            <motion.span>{greeting}!</motion.span>
            <motion.span
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              {/* {userData?.fullName.trim().split(" ")[0]} */}
            </motion.span>
          </h1>
          <motion.button
            onClick={openModal} // Open the modal on button click
            className={`${fonts.poppins.className} cursor-pointer text-sm sm:text-base flex gap-2 items-center px-4 sm:px-6 py-3 bg-PrimaryButton hover:bg-PrimaryButtonHover text-white rounded-lg transition`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={startConsignmentMutation.isPending}
          >
            {startConsignmentMutation.isPending ? (
              <>
                <span className="animate-pulse">Creating Consignment...</span>
              </>
            ) : (
              "Start New Consignment"
            )}
            {!startConsignmentMutation.isPending && <FaArrowRight />}
          </motion.button>
          <motion.button
            onClick={() => router.push("/selectLedger")}
            className={`${fonts.poppins.className} cursor-pointer text-sm sm:text-base flex gap-2 items-center px-3 sm:px-5 py-2 bg-SecondaryButton hover:bg-SecondaryButtonHover text-white rounded-lg transition`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={startConsignmentMutation.isPending}
          >
            View Ledger
            <FaEye />- Coming soon...
          </motion.button>
        </motion.div>

        {/* Right Section */}
        <motion.div
          className={`${fonts.poppins.className}  border-2 border-LightBorder dark:border-DarkBorder shadow-md rounded-md p-3 md:p-6 text-LightPText dark:text-DarkPText`}
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h2 className="text-xl font-semibold mb-4">Your Consignments</h2>
          {isLoading && <DataLoader />}

          {!isLoading && (
            <motion.table
              className="w-full mb-4 min-w-max text-xs sm:text-sm 2xl:text-lg border-collapse border border-LightBorder dark:border-DarkBorder capitalize rounded-lg overflow-hidden shadow-md dark:shadow-xl "
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <thead>
                <tr className="bg-PrimaryButton text-white">
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
                      className="px-3 2xl:px-5 sm:px-6 md:px-4 py-2 border border-LightBorder dark:border-DarkBorder text-center"
                    >
                      {item}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data?.length > 0 ? (
                  [...data]
                    .reverse()
                    // .filter((item) => item.status !== "Fulfilled") // Filter out "Fullfilled" consignments
                    .map((item, index) => (
                      <motion.tr
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: index * 0.3 }}
                        className="hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                      >
                        <td className="border border-LightBorder dark:border-DarkBorder  sm:px-4 py-2 text-center">
                          {index + 1}
                        </td>
                        <td className="border border-LightBorder dark:border-DarkBorder  sm:px-4 py-2 text-center">
                          {item?.date.slice(0, 10)}
                        </td>
                        <td className="border border-LightBorder dark:border-DarkBorder  sm:px-4 py-2 text-center">
                          {item?.consignee?.vendor?.name || "N/A"}
                        </td>
                        <td className="border border-LightBorder dark:border-DarkBorder  sm:px-4 py-2 text-center">
                          {item?.consignee?.vendor.address}
                        </td>
                        <td className="border border-LightBorder dark:border-DarkBorder  sm:px-4 py-2 text-center">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              item?.status === "Pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : item?.status === "Fulfilled"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {item?.status || "N/A"}
                          </span>
                        </td>
                        <td className="border border-LightBorder dark:border-DarkBorder  sm:px-4 py-2 text-cente">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => router.push(`/invoice/${item.id}`)}
                              className="p-1 2xl:p-2 rounded-md bg-gray-500 text-white hover:bg-gray-600 transition text-lg"
                            >
                              <FaPrint />
                            </button>
                            <button
                              onClick={() => handleEdit(item?.id)}
                              className="p-1 2xl:p-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition text-lg"
                            >
                              <MdEdit />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-1 2xl:p-2 rounded-md bg-red-500 text-white hover:bg-red-600 transition text-lg"
                            >
                              <MdDelete />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                ) : (
                  <tr className="text-center">
                    <td colSpan="4" className="py-4 text-gray-500">
                      No consignments found
                    </td>
                  </tr>
                )}
              </tbody>
            </motion.table>
          )}
          <LinkButton
            title={"Show All"}
            desc="Click to show all consignments"
            href={"consignment/all-consignments"}
            icon={MdVisibility}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
