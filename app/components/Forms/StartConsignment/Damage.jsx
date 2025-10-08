"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import Input from "@components/Input";
import { getCookie } from "cookies-next";
import {
  FaExclamationTriangle,
  FaBox,
  FaPercentage,
  FaCheck,
} from "react-icons/fa";

const MySwal = withReactContent(Swal);

export default function DamageForm({
  consignmentId,
  setFormStatuses,
  setActiveAccordion,
  isLocked = false,
}) {
  const token = getCookie("token");
  const [loadingStates, setLoadingStates] = useState({});
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState({});
  const [savedItems, setSavedItems] = useState(new Set());
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchConsignmentData = async () => {
      try {
        const response = await fetch(`/api/consignment/${consignmentId}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error("Failed to fetch consignment data.");

        const data = await response.json();
        setItems(data.goods || []);

        // Initialize form data and track saved items
        const initialFormData = {};
        const initialSavedItems = new Set();

        (data.goods || []).forEach((item) => {
          initialFormData[item.id] = item.damage ?? "";
          if (item.damage !== null && item.damage !== undefined) {
            initialSavedItems.add(item.id);
          }
        });

        setFormData(initialFormData);
        setSavedItems(initialSavedItems);
      } catch (error) {
        console.error("Error fetching consignment data:", error);
        setError(error.message);
        MySwal.fire({
          icon: "error",
          title: "Error",
          text: error.message,
          background: "rgb(var(--color-background))",
          color: "rgb(var(--color-text))",
          confirmButtonColor: "rgb(var(--color-primary))",
        });
      }
    };

    fetchConsignmentData();
  }, [consignmentId, token]);

  const handleSubmit = async (itemId) => {
    const damage = parseFloat(formData[itemId]);

    if (isNaN(damage) || damage < 0) {
      MySwal.fire({
        icon: "warning",
        title: "Invalid Damage Quantity",
        text: "Please enter a valid damage quantity (0 or greater).",
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

    setLoadingStates((prev) => ({ ...prev, [itemId]: true }));
    setError("");

    try {
      const targetItem = items.find((item) => item.id === itemId);
      if (!targetItem) throw new Error("Item not found.");

      const updatedItem = {
        ...targetItem,
        damage,
      };

      const response = await fetch(`/api/consignmentitem/${itemId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedItem),
      });

      if (!response.ok) throw new Error("Failed to update consignment item.");

      const updatedItems = items.map((item) =>
        item.id === itemId ? { ...item, damage } : item
      );

      setItems(updatedItems);
      setSavedItems((prev) => new Set(prev.add(itemId)));
      setFormStatuses((prev) => ({ ...prev, goods: updatedItems }));

      MySwal.fire({
        icon: "success",
        title: "Success!",
        text: `Damage recorded for ${targetItem.commodityItem?.name || "item"}`,
        showConfirmButton: false,
        timer: 1500,
        background: "rgb(var(--color-background))",
        color: "rgb(var(--color-text))",
        iconColor: "rgb(var(--color-primary))",
      });
    } catch (error) {
      console.error("Error updating damage:", error);
      setError(error.message);

      MySwal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "Failed to update damage.",
        background: "rgb(var(--color-background))",
        color: "rgb(var(--color-text))",
        confirmButtonColor: "rgb(var(--color-primary))",
      });
    } finally {
      setLoadingStates((prev) => ({ ...prev, [itemId]: false }));
    }
  };

  const calculateDamagePercentage = (item) => {
    const damage = parseFloat(formData[item.id]) || 0;
    const quantity = item.quantity || 1;
    return quantity > 0 ? ((damage / quantity) * 100).toFixed(1) : 0;
  };

  if (items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full max-w-2xl mx-auto"
      >
        <div className="bg-background rounded-2xl border border-primary/20 shadow-lg p-8 text-center">
          <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <FaBox className="text-primary text-2xl" />
          </div>
          <h3 className="text-xl font-semibold font-poppins text-text mb-2">
            No Items Found
          </h3>
          <p className="text-text/70 font-inter">
            There are no items in this consignment to record damage for.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-4xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="bg-background rounded-2xl border border-primary/20 shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-6 border-b border-primary/20">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <FaExclamationTriangle className="text-primary text-xl" />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-poppins text-text">
                Damage Report
              </h2>
              <p className="text-text/70 font-inter mt-1">
                Record damaged quantities for each consignment item
              </p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border border-red-500/20 rounded-xl p-4"
        >
          <p className="text-red-500 text-sm font-inter">{error}</p>
        </motion.div>
      )}

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatePresence>
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-background rounded-2xl border border-primary/20 shadow-lg overflow-hidden"
            >
              {/* Item Header */}
              <div
                className={`p-4 border-b ${
                  savedItems.has(item.id)
                    ? "bg-green-500/10 border-green-500/20"
                    : "bg-primary/5 border-primary/10"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold font-poppins text-text capitalize flex items-center gap-2">
                    <FaBox className="text-primary text-sm" />
                    {item.commodityItem?.name || "Unnamed Item"}
                    {savedItems.has(item.id) && (
                      <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <FaCheck size={8} />
                        Saved
                      </span>
                    )}
                  </h3>
                  <div className="text-xs text-text/70 font-inter">
                    Qty: {item.quantity || 0}
                  </div>
                </div>
              </div>

              {/* Item Content */}
              <div className="p-6 space-y-4">
                {/* Item Details */}
                <div className="grid grid-cols-2 gap-3 text-sm font-inter">
                  <div>
                    <p className="text-text/70">Packaging</p>
                    <p className="font-medium text-text">
                      {item.packaging?.name || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-text/70">Weight/Unit</p>
                    <p className="font-medium text-text">
                      {item.weightPerUnit || 0} kg
                    </p>
                  </div>
                </div>

                {/* Damage Input */}
                <Input
                  type="number"
                  id={`damage-${item.id}`}
                  label="Damaged Quantity"
                  value={formData[item.id]}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      [item.id]: e.target.value,
                    }))
                  }
                  placeholder="Enter damaged quantity"
                  disabled={isLocked}
                  min="0"
                  max={item.quantity || 0}
                  step="1"
                  icon={FaExclamationTriangle}
                  helpertext={`Max: ${item.quantity || 0} units`}
                />

                {/* Damage Summary */}
                {formData[item.id] && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="bg-accent/5 rounded-xl p-3 border border-accent/20"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text/70 flex items-center gap-1">
                        <FaPercentage className="text-accent" />
                        Damage Rate:
                      </span>
                      <span className="font-semibold text-text">
                        {calculateDamagePercentage(item)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-text/70">Good Units:</span>
                      <span className="font-semibold text-text">
                        {item.quantity - (parseFloat(formData[item.id]) || 0)}
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* Save Button */}
                <motion.button
                  onClick={() => handleSubmit(item.id)}
                  whileHover={
                    !isLocked && !loadingStates[item.id] ? { scale: 1.02 } : {}
                  }
                  whileTap={
                    !isLocked && !loadingStates[item.id] ? { scale: 0.98 } : {}
                  }
                  disabled={isLocked || loadingStates[item.id]}
                  className={`w-full py-3 rounded-xl font-poppins font-medium transition-all duration-200 ${
                    loadingStates[item.id]
                      ? "bg-gray-400 cursor-not-allowed text-white"
                      : isLocked
                      ? "bg-gray-400 cursor-not-allowed text-white"
                      : savedItems.has(item.id)
                      ? "bg-green-500 hover:bg-green-600 text-white shadow-lg"
                      : "bg-primary hover:bg-primary/90 text-white shadow-lg"
                  }`}
                >
                  {loadingStates[item.id] ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </span>
                  ) : savedItems.has(item.id) ? (
                    <span className="flex items-center justify-center gap-2">
                      <FaCheck />
                      Update Damage
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <FaExclamationTriangle />
                      Save Damage
                    </span>
                  )}
                </motion.button>

                {isLocked && (
                  <p className="text-center text-text/60 text-xs font-inter">
                    This item is locked because the consignment is fulfilled
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
