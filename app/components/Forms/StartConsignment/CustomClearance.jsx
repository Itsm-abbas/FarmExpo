// app/components/Forms/StartConsignment/CustomClearance.jsx
"use client";
import React, { useState, useEffect } from "react";
import UpdateConsignment from "@utils/updateConsignment";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import SaveButton from "@components/Button/SaveButton";
import Input from "@components/Input";
import { useQuery } from "@tanstack/react-query";
import { fetchCustomAgents } from "@constants/consignmentAPI";
import { motion } from "framer-motion";
import { getCookie } from "cookies-next";
import { useRouter } from "next/navigation";
import axiosInstance from "@utils/axiosConfig";
import {
  FaClipboardCheck,
  FaMoneyBill,
  FaUser,
  FaFileContract,
} from "react-icons/fa";

const MySwal = withReactContent(Swal);

export default function CustomClearance({
  consignmentId,
  existingData,
  setFormStatuses,
  setActiveAccordion,
  isLocked = false,
}) {
  const router = useRouter();
  const token = getCookie("token");
  const [fee, setFee] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedCustomAgent, setSelectedCustomAgent] = useState(null);
  const [error, setError] = useState("");

  const { data: customAgentsData, isLoading: LoadingCustomAgents } = useQuery({
    queryKey: ["customAgents"],
    queryFn: fetchCustomAgents,
  });

  useEffect(() => {
    if (existingData) {
      setSelectedCustomAgent(existingData?.customAgent);
      setFee(existingData?.fee);
    }
  }, [existingData]);

  const handleSubmit = async () => {
    if (!fee || !selectedCustomAgent) {
      MySwal.fire({
        icon: "warning",
        title: "Missing Information",
        text: "Please fill in all required fields.",
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

    setLoading(true);
    setError("");

    try {
      const payload = {
        ca: selectedCustomAgent,
        fee: parseFloat(fee),
      };

      const url = existingData
        ? `/api/customclearance/${existingData.id}`
        : `/api/customclearance`;
      const method = existingData ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const { id } = await response.json();

      // Update or create transaction for custom agent fee
      if (fee && parseFloat(fee) > 0) {
        try {
          // Check if there's an existing transaction for this consignment and vendor
          const existingTransactionResponse = await axiosInstance.get(
            `/vendor/transactions/consignment/${consignmentId}/vendor/${selectedCustomAgent.vendorId}`
          );

          const existingTransaction = existingTransactionResponse.data;

          if (
            existingTransaction &&
            existingTransaction.details.includes("Custom clearance")
          ) {
            // Update existing transaction
            await axiosInstance.put(`/vendor/transactions`, {
              id: existingTransaction.id,
              type: "credit",
              amount: parseFloat(fee),
              details: `Custom clearance fee for consignment #${consignmentId}`,
              transactionId: existingTransaction.transactionId,
              voucherId: existingTransaction.voucherId,
            });
          } else {
            // Create new transaction
            const transactionPayload = {
              vendorId: selectedCustomAgent.vendorId,
              transactionId: `CUSTOM-${consignmentId}-${Date.now()}`,
              voucherId: `VOUCHER-CUSTOM-${consignmentId}`,
              type: "credit",
              amount: parseFloat(fee),
              details: `Custom clearance fee for consignment #${consignmentId}`,
              consignmentId: parseInt(consignmentId),
            };

            await axiosInstance.post(
              "/vendor/transactions",
              transactionPayload
            );
          }
        } catch (transactionError) {
          console.warn("Failed to create transaction:", transactionError);
          // Continue with custom clearance creation even if transaction fails
        }
      }

      if (!existingData) {
        await UpdateConsignment(
          consignmentId,
          { customClearance: { id, ...payload } },
          "Custom Cleared"
        );
      }

      setFormStatuses((prev) => ({
        ...prev,
        customClearance: { id, ...payload },
      }));
      setActiveAccordion(null);

      MySwal.fire({
        icon: "success",
        title: "Success!",
        text: existingData
          ? "Custom Clearance updated successfully!"
          : "Custom Clearance added successfully!",
        showConfirmButton: false,
        timer: 2000,
        background: "rgb(var(--color-background))",
        color: "rgb(var(--color-text))",
        iconColor: "rgb(var(--color-primary))",
      });
    } catch (error) {
      console.error("Error saving custom clearance:", error);
      setError(error.message || "An error occurred while saving data.");

      MySwal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "An error occurred while saving data.",
        background: "rgb(var(--color-background))",
        color: "rgb(var(--color-text))",
        confirmButtonColor: "rgb(var(--color-primary))",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCustomAgentsChange = (e) => {
    const selectedId = e.target.value;
    if (selectedId === "add-new-customagent") {
      router.push("/consignment/custom-agent/add-customAgent");
    } else {
      const selectedAgent = customAgentsData.find(
        (c) => c.id === parseInt(selectedId)
      );
      setSelectedCustomAgent(selectedAgent);
    }
  };

  const CustomSelect = ({
    id,
    value,
    onChange,
    options,
    loading,
    label,
    placeholder,
    icon: Icon,
  }) => (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className=" text-sm font-medium text-text font-poppins flex items-center space-x-2"
      >
        {Icon && <Icon className="text-primary text-sm" />}
        <span>
          {label}{" "}
          {isLocked && <span className="text-red-500 text-xs">(Locked)</span>}
        </span>
      </label>
      <select
        id={id}
        value={value?.id || ""}
        onChange={onChange}
        disabled={isLocked || loading}
        className="w-full px-4 py-3 bg-background border border-primary/20 rounded-xl text-text placeholder-text/50 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 font-inter disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <option value="" className="text-text/50">
          {loading ? "Loading custom agents..." : placeholder}
        </option>
        {options?.map((agent) => (
          <option
            key={agent.id}
            value={agent.id}
            className="text-text bg-background"
          >
            {agent.vendor?.name}{" "}
            {agent.vendor?.station ? `- ${agent.vendor.station}` : ""}
          </option>
        ))}
        <option
          value="add-new-customagent"
          className="text-primary font-semibold bg-primary/10 cursor-pointer"
        >
          + Add New Custom Agent
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
              <FaClipboardCheck className="text-primary text-xl" />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-poppins text-text">
                Custom Clearance
              </h2>
              <p className="text-text/70 font-inter mt-1">
                {existingData
                  ? "Update custom clearance details"
                  : "Add custom clearance information"}
              </p>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6 space-y-6">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/20 rounded-xl p-4"
            >
              <p className="text-red-500 text-sm font-inter">{error}</p>
            </motion.div>
          )}

          <div className="space-y-6">
            {/* Custom Agent Selection */}
            <CustomSelect
              id="customAgents"
              value={selectedCustomAgent}
              onChange={handleCustomAgentsChange}
              options={customAgentsData}
              loading={LoadingCustomAgents}
              label="Custom Agent *"
              placeholder="Select a custom agent"
              icon={FaUser}
            />

            {/* Selected Agent Details */}
            {selectedCustomAgent && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="bg-primary/5 rounded-xl p-4 border border-primary/20"
              >
                <h4 className="font-semibold text-text font-poppins mb-3 flex items-center gap-2">
                  <FaUser className="text-primary" />
                  Agent Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm font-inter">
                  <div>
                    <p className="text-text/70">Name</p>
                    <p className="font-medium text-text">
                      {selectedCustomAgent.vendor?.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-text/70">NTN</p>
                    <p className="font-medium text-text">
                      {selectedCustomAgent.vendor?.ntn || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-text/70">Station</p>
                    <p className="font-medium text-text">
                      {selectedCustomAgent.vendor?.station}
                    </p>
                  </div>
                  <div>
                    <p className="text-text/70">Country</p>
                    <p className="font-medium text-text">
                      {selectedCustomAgent.vendor?.country}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Fee Input */}
            <Input
              id="fee"
              type="number"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              placeholder="Enter clearance fee"
              label="Clearance Fee *"
              disabled={isLocked}
              min="0"
              step="0.01"
              icon={FaMoneyBill}
              helpertext="Enter the custom clearance fee amount"
              required
            />
          </div>

          {/* Save Button */}
          <motion.div
            className="pt-4 border-t border-primary/10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <SaveButton
              handleSubmit={handleSubmit}
              isLoading={loading}
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
