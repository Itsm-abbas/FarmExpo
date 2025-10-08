"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import SaveButton from "@components/Button/SaveButton";
import UpdateConsignment from "@utils/updateConsignment";
import { useQuery } from "@tanstack/react-query";
import { fetchTraders } from "@constants/consignmentAPI";
import {
  FaUserTie,
  FaBuilding,
  FaMapMarkerAlt,
  FaIdCard,
} from "react-icons/fa";

const MySwal = withReactContent(Swal);

export default function TraderForm({
  consignmentId,
  existingData,
  setFormStatuses,
  setActiveAccordion,
  isLocked = false,
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
        icon: "warning",
        title: "Missing Selection",
        text: "Please select a trader.",
        background: "rgb(var(--color-background))",
        color: "rgb(var(--color-text))",
        confirmButtonColor: "rgb(var(--color-primary))",
      });
      return;
    }

    if (isLocked) {
      MySwal.fire({
        icon: "warning",
        title: "Form Locked",
        text: "This consignment is fulfilled. Please contact administrator to make changes.",
        background: "rgb(var(--color-background))",
        color: "rgb(var(--color-text))",
        confirmButtonColor: "rgb(var(--color-primary))",
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
        title: "Success!",
        text: "Trader updated successfully!",
        showConfirmButton: false,
        timer: 1500,
        background: "rgb(var(--color-background))",
        color: "rgb(var(--color-text))",
        iconColor: "rgb(var(--color-primary))",
      });
    } catch (error) {
      MySwal.fire({
        icon: "error",
        title: "Error",
        text: "An error occurred while updating the trader.",
        background: "rgb(var(--color-background))",
        color: "rgb(var(--color-text))",
        confirmButtonColor: "rgb(var(--color-primary))",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const CustomSelect = ({ value, onChange, loading }) => (
    <div className="space-y-2">
      <label
        htmlFor="trader"
        className="text-sm font-medium text-text font-poppins flex items-center space-x-2"
      >
        <FaUserTie className="text-primary text-sm" />
        <span>
          Select Trader *{" "}
          {isLocked && <span className="text-red-500 text-xs">(Locked)</span>}
        </span>
      </label>
      <select
        id="trader"
        value={value?.id || ""}
        onChange={onChange}
        disabled={isLocked || loading}
        className="w-full px-4 py-3 bg-background border border-primary/20 rounded-xl text-text placeholder-text/50 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 font-inter disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <option value="" className="text-text/50">
          {loading ? "Loading traders..." : "Choose a trader"}
        </option>
        {tradersData?.map((trader) => (
          <option
            key={trader.id}
            value={trader.id}
            className="text-text bg-background"
          >
            {trader.name}{" "}
            {trader.vendor?.station && `- ${trader.vendor.station}`}
          </option>
        ))}
        <option
          value="add-new-trader"
          className="text-primary font-semibold bg-primary/10 cursor-pointer"
        >
          + Add New Trader
        </option>
      </select>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="bg-background rounded-2xl border border-primary/20 shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-6 border-b border-primary/20">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <FaUserTie className="text-primary text-xl" />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-poppins text-text">
                Trader Information
              </h2>
              <p className="text-text/70 font-inter mt-1">
                {existingData
                  ? "Update trader details"
                  : "Select a trader for this consignment"}
              </p>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6 space-y-6">
          {/* Trader Selection */}
          <CustomSelect
            value={selectedTrader}
            onChange={handleTraderChange}
            loading={LoadingTraders}
          />

          {/* Selected Trader Details */}
          {selectedTrader && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="bg-primary/5 rounded-xl p-4 border border-primary/20"
            >
              <h4 className="font-semibold text-text font-poppins mb-3 flex items-center gap-2">
                <FaUserTie className="text-primary" />
                Trader Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm font-inter">
                <div>
                  <p className="text-text/70">Name</p>
                  <p className="font-medium text-text">{selectedTrader.name}</p>
                </div>
                <div>
                  <p className="text-text/70">NTN</p>
                  <p className="font-medium text-text">
                    {selectedTrader.ntn || "N/A"}
                  </p>
                </div>
                {selectedTrader.vendor && (
                  <>
                    <div>
                      <p className="text-text/70">Station</p>
                      <p className="font-medium text-text">
                        {selectedTrader.vendor.station}
                      </p>
                    </div>
                    <div>
                      <p className="text-text/70">Country</p>
                      <p className="font-medium text-text">
                        {selectedTrader.vendor.country}
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-text/70">Address</p>
                      <p className="font-medium text-text">
                        {selectedTrader.vendor.address}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}

          {/* Save Button */}
          <motion.div
            className="pt-4 border-t border-primary/10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <SaveButton
              handleSubmit={handleSubmit}
              isLoading={isSubmitting}
              existingData={!!existingData}
              disabled={isLocked}
            />

            {isLocked && (
              <p className="text-center text-text/60 text-sm font-inter mt-2">
                This form is locked because the consignment is fulfilled
              </p>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
