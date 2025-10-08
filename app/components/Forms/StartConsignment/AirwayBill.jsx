// app/components/Forms/StartConsignment/AirwayBill.jsx
"use client";
import UpdateConsignment from "@utils/updateConsignment";
import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import SaveButton from "@components/Button/SaveButton";
import Input from "@components/Input";
import { motion } from "framer-motion";
import moment from "moment";
import { useQuery } from "@tanstack/react-query";
import { fetchIata } from "@constants/consignmentAPI";
import { useRouter } from "next/navigation";
import { getCookie } from "cookies-next";
import axiosInstance from "@utils/axiosConfig";
import {
  FaPlane,
  FaShip,
  FaCalendarAlt,
  FaMoneyBill,
  FaWeight,
  FaUser,
} from "react-icons/fa";

const MySwal = withReactContent(Swal);

export default function AirwayBill({
  consignmentId,
  existingData,
  setFormStatuses,
  setActiveAccordion,
  isLocked = false,
}) {
  const token = getCookie("token");
  const router = useRouter();

  const { data: iataAgentsData, isLoading: isLoadingAgents } = useQuery({
    queryKey: ["IataAgents"],
    queryFn: fetchIata,
  });

  const [formData, setFormData] = useState({
    billNumber: "",
    rate: "",
    airwayBillWeight: "",
    fee: "",
    date: new Date().toISOString().split("T")[0],
    selectedIataAgent: null,
  });

  const [submitLoading, setIsSubmitLoading] = useState(false);
  const [error, setError] = useState("");

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Save Data
  const handleSubmit = async () => {
    if (
      !formData.billNumber ||
      !formData.fee ||
      !formData.rate ||
      !formData.airwayBillWeight ||
      !formData.selectedIataAgent
    ) {
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

    setIsSubmitLoading(true);
    setError("");

    try {
      const payload = {
        number: formData.billNumber,
        iataAgent: formData.selectedIataAgent,
        dateTime: moment(formData.date).format("YYYY-MM-DDTHH:mm:ss"),
        rate: parseFloat(formData.rate),
        airwayBillWeight: parseFloat(formData.airwayBillWeight),
        fee: parseFloat(formData.fee),
      };

      const url = existingData
        ? `/api/airwaybill/${existingData?.id}`
        : `/api/airwaybill`;
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

      // Update or create transaction for IATA agent fee
      if (formData.fee && parseFloat(formData.fee) > 0) {
        try {
          // Check if there's an existing transaction for this consignment and vendor
          const existingTransactionResponse = await axiosInstance.get(
            `/vendor/transactions/consignment/${consignmentId}/vendor/${formData.selectedIataAgent.vendorId}`
          );

          const existingTransaction = existingTransactionResponse.data;

          if (
            existingTransaction &&
            existingTransaction.details.includes("Airway bill")
          ) {
            // Update existing transaction
            await axiosInstance.put(`/vendor/transactions`, {
              id: existingTransaction.id,
              type: "credit",
              amount: parseFloat(formData.fee),
              details: `Airway bill fee for consignment #${consignmentId}`,
              transactionId: existingTransaction.transactionId,
              voucherId: existingTransaction.voucherId,
            });
          } else {
            // Create new transaction
            const transactionPayload = {
              vendorId: formData.selectedIataAgent.vendorId,
              transactionId: `AIRWAY-${consignmentId}-${Date.now()}`,
              voucherId: `VOUCHER-AIRWAY-${consignmentId}`,
              type: "credit",
              amount: parseFloat(formData.fee),
              details: `Airway bill fee for consignment #${consignmentId}`,
              consignmentId: parseInt(consignmentId),
            };

            await axiosInstance.post(
              "/vendor/transactions",
              transactionPayload
            );
          }
        } catch (transactionError) {
          console.warn("Failed to create transaction:", transactionError);
          // Continue with airway bill creation even if transaction fails
        }
      }

      if (!existingData) {
        await UpdateConsignment(consignmentId, {
          airwayBill: { id, ...payload },
        });
      }

      setFormStatuses((prev) => ({
        ...prev,
        airwayBill: { id, ...payload },
      }));

      setActiveAccordion(null);

      MySwal.fire({
        icon: "success",
        title: "Success!",
        text: existingData
          ? "Airway bill updated successfully!"
          : "Airway bill added successfully!",
        showConfirmButton: false,
        timer: 2000,
        background: "rgb(var(--color-background))",
        color: "rgb(var(--color-text))",
        iconColor: "rgb(var(--color-primary))",
      });
    } catch (error) {
      console.error("Error saving airway bill:", error);
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
      setIsSubmitLoading(false);
    }
  };

  useEffect(() => {
    if (existingData) {
      setFormData({
        billNumber: existingData.number || "",
        rate: existingData.rate || "",
        airwayBillWeight: existingData.airwayBillWeight || "",
        fee: existingData.fee || "",
        selectedIataAgent: existingData.iataAgent || null,
        date: existingData.dateTime
          ? moment(existingData.dateTime).format("YYYY-MM-DD")
          : new Date().toISOString().split("T")[0],
      });
    }
  }, [existingData]);

  const handleIataAgentChange = (e) => {
    const selectedId = e.target.value;
    if (selectedId === "add-new-iataagent") {
      router.push("/consignment/iata-agent/add-iataAgent");
    } else {
      const selectedAgent = iataAgentsData.find(
        (t) => t.id === parseInt(selectedId)
      );
      handleInputChange("selectedIataAgent", selectedAgent);
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
          {loading ? "Loading IATA agents..." : placeholder}
        </option>
        {options?.map((option) => (
          <option
            key={option.id}
            value={option.id}
            className="text-text bg-background"
          >
            {option.vendor?.name}{" "}
            {option.vendor?.station ? `- ${option.vendor.station}` : ""}
          </option>
        ))}
        <option
          value="add-new-iataagent"
          className="text-primary font-semibold bg-primary/10 cursor-pointer"
        >
          + Add New IATA Agent
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
              <FaPlane className="text-primary text-xl" />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-poppins text-text">
                Airway / Seaway Bill
              </h2>
              <p className="text-text/70 font-inter mt-1">
                {existingData
                  ? "Update shipping document details"
                  : "Add airway or seaway bill information"}
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

          <div className="grid grid-cols-1 gap-6">
            {/* Bill Number */}
            <Input
              id="billNumber"
              type="text"
              value={formData.billNumber}
              onChange={(e) => handleInputChange("billNumber", e.target.value)}
              placeholder="Enter airway/seaway bill number"
              label="Bill Number *"
              disabled={isLocked}
              required
            />

            {/* IATA Agent Selection */}
            <CustomSelect
              id="iataAgents"
              value={formData.selectedIataAgent}
              onChange={handleIataAgentChange}
              options={iataAgentsData}
              loading={isLoadingAgents}
              label="IATA Agent *"
              placeholder="Select IATA agent"
              icon={FaUser}
            />

            {/* Date */}
            <div className="space-y-2">
              <label
                htmlFor="date"
                className=" text-sm font-medium text-text font-poppins flex items-center space-x-2"
              >
                <FaCalendarAlt className="text-primary text-sm" />
                <span>
                  Bill Date *{" "}
                  {isLocked && (
                    <span className="text-red-500 text-xs">(Locked)</span>
                  )}
                </span>
              </label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange("date", e.target.value)}
                disabled={isLocked}
                required
              />
            </div>

            {/* Rate and Weight in Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                id="rate"
                type="number"
                value={formData.rate}
                onChange={(e) => handleInputChange("rate", e.target.value)}
                placeholder="Enter rate"
                label="Rate *"
                disabled={isLocked}
                min="0"
                step="0.01"
                icon={FaMoneyBill}
                required
              />

              <Input
                id="airwayBillWeight"
                type="number"
                value={formData.airwayBillWeight}
                onChange={(e) =>
                  handleInputChange("airwayBillWeight", e.target.value)
                }
                placeholder="Enter weight"
                label="Weight (kg) *"
                disabled={isLocked}
                min="0"
                step="0.01"
                icon={FaWeight}
                required
              />
            </div>

            {/* Fee */}
            <Input
              id="fee"
              type="number"
              value={formData.fee}
              onChange={(e) => handleInputChange("fee", e.target.value)}
              placeholder="Enter agent fee"
              label="Agent Fee *"
              disabled={isLocked}
              min="0"
              step="0.01"
              icon={FaMoneyBill}
              required
            />

            {/* Summary Card */}
            {formData.rate && formData.airwayBillWeight && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-primary/5 rounded-xl p-4 border border-primary/20"
              >
                <h4 className="font-semibold text-text font-poppins mb-2">
                  Summary
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm font-inter">
                  <div>
                    <p className="text-text/70">Total Cost</p>
                    <p className="font-semibold text-text">
                      $
                      {(
                        (parseFloat(formData.rate) || 0) *
                        (parseFloat(formData.airwayBillWeight) || 0)
                      ).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-text/70">Total with Fee</p>
                    <p className="font-semibold text-text">
                      $
                      {(
                        (parseFloat(formData.rate) || 0) *
                          (parseFloat(formData.airwayBillWeight) || 0) +
                        (parseFloat(formData.fee) || 0)
                      ).toFixed(2)}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
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
              isLoading={submitLoading}
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
