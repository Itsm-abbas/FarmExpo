"use client";

import UpdateConsignment from "@utils/updateConsignment";
import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import SaveButton from "@components/Button/SaveButton";
import Input from "@components/Input";
import { motion } from "framer-motion";
import FIU from "./Fiu";
import { getCookie } from "cookies-next";
import {
  FaFileInvoice,
  FaExchangeAlt,
  FaMoneyBill,
  FaCalendarAlt,
  FaChartLine,
} from "react-icons/fa";

const MySwal = withReactContent(Swal);

export default function GoodsDeclarationForm({
  consignmentId,
  existingData,
  setFormStatuses,
  formStatus,
  setActiveAccordion,
  isLocked = false,
}) {
  const token = getCookie("token");
  const [formData, setFormData] = useState({
    number: "",
    date: "",
    exchangeRate: "",
    commercialInvoiceNumber: "",
    fob: "",
    gdFreight: "",
    r1: "",
    dateR1: "",
    r2: "",
    dateR2: "",
    r3: "",
    dateR3: "",
    r4: "",
    dateR4: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showFinancialUtilization, setShowFinancialUtilization] =
    useState(false);

  useEffect(() => {
    if (existingData) {
      // Format dates for input fields (YYYY-MM-DD)
      const formattedData = { ...existingData };

      // Format main date fields
      if (existingData.date) {
        formattedData.date = new Date(existingData.date)
          .toISOString()
          .split("T")[0];
      }

      // Format R date fields
      const dateFields = ["dateR1", "dateR2", "dateR3", "dateR4"];
      dateFields.forEach((field) => {
        if (existingData[field]) {
          formattedData[field] = new Date(existingData[field])
            .toISOString()
            .split("T")[0];
        } else {
          formattedData[field] = "";
        }
      });

      // Convert null values to empty strings for R fields
      const rFields = ["r1", "r2", "r3", "r4"];
      rFields.forEach((field) => {
        if (existingData[field] === null || existingData[field] === undefined) {
          formattedData[field] = "";
        }
      });

      setFormData(formattedData);
    }
  }, [existingData]);

  const handleSubmit = async () => {
    const requiredFields = [
      "number",
      "date",
      "exchangeRate",
      "commercialInvoiceNumber",
      "fob",
      "gdFreight",
    ];

    const emptyField = requiredFields.find((field) => !formData[field]);

    if (emptyField) {
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

    setIsLoading(true);
    setError("");

    try {
      const url = existingData
        ? `/api/goods-declaration/${existingData.id}`
        : `/api/goods-declaration`;
      const method = existingData ? "PUT" : "POST";

      // Prepare data for API - convert empty strings to null for optional fields
      const apiData = {
        number: formData.number,
        date: formData.date,
        exchangeRate: parseFloat(formData.exchangeRate),
        commercialInvoiceNumber: formData.commercialInvoiceNumber,
        fob: parseFloat(formData.fob),
        gdFreight: parseFloat(formData.gdFreight),
        r1: formData.r1 ? parseFloat(formData.r1) : null,
        dateR1: formData.dateR1 || null,
        r2: formData.r2 ? parseFloat(formData.r2) : null,
        dateR2: formData.dateR2 || null,
        r3: formData.r3 ? parseFloat(formData.r3) : null,
        dateR3: formData.dateR3 || null,
        r4: formData.r4 ? parseFloat(formData.r4) : null,
        dateR4: formData.dateR4 || null,
      };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!existingData) {
        await UpdateConsignment(consignmentId, {
          goodsDeclaration: { id: result.id, ...formData },
        });
      }

      setFormStatuses((prev) => ({
        ...prev,
        goodsDeclaration: { id: result.id, ...formData },
      }));

      setShowFinancialUtilization(true);

      MySwal.fire({
        icon: "success",
        title: "Success!",
        text: existingData
          ? "Goods Declaration updated successfully!"
          : "Goods Declaration added successfully!",
        showConfirmButton: false,
        timer: 2000,
        background: "rgb(var(--color-background))",
        color: "rgb(var(--color-text))",
        iconColor: "rgb(var(--color-primary))",
      });
    } catch (error) {
      console.error("Error saving goods declaration:", error);
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

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const RFields = [
    { key: "r1", dateKey: "dateR1", label: "R1" },
    { key: "r2", dateKey: "dateR2", label: "R2" },
    { key: "r3", dateKey: "dateR3", label: "R3" },
    { key: "r4", dateKey: "dateR4", label: "R4" },
  ];

  const totalValue =
    (parseFloat(formData.fob) || 0) + (parseFloat(formData.gdFreight) || 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-4xl mx-auto"
    >
      {!showFinancialUtilization ? (
        <div className="bg-background rounded-2xl border border-primary/20 shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-6 border-b border-primary/20">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <FaFileInvoice className="text-primary text-xl" />
              </div>
              <div>
                <h2 className="text-2xl font-bold font-poppins text-text">
                  Goods Declaration
                </h2>
                <p className="text-text/70 font-inter mt-1">
                  {existingData
                    ? "Update goods declaration details"
                    : "Add goods declaration information"}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <Input
                  label="Declaration Number"
                  value={formData.number}
                  onChange={(e) => handleInputChange("number", e.target.value)}
                  placeholder="Enter declaration number"
                  disabled={isLocked}
                  icon={FaFileInvoice}
                  required
                />

                <Input
                  type="date"
                  label="Declaration Date"
                  value={formData.date}
                  onChange={(e) => handleInputChange("date", e.target.value)}
                  disabled={isLocked}
                  icon={FaCalendarAlt}
                  required
                />

                <Input
                  type="number"
                  step="0.01"
                  label="Exchange Rate"
                  value={formData.exchangeRate}
                  onChange={(e) =>
                    handleInputChange("exchangeRate", e.target.value)
                  }
                  placeholder="Enter exchange rate"
                  disabled={isLocked}
                  icon={FaExchangeAlt}
                  required
                />

                <Input
                  label="Commercial Invoice Number"
                  value={formData.commercialInvoiceNumber}
                  onChange={(e) =>
                    handleInputChange("commercialInvoiceNumber", e.target.value)
                  }
                  placeholder="Enter invoice number"
                  disabled={isLocked}
                  icon={FaFileInvoice}
                  required
                />
              </div>

              {/* Financial Information */}
              <div className="space-y-4">
                <Input
                  type="number"
                  step="0.01"
                  label="FOB Value"
                  value={formData.fob}
                  onChange={(e) => handleInputChange("fob", e.target.value)}
                  placeholder="Enter FOB value"
                  disabled={isLocked}
                  icon={FaMoneyBill}
                  required
                />

                <Input
                  type="number"
                  step="0.01"
                  label="GD Freight"
                  value={formData.gdFreight}
                  onChange={(e) =>
                    handleInputChange("gdFreight", e.target.value)
                  }
                  placeholder="Enter GD freight"
                  disabled={isLocked}
                  icon={FaMoneyBill}
                  required
                />

                {/* Total Value Display */}
                {totalValue > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-primary/5 rounded-xl p-4 border border-primary/20"
                  >
                    <h4 className="font-semibold text-text font-poppins mb-2">
                      Total Declared Value
                    </h4>
                    <p className="text-2xl font-bold text-text">
                      ${totalValue.toFixed(2)}
                    </p>
                    <p className="text-xs text-text/60 mt-1">
                      FOB + GD Freight
                    </p>
                  </motion.div>
                )}
              </div>
            </div>

            {/* R Fields Section */}
            {/* <div className="border-t border-primary/10 pt-6">
              <h3 className="text-lg font-semibold font-poppins text-text mb-4 flex items-center gap-2">
                <FaChartLine className="text-primary" />
                Additional Declarations (R1-R4)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {RFields.map(({ key, dateKey, label }) => (
                  <div key={key} className="space-y-3">
                    <Input
                      type="number"
                      step="0.01"
                      label={label}
                      placeholder={`Enter ${label} value`}
                      value={formData[key]}
                      onChange={(e) => handleInputChange(key, e.target.value)}
                      disabled={isLocked}
                      icon={FaMoneyBill}
                    />

                    <Input
                      type="date"
                      label={`${label} Date`}
                      value={formData[dateKey]}
                      onChange={(e) =>
                        handleInputChange(dateKey, e.target.value)
                      }
                      disabled={isLocked}
                      icon={FaCalendarAlt}
                    />
                  </div>
                ))}
              </div>
            </div> */}

            {/* Action Buttons */}
            <div className="flex flex-col  gap-4 pt-6 border-t border-primary/10">
              <SaveButton
                handleSubmit={handleSubmit}
                isLoading={isLoading}
                existingData={!!existingData}
                disabled={isLocked}
              />

              <button
                onClick={() => setShowFinancialUtilization(true)}
                disabled={isLocked}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-accent text-white font-poppins font-medium rounded-xl hover:bg-accent/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                <FaChartLine />
                Add Financial Utilization
              </button>
            </div>

            {isLocked && (
              <p className="text-center text-text/60 text-sm font-inter">
                This form is locked because the consignment is fulfilled
              </p>
            )}
          </div>
        </div>
      ) : (
        <FIU
          setShowFinancialUtilization={setShowFinancialUtilization}
          formStatus={formStatus}
          isLocked={isLocked}
        />
      )}
    </motion.div>
  );
}
