// app/components/Forms/StartConsignment/Consignee.jsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import SaveButton from "@components/Button/SaveButton";
import UpdateConsignment from "@utils/updateConsignment";
import { useQuery } from "@tanstack/react-query";
import { fetchConsignees } from "@constants/consignmentAPI";
import Input from "@components/Input";
import axiosInstance from "@utils/axiosConfig";
import {
  FaUser,
  FaMoneyBill,
  FaMapMarkerAlt,
  FaBuilding,
} from "react-icons/fa";

const MySwal = withReactContent(Swal);

export default function ConsigneeForm({
  consignmentId,
  existingData,
  setFormStatuses,
  setActiveAccordion,
  isLocked = false,
}) {
  const router = useRouter();
  const [selectedConsignee, setSelectedConsignee] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [balance, setBalance] = useState(0);
  const [error, setError] = useState("");

  const { data: consignees, isLoading: LoadingConsignees } = useQuery({
    queryKey: ["consignees"],
    queryFn: fetchConsignees,
  });

  useEffect(() => {
    if (existingData) {
      setSelectedConsignee(existingData);
      setBalance(existingData?.balance || 0);
    }
  }, [existingData]);

  const handleConsigneeChange = (e) => {
    const selectedId = e.target.value;
    if (selectedId === "add-new-consignees") {
      router.push("/consignment/consignee/add-consignee");
    } else {
      const selectedConsignee = consignees.find(
        (t) => t.id === parseInt(selectedId)
      );
      setSelectedConsignee(selectedConsignee);
      setBalance(selectedConsignee?.vendor?.balance || 0);
    }
  };

  const handleSubmit = async () => {
    if (!selectedConsignee) {
      MySwal.fire({
        icon: "warning",
        title: "Missing Information",
        text: "Please select a consignee.",
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
    setError("");

    try {
      let updatedBalance = selectedConsignee.balance || 0;
      const balanceAmount = parseFloat(balance) || 0;

      if (balanceAmount !== 0) {
        // Check if there's an existing transaction for this consignment and vendor
        const existingTransactionResponse = await axiosInstance.get(
          `/vendor/transactions/consignment/${Number(
            consignmentId
          )}/vendor/${Number(selectedConsignee.vendorId)}`
        );
        const existingTransaction = existingTransactionResponse.data;

        if (existingTransaction) {
          // Update existing transaction
          await axiosInstance.put(`/vendor/transactions`, {
            id: existingTransaction.id,
            type: "credit",
            amount: balanceAmount,
            details: `Balance updated for consignment #${consignmentId}`,
            transactionId: existingTransaction.transactionId,
            voucherId: existingTransaction.voucherId,
          });
        } else {
          // Create new transaction
          const transactionPayload = {
            vendorId: selectedConsignee.vendorId,
            transactionId: `CONS-${consignmentId}-${Date.now()}`,
            voucherId: `VOUCHER-CONS-${consignmentId}`,
            type: "credit",
            amount: balanceAmount,
            details: `Initial balance for consignment #${consignmentId}`,
            consignmentId: parseInt(consignmentId),
          };

          await axiosInstance.post("/vendor/transactions", transactionPayload);
        }
      }

      // Update consignee's balance in the database
      await axiosInstance.put(`/consignee/${selectedConsignee.id}`, {
        balance: balanceAmount,
      });

      // Update consignment
      if (existingData) {
        await UpdateConsignment(consignmentId, {
          consignee: selectedConsignee,
        });
      } else {
        await UpdateConsignment(
          consignmentId,
          { consignee: selectedConsignee },
          "Pending"
        );
      }

      // Fetch updated vendor data for accurate UI state
      const updatedVendorResponse = await axiosInstance.get(
        `/vendor/transactions/${selectedConsignee.vendorId}`
      );
      const updatedVendor = updatedVendorResponse.data.vendor;

      // Update local state
      const updatedConsignee = {
        ...selectedConsignee,
        balance: balanceAmount,
        vendor: {
          ...selectedConsignee.vendor,
          balance: updatedVendor.balance,
        },
      };

      setFormStatuses((prev) => ({
        ...prev,
        consignee: updatedConsignee,
      }));

      setActiveAccordion(null);

      MySwal.fire({
        icon: "success",
        title: "Success!",
        text: "Consignee updated successfully!",
        showConfirmButton: false,
        timer: 2000,
        background: "rgb(var(--color-background))",
        color: "rgb(var(--color-text))",
        iconColor: "rgb(var(--color-primary))",
      });
    } catch (error) {
      console.error("Error updating consignee:", error);
      setError(
        error.message || "An error occurred while updating the consignee."
      );

      MySwal.fire({
        icon: "error",
        title: "Error",
        text:
          error.message || "An error occurred while updating the consignee.",
        background: "rgb(var(--color-background))",
        color: "rgb(var(--color-text))",
        confirmButtonColor: "rgb(var(--color-primary))",
      });
    } finally {
      setIsSubmitting(false);
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
        className="text-sm font-medium text-text font-poppins flex items-center space-x-2"
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
          {loading ? "Loading consignees..." : placeholder}
        </option>
        {options?.map((consignee) => (
          <option
            key={consignee.id}
            value={consignee.id}
            className="text-text bg-background"
          >
            {consignee.vendor?.name} - {consignee.vendor?.station} (
            {consignee.vendor?.country})
          </option>
        ))}
        <option
          value="add-new-consignees"
          className="text-primary font-semibold bg-primary/10 cursor-pointer"
        >
          + Add New Consignee
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
              <FaUser className="text-primary text-xl" />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-poppins text-text">
                Consignee Information
              </h2>
              <p className="text-text/70 font-inter mt-1">
                {existingData
                  ? "Update consignee details"
                  : "Select or add a consignee for this consignment"}
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
            {/* Consignee Selection */}
            <CustomSelect
              id="consignees"
              value={selectedConsignee}
              onChange={handleConsigneeChange}
              options={consignees}
              loading={LoadingConsignees}
              label="Select Consignee *"
              placeholder="Choose a consignee"
              icon={FaBuilding}
            />

            {/* Selected Consignee Details */}
            {selectedConsignee && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="bg-primary/5 rounded-xl p-4 border border-primary/20"
              >
                <h4 className="font-semibold text-text font-poppins mb-3 flex items-center gap-2">
                  <FaUser className="text-primary" />
                  Consignee Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm font-inter">
                  <div>
                    <p className="text-text/70">Name</p>
                    <p className="font-medium text-text">
                      {selectedConsignee.vendor?.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-text/70">NTN</p>
                    <p className="font-medium text-text">
                      {selectedConsignee.vendor?.ntn || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-text/70">Station</p>
                    <p className="font-medium text-text">
                      {selectedConsignee.vendor?.station}
                    </p>
                  </div>
                  <div>
                    <p className="text-text/70">Country</p>
                    <p className="font-medium text-text">
                      {selectedConsignee.vendor?.country}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-text/70">Address</p>
                    <p className="font-medium text-text">
                      {selectedConsignee.vendor?.address}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Balance Input */}
            <Input
              id="balance"
              type="number"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              placeholder={
                "Enter Amount in " + selectedConsignee?.vendor?.currency
              }
              label={"Amount (" + selectedConsignee?.vendor?.currency + ")"}
              disabled={isLocked}
              min="0"
              step="0.01"
              icon={FaMoneyBill}
              helpertext="Set the initial balance for this consignee"
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
