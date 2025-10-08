"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import SaveButton from "@components/Button/SaveButton";
import UpdateConsignment from "@utils/updateConsignment";
import { fetchPackers } from "@constants/consignmentAPI";
import { useQuery } from "@tanstack/react-query";
import { getCookie } from "cookies-next";
import { useRouter } from "next/navigation";
import {
  FaBoxOpen,
  FaWeight,
  FaCalculator,
  FaDollarSign,
  FaTruckLoading,
} from "react-icons/fa";
import Input from "@components/Input";

const MySwal = withReactContent(Swal);

const Packing = ({
  consignmentId,
  existingData,
  setFormStatuses,
  setActiveAccordion,
  formStatus,
  isLocked = false,
}) => {
  const router = useRouter();
  const token = getCookie("token");
  const [ratePerKg, setRatePerKg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPacker, setSelectedPacker] = useState(null);
  const [totalPackingCost, setTotalPackingCost] = useState(0);

  const { data: packersData, isLoading: LoadingPackers } = useQuery({
    queryKey: ["packers"],
    queryFn: fetchPackers,
  });

  const handlePacker = (e) => {
    const selectedId = e.target.value;
    if (selectedId === "add-new-packer") {
      router.push("/consignment/packer/add-packer");
    } else {
      const packer = packersData.find((p) => p.id === parseInt(selectedId));
      setSelectedPacker(packer);
    }
  };

  // Calculate total packing cost when rate or airway bill weight changes
  useEffect(() => {
    if (ratePerKg && formStatus?.airwayBill?.airwayBillWeight) {
      const total =
        parseFloat(ratePerKg) *
        parseFloat(formStatus.airwayBill.airwayBillWeight);
      setTotalPackingCost(total);
    } else {
      setTotalPackingCost(0);
    }
  }, [ratePerKg, formStatus?.airwayBill?.airwayBillWeight]);

  useEffect(() => {
    if (existingData) {
      setSelectedPacker(existingData.packer);
      setRatePerKg(existingData.ratePerKg);
    }
  }, [existingData]);

  const handleSubmit = async () => {
    if (!ratePerKg || selectedPacker === null) {
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

    if (!formStatus?.airwayBill?.airwayBillWeight) {
      MySwal.fire({
        icon: "warning",
        title: "Airway Bill Required",
        text: "Please add Airway Bill first to get the total weight.",
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
      const payload = {
        packer: selectedPacker,
        ratePerKg,
        totalCost: totalPackingCost,
      };

      const url = existingData
        ? `/api/packing/${existingData.id}`
        : `/api/packing`;
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
        throw new Error("Failed to save data");
      }

      const { id } = await response.json();

      // Update consignment
      if (!existingData) {
        await UpdateConsignment(consignmentId, {
          packing: {
            id,
            ...payload,
            totalCost: totalPackingCost,
          },
        });
      }

      setFormStatuses((prev) => ({
        ...prev,
        packing: {
          id,
          ...payload,
          totalCost: totalPackingCost,
        },
      }));

      setActiveAccordion(null);

      MySwal.fire({
        icon: "success",
        title: "Success!",
        text: `Packing data ${
          existingData ? "updated" : "added"
        } successfully. Total cost: ${
          selectedPacker.vendor.currency
        } ${totalPackingCost.toLocaleString()}`,
        showConfirmButton: false,
        timer: 2000,
        background: "rgb(var(--color-background))",
        color: "rgb(var(--color-text))",
        iconColor: "rgb(var(--color-primary))",
      });
    } catch (error) {
      console.error("Error saving packing:", error);
      MySwal.fire({
        icon: "error",
        title: "Error",
        text: "An error occurred while saving data.",
        background: "rgb(var(--color-background))",
        color: "rgb(var(--color-text))",
        confirmButtonColor: "rgb(var(--color-primary))",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const CustomSelect = ({ value, onChange, loading }) => (
    <div className="space-y-2">
      <label
        htmlFor="packers"
        className="text-sm font-medium text-text font-poppins flex items-center space-x-2"
      >
        <FaTruckLoading className="text-primary text-sm" />
        <span>
          Select Packer *{" "}
          {isLocked && <span className="text-red-500 text-xs">(Locked)</span>}
        </span>
      </label>
      <select
        id="packers"
        value={value?.id || ""}
        onChange={onChange}
        disabled={isLocked || loading}
        className="w-full px-4 py-3 bg-background border border-primary/20 rounded-xl text-text placeholder-text/50 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 font-inter disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <option value="" className="text-text/50">
          {loading ? "Loading packers..." : "Choose a packer"}
        </option>
        {packersData?.map((p) => (
          <option key={p.id} value={p.id} className="text-text bg-background">
            {p.vendor.name} - {p.vendor.station} ({p.vendor.country})
          </option>
        ))}
        <option
          value="add-new-packer"
          className="text-primary font-semibold bg-primary/10 cursor-pointer"
        >
          + Add New Packer
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
              <FaBoxOpen className="text-primary text-xl" />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-poppins text-text">
                Packing Services
              </h2>
              <p className="text-text/70 font-inter mt-1">
                {existingData
                  ? "Update packing details"
                  : "Arrange packing services for this consignment"}
              </p>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6 space-y-6">
          {/* Packer Selection */}
          <CustomSelect
            value={selectedPacker}
            onChange={handlePacker}
            loading={LoadingPackers}
          />

          {/* Selected Packer Details */}
          {selectedPacker && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="bg-primary/5 rounded-xl p-4 border border-primary/20"
            >
              <h4 className="font-semibold text-text font-poppins mb-3 flex items-center gap-2">
                <FaTruckLoading className="text-primary" />
                Packer Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm font-inter">
                <div>
                  <p className="text-text/70">Name</p>
                  <p className="font-medium text-text">
                    {selectedPacker.vendor?.name}
                  </p>
                </div>
                <div>
                  <p className="text-text/70">Station</p>
                  <p className="font-medium text-text">
                    {selectedPacker.vendor?.station}
                  </p>
                </div>
                <div>
                  <p className="text-text/70">Country</p>
                  <p className="font-medium text-text">
                    {selectedPacker.vendor?.country}
                  </p>
                </div>
                <div>
                  <p className="text-text/70">Currency</p>
                  <p className="font-medium text-text">
                    {selectedPacker.vendor?.currency}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Rate per kg */}
          <div className="space-y-2">
            <label
              htmlFor="ratePerKg"
              className="text-sm font-medium text-text font-poppins flex items-center space-x-2"
            >
              <FaDollarSign className="text-primary text-sm" />
              <span>
                Rate per Kg *{" "}
                {isLocked && (
                  <span className="text-red-500 text-xs">(Locked)</span>
                )}
              </span>
            </label>
            <Input
              id="ratePerKg"
              type="number"
              min="0"
              value={ratePerKg}
              onChange={(e) => setRatePerKg(e.target.value)}
              disabled={isLocked}
              placeholder="Enter rate per kg"
            />
          </div>

          {/* Packing Calculation */}
          {formStatus?.airwayBill?.airwayBillWeight ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-green-500/10 border border-green-500/20 rounded-xl p-4"
            >
              <h4 className="font-semibold text-text font-poppins mb-3 flex items-center gap-2">
                <FaCalculator className="text-green-500" />
                Packing Calculation
              </h4>
              <div className="space-y-2 text-sm font-inter">
                <div className="flex justify-between">
                  <span className="text-text/70">Airway Bill Weight:</span>
                  <span className="font-medium text-text">
                    {formStatus.airwayBill.airwayBillWeight} kg
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text/70">Rate:</span>
                  <span className="font-medium text-text">
                    {selectedPacker?.vendor?.currency || "USD"} {ratePerKg} per
                    kg
                  </span>
                </div>
                <div className="border-t border-green-500/20 pt-2 mt-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-text">Total Packing Cost:</span>
                    <span className="text-green-500">
                      {selectedPacker?.vendor?.currency || "USD"}{" "}
                      {totalPackingCost.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4"
            >
              <div className="flex items-center gap-3">
                <FaWeight className="text-yellow-500 text-lg" />
                <div>
                  <p className="font-medium text-text font-poppins">
                    Airway Bill Required
                  </p>
                  <p className="text-text/70 text-sm font-inter">
                    Please add Airway Bill first to calculate packing cost
                  </p>
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
              disabled={isLocked || !formStatus?.airwayBill?.airwayBillWeight}
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

export default Packing;
