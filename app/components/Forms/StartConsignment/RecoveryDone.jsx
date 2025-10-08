"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import SaveButton from "@components/Button/SaveButton";
import UpdateConsignment from "@utils/updateConsignment";
import { getCookie } from "cookies-next";
import {
  FaMoneyBillWave,
  FaExchangeAlt,
  FaChartLine,
  FaCheckCircle,
} from "react-icons/fa";
import Input from "@components/Input";

const MySwal = withReactContent(Swal);

export default function RecoveryDoneForm({
  consignmentId,
  existingData,
  setFormStatuses,
  setActiveAccordion,
  isLocked = false,
}) {
  const [formData, setFormData] = useState({
    amount: "",
    currency: "",
    exchangeRate: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const token = getCookie("token");

  const handleSubmit = async () => {
    if (!formData.amount || !formData.currency || !formData.exchangeRate) {
      MySwal.fire({
        icon: "warning",
        title: "Missing Information",
        text: "Please fill in all the fields.",
        background: "rgb(var(--color-background))",
        color: "rgb(var(--color-text))",
        confirmButtonColor: "rgb(var(--color-primary))",
      });
      return;
    }

    if (
      existingData &&
      formData.amount === existingData.amount &&
      formData.currency === existingData.currency &&
      formData.exchangeRate === existingData.exchangeRate
    ) {
      MySwal.fire({
        icon: "info",
        title: "No Changes",
        text: "No updates were made.",
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

    setIsLoading(true);
    try {
      const method = existingData ? "PUT" : "POST";
      const url = existingData
        ? `/api/recovery-done/${existingData.id}`
        : `/api/recovery-done`;

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error || "Failed to save data");

      await UpdateConsignment(
        consignmentId,
        { recoveryDone: { id: result.id, ...formData } },
        "Fulfilled"
      );

      setFormStatuses((prev) => ({
        ...prev,
        recoveryDone: { id: result.id, ...formData },
      }));
      setActiveAccordion(null);

      MySwal.fire({
        icon: "success",
        title: "Success!",
        text: existingData
          ? "Recovery updated successfully!"
          : "Recovery added successfully!",
        showConfirmButton: false,
        timer: 1500,
        background: "rgb(var(--color-background))",
        color: "rgb(var(--color-text))",
        iconColor: "rgb(var(--color-primary))",
      });

      if (!existingData) {
        setFormData({ amount: "", currency: "", exchangeRate: "" });
      }
    } catch (error) {
      MySwal.fire({
        icon: "error",
        title: "Error",
        text: error.message,
        background: "rgb(var(--color-background))",
        color: "rgb(var(--color-text))",
        confirmButtonColor: "rgb(var(--color-primary))",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (existingData) {
      setFormData(existingData);
    }
  }, [existingData]);

  const InputField = ({
    id,
    label,
    value,
    onChange,
    type = "text",
    placeholder,
    icon: Icon,
    ...props
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
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        disabled={isLocked}
        placeholder={placeholder}
        className="w-full px-4 py-3 bg-background border border-primary/20 rounded-xl text-text placeholder-text/50 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 font-inter disabled:opacity-50 disabled:cursor-not-allowed"
        {...props}
      />
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
              <FaChartLine className="text-primary text-xl" />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-poppins text-text">
                Recovery Details
              </h2>
              <p className="text-text/70 font-inter mt-1">
                {existingData
                  ? "Update recovery information"
                  : "Add recovery details for this consignment"}
              </p>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <Input
              id="amount"
              label="Recovery Amount *"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              type="number"
              placeholder="Enter recovery amount"
              icon={FaMoneyBillWave}
              min="0"
            />

            <Input
              id="currency"
              label="Currency *"
              value={formData.currency}
              onChange={(e) =>
                setFormData({ ...formData, currency: e.target.value })
              }
              placeholder="Enter currency (e.g., USD, EUR)"
              icon={FaMoneyBillWave}
            />

            <Input
              id="exchangeRate"
              label="Exchange Rate *"
              value={formData.exchangeRate}
              onChange={(e) =>
                setFormData({ ...formData, exchangeRate: e.target.value })
              }
              type="number"
              placeholder="Enter exchange rate"
              icon={FaExchangeAlt}
              min="0"
            />
          </div>

          {/* Calculation Preview */}
          {formData.amount && formData.exchangeRate && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-green-500/10 border border-green-500/20 rounded-xl p-4"
            >
              <h4 className="font-semibold text-text font-poppins mb-3 flex items-center gap-2">
                <FaCheckCircle className="text-green-500" />
                Recovery Calculation
              </h4>
              <div className="space-y-2 text-sm font-inter">
                <div className="flex justify-between">
                  <span className="text-text/70">Amount:</span>
                  <span className="font-medium text-text">
                    {formData.amount} {formData.currency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text/70">Exchange Rate:</span>
                  <span className="font-medium text-text">
                    {formData.exchangeRate}
                  </span>
                </div>
                <div className="border-t border-green-500/20 pt-2 mt-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-text">Converted Amount:</span>
                    <span className="text-green-500">
                      {(
                        parseFloat(formData.amount) *
                        parseFloat(formData.exchangeRate)
                      ).toLocaleString()}{" "}
                    </span>
                  </div>
                </div>
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
              isLoading={isLoading}
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
