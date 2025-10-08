"use client";

import SaveButton from "@components/Button/SaveButton";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import Input from "@components/Input";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchFinancialInstrument, fetchFiu } from "@constants/consignmentAPI";
import axiosInstance from "@utils/axiosConfig";
import {
  FaArrowLeft,
  FaPlus,
  FaTrash,
  FaMoneyBill,
  FaFileInvoice,
  FaChartLine,
} from "react-icons/fa";
import { useRouter } from "next/navigation";

const MySwal = withReactContent(Swal);

const FIU = ({ setShowFinancialUtilization, formStatus, isLocked = false }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [utilizations, setUtilizations] = useState([]);
  const [error, setError] = useState("");

  const { data: FiData = [], isLoading: FiLoading } = useQuery({
    queryKey: ["financialinstrument"],
    queryFn: fetchFinancialInstrument,
  });

  const { data: FiuData = [] } = useQuery({
    queryKey: ["utilization"],
    queryFn: fetchFiu,
  });

  // Prepare the form with existing data
  useEffect(() => {
    if (!formStatus.goodsDeclaration?.id || !FiuData.length || FiLoading)
      return;

    const existing = FiuData.filter(
      (fiu) => fiu.goodsDeclaration?.id === formStatus.goodsDeclaration.id
    );

    if (existing.length) {
      const mapped = existing.map((u) => ({
        id: u.id,
        financialInstrumentId: u.financialInstrument?.id || "",
        utilized: u.utilized || "",
        instrument: u.financialInstrument,
      }));

      setUtilizations((prev) => {
        const isSame = JSON.stringify(prev) === JSON.stringify(mapped);
        return isSame ? prev : mapped;
      });
    } else {
      setUtilizations([{ financialInstrumentId: "", utilized: "" }]);
    }
  }, [formStatus.goodsDeclaration?.id, FiuData, FiLoading]);

  const mutation = useMutation({
    mutationFn: async () => {
      await Promise.all(
        utilizations.map(async (u) => {
          const selectedFi = FiData.find(
            (fi) => fi.id === Number(u.financialInstrumentId)
          );
          if (!selectedFi) return;

          const payload = {
            financialInstrument: selectedFi,
            goodsDeclaration: formStatus.goodsDeclaration,
            utilized: Number(u.utilized),
          };

          if (u.id) {
            await axiosInstance.put(`/utilization/${u.id}`, payload);
          } else {
            await axiosInstance.post("/utilization", payload);
          }
        })
      );
    },
    onSuccess: () => {
      MySwal.fire({
        icon: "success",
        title: "Success!",
        text: "Financial utilization saved successfully.",
        showConfirmButton: false,
        timer: 2000,
        background: "rgb(var(--color-background))",
        color: "rgb(var(--color-text))",
        iconColor: "rgb(var(--color-primary))",
      });
      queryClient.invalidateQueries(["financialinstrument"]);
      queryClient.invalidateQueries(["utilization"]);
    },
    onError: (err) => {
      setError(err?.response?.data?.error || err.message);
      MySwal.fire({
        icon: "error",
        title: "Error",
        text: err?.response?.data?.error || err.message,
        background: "rgb(var(--color-background))",
        color: "rgb(var(--color-text))",
        confirmButtonColor: "rgb(var(--color-primary))",
      });
    },
  });

  const handleSubmit = () => {
    if (!formStatus.goodsDeclaration?.id) {
      return MySwal.fire({
        icon: "warning",
        title: "Missing Goods Declaration",
        text: "Goods declaration is required before adding financial utilization.",
        background: "rgb(var(--color-background))",
        color: "rgb(var(--color-text))",
        confirmButtonColor: "rgb(var(--color-primary))",
      });
    }

    if (isLocked) {
      return MySwal.fire({
        icon: "warning",
        title: "Form Locked",
        text: "This consignment is fulfilled. Please contact administrator to make changes.",
        background: "rgb(var(--color-background))",
        color: "rgb(var(--color-text))",
        confirmButtonColor: "rgb(var(--color-primary))",
      });
    }

    if (
      utilizations.some(
        (u) =>
          !u.financialInstrumentId ||
          isNaN(u.utilized) ||
          Number(u.utilized) <= 0
      )
    ) {
      return MySwal.fire({
        icon: "warning",
        title: "Invalid Data",
        text: "Please fill all fields with valid amounts greater than 0.",
        background: "rgb(var(--color-background))",
        color: "rgb(var(--color-text))",
        confirmButtonColor: "rgb(var(--color-primary))",
      });
    }

    mutation.mutate();
  };

  const handleFiChange = (index, id) => {
    if (id === "add-new-financial-instrument") {
      router.push("/consignment/add-financialinstrument");
      return;
    }
    const updated = [...utilizations];
    updated[index].financialInstrumentId = id;

    // Auto-populate instrument details if available
    const selectedFi = FiData.find((fi) => fi.id === Number(id));
    if (selectedFi) {
      updated[index].instrument = selectedFi;
    }

    setUtilizations(updated);
  };

  const handleUtilizedChange = (index, val) => {
    const updated = [...utilizations];
    updated[index].utilized = val;
    setUtilizations(updated);
  };

  const addNew = () => {
    if (isLocked) return;
    setUtilizations([
      ...utilizations,
      { financialInstrumentId: "", utilized: "" },
    ]);
  };

  const removeUtilization = (index) => {
    if (isLocked) return;
    const updated = utilizations.filter((_, i) => i !== index);
    setUtilizations(updated);
  };

  const selectedIds = utilizations.map((u) => Number(u.financialInstrumentId));
  const hasEmptyRow = utilizations.some(
    (u) => !u.financialInstrumentId || !u.utilized
  );

  const totalUtilized = utilizations.reduce(
    (sum, u) => sum + (parseFloat(u.utilized) || 0),
    0
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-4xl mx-auto"
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
                Financial Instrument Utilization
              </h2>
              <p className="text-text/70 font-inter mt-1">
                Allocate financial instruments to this goods declaration
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

          {/* Total Utilization Summary */}
          {totalUtilized > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-primary/5 rounded-xl p-4 border border-primary/20"
            >
              <h4 className="font-semibold text-text font-poppins mb-2 flex items-center gap-2">
                <FaMoneyBill className="text-primary" />
                Utilization Summary
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm font-inter">
                <div>
                  <p className="text-text/70">Total Utilized</p>
                  <p className="text-2xl font-bold text-text font-poppins">
                    {totalUtilized.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-text/70">Number of Instruments</p>
                  <p className="text-2xl font-bold text-text font-poppins">
                    {utilizations.filter((u) => u.financialInstrumentId).length}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Utilization Forms */}
          <div className="space-y-4">
            <AnimatePresence>
              {utilizations.map((util, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="bg-background rounded-xl border border-primary/20 p-4 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-text font-poppins flex items-center gap-2">
                      <FaFileInvoice className="text-primary text-sm" />
                      Instrument #{index + 1}
                    </h4>
                    {utilizations.length > 1 && !isLocked && (
                      <button
                        onClick={() => removeUtilization(index)}
                        className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Remove instrument"
                      >
                        <FaTrash size={14} />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Financial Instrument Selection */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-text font-poppins">
                        Financial Instrument *
                      </label>
                      <select
                        value={util.financialInstrumentId || ""}
                        onChange={(e) => handleFiChange(index, e.target.value)}
                        disabled={isLocked || FiLoading}
                        className="w-full px-4 py-3 bg-background border border-primary/20 rounded-xl text-text placeholder-text/50 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 font-inter disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="" className="text-text/50">
                          {FiLoading
                            ? "Loading instruments..."
                            : "Select Financial Instrument"}
                        </option>
                        {FiData.map((fi) => (
                          <option
                            key={fi.id}
                            value={fi.id}
                            disabled={
                              selectedIds.includes(fi.id) &&
                              fi.id !== Number(util.financialInstrumentId)
                            }
                            className="text-text bg-background"
                          >
                            {fi.number} - Balance: {fi.balance} ({fi.currency})
                          </option>
                        ))}
                        <option
                          value="add-new-financial-instrument"
                          className="text-primary font-semibold bg-primary/10 cursor-pointer"
                        >
                          + Add New Financial Instrument
                        </option>
                      </select>

                      {/* Instrument Details */}
                      {util.instrument && (
                        <div className="text-xs text-text/60 font-inter mt-1">
                          Trader: {util.instrument.trader?.name} | Consignee:{" "}
                          {util.instrument.consignee?.vendor?.name}
                        </div>
                      )}
                    </div>

                    {/* Utilized Amount */}
                    <div className="space-y-2">
                      <Input
                        type="number"
                        placeholder="Enter utilized amount"
                        value={util.utilized}
                        onChange={(e) =>
                          handleUtilizedChange(index, e.target.value)
                        }
                        label="Utilized Amount *"
                        disabled={isLocked}
                        min="0"
                        step="0.01"
                        icon={FaMoneyBill}
                        helpertext={
                          util.instrument
                            ? `Available: ${util.instrument.balance}`
                            : ""
                        }
                      />
                    </div>
                  </div>

                  {/* Balance Warning */}
                  {util.instrument &&
                    util.utilized &&
                    parseFloat(util.utilized) > util.instrument.balance && (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                        <p className="text-red-500 text-sm font-inter">
                          ⚠️ Utilized amount ({util.utilized}) exceeds available
                          balance ({util.instrument.balance})
                        </p>
                      </div>
                    )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Add Another Button */}
          {!isLocked && (
            <motion.button
              onClick={addNew}
              disabled={hasEmptyRow}
              whileHover={!hasEmptyRow ? { scale: 1.02 } : {}}
              whileTap={!hasEmptyRow ? { scale: 0.98 } : {}}
              className={`w-full py-3 rounded-xl font-poppins font-medium transition-all duration-200 flex items-center justify-center gap-2  ${
                hasEmptyRow
                  ? "bg-gray-400 cursor-not-allowed text-white"
                  : "bg-secondary hover:bg-secondary/90 text-white shadow-lg"
              }`}
            >
              <FaPlus />
              Add Another Instrument
            </motion.button>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col  gap-4 pt-4 border-t border-primary/10">
            <SaveButton
              handleSubmit={handleSubmit}
              isLoading={mutation.isLoading}
              disabled={isLocked}
            />

            <button
              onClick={() => setShowFinancialUtilization(false)}
              className="flex items-center justify-center gap-2 px-6 py-3 border border-primary/20 text-text font-poppins font-medium rounded-xl hover:bg-primary/5 transition-all duration-200"
            >
              <FaArrowLeft />
              Back to Goods Declaration
            </button>
          </div>

          {isLocked && (
            <p className="text-center text-text/60 text-sm font-inter">
              This form is locked because the consignment is fulfilled
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default FIU;
