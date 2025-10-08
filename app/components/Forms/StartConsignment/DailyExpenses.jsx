"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import SaveButton from "@components/Button/SaveButton";
import Input from "@components/Input";
import UpdateConsignment from "@utils/updateConsignment";
import { FaReceipt, FaMoneyBill, FaChartLine } from "react-icons/fa";

const MySwal = withReactContent(Swal);

const DailyExpenses = ({
  consignmentId,
  existingData,
  setFormStatuses,
  setActiveAccordion,
  isLocked = false,
}) => {
  const [dailyExpenses, setDailyExpenses] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (existingData) {
      setDailyExpenses(existingData.toString());
    }
  }, [existingData]);

  const handleSubmit = async () => {
    if (!dailyExpenses || parseFloat(dailyExpenses) <= 0) {
      MySwal.fire({
        icon: "warning",
        title: "Invalid Amount",
        text: "Please enter a valid expense amount greater than 0.",
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
    setError("");

    try {
      const expenseAmount = parseFloat(dailyExpenses);

      await UpdateConsignment(consignmentId, {
        dailyExpenses: expenseAmount,
      });

      setFormStatuses((prev) => ({
        ...prev,
        dailyExpenses: expenseAmount,
      }));

      setActiveAccordion(null);

      MySwal.fire({
        icon: "success",
        title: "Success!",
        text: `Daily expenses of ${expenseAmount.toFixed(
          2
        )} added successfully.`,
        showConfirmButton: false,
        timer: 2000,
        background: "rgb(var(--color-background))",
        color: "rgb(var(--color-text))",
        iconColor: "rgb(var(--color-primary))",
      });
    } catch (error) {
      console.error("Error saving daily expenses:", error);
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
      setIsLoading(false);
    }
  };

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
              <FaReceipt className="text-primary text-xl" />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-poppins text-text">
                Daily Expenses
              </h2>
              <p className="text-text/70 font-inter mt-1">
                {existingData
                  ? "Update daily operational expenses"
                  : "Record daily operational expenses"}
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

          <div className="space-y-4">
            {/* Expense Input */}
            <Input
              id="dailyExpenses"
              type="number"
              value={dailyExpenses}
              onChange={(e) => setDailyExpenses(e.target.value)}
              placeholder="Enter daily expense amount"
              label="Daily Expense Amount *"
              disabled={isLocked}
              min="0"
              step="0.01"
              icon={FaMoneyBill}
              helpertext="Enter the total daily operational expenses for this consignment"
              required
            />

            {/* Expense Preview */}
            {dailyExpenses && parseFloat(dailyExpenses) > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-primary/5 rounded-xl p-4 border border-primary/20"
              >
                <h4 className="font-semibold text-text font-poppins mb-2 flex items-center gap-2">
                  <FaChartLine className="text-primary" />
                  Expense Summary
                </h4>
                <div className="text-sm font-inter">
                  <p className="text-text/70">Amount to be recorded:</p>
                  <p className="text-2xl font-bold text-text font-poppins mt-1">
                    {parseFloat(dailyExpenses).toFixed(2)}
                  </p>
                </div>
              </motion.div>
            )}

            {/* Expense Guidelines */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-accent/5 rounded-xl p-4 border border-accent/20"
            >
              <h4 className="font-semibold text-text font-poppins mb-2 text-sm">
                💡 Expense Guidelines
              </h4>
              <ul className="text-xs font-inter text-text/70 space-y-1">
                <li>
                  • Include all operational costs like transportation, labor,
                  and supplies
                </li>
                <li>• Record expenses daily for accurate financial tracking</li>
                <li>• Keep receipts and documentation for all expenses</li>
                <li>
                  • Separate consignment-specific expenses from general overhead
                </li>
              </ul>
            </motion.div>
          </div>

          {/* Save Button */}
          <motion.div
            className="pt-4 border-t border-primary/10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
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
};

export default DailyExpenses;
