"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
const ledgerData = require("../../../constants/financialLedger.json");
import { motion } from "framer-motion";
import Swal from "sweetalert2";

export default function LedgerPage() {
  const { id } = useParams();
  const [selectedCategory, setSelectedCategory] = useState("traders");
  const [selectedEntity, setSelectedEntity] = useState(ledgerData.traders[0]);
  const [updatedPaidAmount, setUpdatedPaidAmount] = useState("");

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setSelectedEntity(ledgerData[category][0]);
  };

  const handleEntityChange = (e) => {
    const selectedId = parseInt(e.target.value);
    const entity = ledgerData[selectedCategory].find(
      (entry) => entry.id === selectedId
    );
    setSelectedEntity(entity);
  };

  const handleUpdateAmount = async () => {
    if (!updatedPaidAmount || isNaN(updatedPaidAmount)) {
      Swal.fire({
        icon: "error",
        title: "Invalid Input",
        text: "Please enter a valid amount.",
      });
      return;
    }

    const newPaidAmount = parseFloat(updatedPaidAmount);
    const newRemaining = selectedEntity.totalAmount - newPaidAmount;

    Swal.fire({
      icon: "success",
      title: "Updated Successfully",
      text: `New Paid Amount: $${newPaidAmount.toLocaleString()} | Remaining: $${newRemaining.toLocaleString()}`,
    });

    setSelectedEntity({ ...selectedEntity, paidAmount: newPaidAmount });
    setUpdatedPaidAmount("");
  };

  return (
    <div className="min-h-screen flex bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="w-1/4 bg-white dark:bg-gray-800 shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Financial Ledger</h2>
        <ul className="space-y-2">
          {["traders", "consignees", "packers"].map((category) => (
            <motion.li
              key={category}
              className={`cursor-pointer p-2 rounded-md ${
                selectedCategory === category
                  ? "bg-blue-600 text-white"
                  : "hover:bg-gray-300 dark:hover:bg-gray-700"
              }`}
              onClick={() => handleCategoryChange(category)}
              whileHover={{ scale: 1.05 }}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </motion.li>
          ))}
        </ul>
      </div>

      {/* Main Content */}
      <motion.div
        className="w-3/4 p-6 bg-white dark:bg-gray-800 shadow-md rounded-md mx-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-xl font-bold mb-6">
          {selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}
        </h2>

        {/* Entity Dropdown */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            Select {selectedCategory.slice(0, -1)}
          </label>
          <select
            className="w-full p-2 border rounded-md bg-gray-100 dark:bg-gray-700 dark:text-white"
            value={selectedEntity.id}
            onChange={handleEntityChange}
          >
            {ledgerData[selectedCategory].map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.name}
              </option>
            ))}
          </select>
        </div>

        {/* Financial Details */}
        <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-md">
          <p className="mb-2">
            <strong>Total Amount:</strong> $
            {selectedEntity.totalAmount.toLocaleString()}
          </p>
          <p className="mb-2 text-green-500">
            <strong>Paid Amount:</strong> $
            {selectedEntity.paidAmount.toLocaleString()}
          </p>
          <p className="mb-2 text-red-500">
            <strong>Remaining Balance:</strong> $
            {(
              selectedEntity.totalAmount - selectedEntity.paidAmount
            ).toLocaleString()}
          </p>
        </div>

        {/* Update Form */}
        <div className="mt-6">
          <label className="block text-sm font-medium mb-1">
            Update Paid Amount
          </label>
          <input
            type="number"
            className="w-full p-2 border rounded-md bg-gray-100 dark:bg-gray-700 dark:text-white"
            value={updatedPaidAmount}
            onChange={(e) => setUpdatedPaidAmount(e.target.value)}
          />
          <motion.button
            onClick={handleUpdateAmount}
            className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-all"
            whileHover={{ scale: 1.05 }}
          >
            Update Amount
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
