"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import SaveButton from "@components/Button/SaveButton";
import UpdateConsignment from "@utils/updateConsignment";
import { useQuery } from "@tanstack/react-query";
import { fetchTraders } from "@constants/consignmentAPI";

const MySwal = withReactContent(Swal);

export default function TraderForm({
  consignmentId,
  existingData,
  setFormStatuses,
  setActiveAccordion,
}) {
  const router = useRouter();
  const [selectedTrader, setSelectedTrader] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Fetch traders from API
  const { data: tradersData, isLoading: LoadingTraders } = useQuery({
    queryKey: ["Trader"],
    queryFn: fetchTraders,
  });

  // Set existing data when editing
  useEffect(() => {
    if (existingData) {
      setSelectedTrader(existingData);
    }
  }, [existingData]);

  // Handle trader selection
  const handleTraderChange = (e) => {
    const selectedId = e.target.value;
    if (selectedId === "add-new-trader") {
      router.push("/consignment/trader/add-trader");
    } else {
      const trader = tradersData.find((t) => t.id === parseInt(selectedId));
      setSelectedTrader(trader);
    }
  };

  // Submit the selected trader
  const handleSubmit = async () => {
    if (!selectedTrader) {
      MySwal.fire({
        icon: "error",
        title: "Oops...",
        text: "Please select a trader.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const updatedConsignment = await UpdateConsignment(
        consignmentId,
        { trader: selectedTrader },
        "Pending"
      );

      setFormStatuses((prev) => ({
        ...prev,
        trader: selectedTrader,
      }));
      setActiveAccordion(null);

      MySwal.fire({
        icon: "success",
        title: "Success",
        showConfirmButton: false,
        timer: 1500,
        text: "Trader updated successfully!",
      });
    } catch (error) {
      MySwal.fire({
        icon: "error",
        title: "Error",
        text: "An error occurred while updating the trader.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      className="space-y-4 text-LightPText dark:text-DarkPText w-full md:w-4/5 lg:w-1/2 "
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        className="shadow-md rounded-md p-6 space-y-4 border-LightBorder dark:border-DarkBorder border-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-xl font-semibold mb-8">Select Trader</h2>

        {/* Trader Dropdown */}
        <div className="relative">
          {LoadingTraders ? (
            <p className="text-gray-500">Fetching traders...</p>
          ) : (
            <div className="relative">
              <motion.select
                id="trader"
                value={selectedTrader?.id || ""}
                onChange={handleTraderChange}
                className="bg-LightPBg text-black dark:text-white mb-7 mt-1 block w-full border border-LightBorder dark:border-DarkBorder dark:bg-[#2d3748] rounded-md p-2 focus:ring-PrimaryButton focus:border-PrimaryButton dark:focus:ring-PrimaryButton dark:focus:border-PrimaryButton outline-none relative z-50"
              >
                <option value="">Select Trader</option>
                {tradersData.map((trader) => (
                  <option key={trader.id} value={trader.id}>
                    {trader.name}
                  </option>
                ))}
                <option
                  value="add-new-trader"
                  className="text-green-600 font-semibold cursor-pointer"
                >
                  + Add New Trader
                </option>
              </motion.select>
            </div>
          )}
        </div>

        {/* Save Button */}
        <SaveButton
          existingData={existingData}
          handleSubmit={handleSubmit}
          isLoading={isSubmitting}
        />
      </motion.div>
    </motion.div>
  );
}
