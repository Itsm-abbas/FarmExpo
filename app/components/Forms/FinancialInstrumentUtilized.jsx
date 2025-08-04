"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Swal from "sweetalert2";
import Input from "@components/Input";
import SaveButton from "@components/Button/SaveButton";
import { useQuery } from "@tanstack/react-query";
import { getCookie } from "cookies-next";
import {
  fetchFinancialInstrument,
  fetchGoodsDeclaration,
} from "@constants/consignmentAPI";

export default function FinancialInstrumentUtilizedForm() {
  const token = getCookie("token");
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const [submitLoading, setSubmitLoading] = useState(false);

  const [formData, setFormData] = useState({
    financialInstrumentId: "",
    goodsDeclarationId: "",
    utilized: "",
    isGoodsVerified: false,
  });

  const { isLoading: FiLoading, data: FiData } = useQuery({
    queryKey: ["financialinstrument"],
    queryFn: fetchFinancialInstrument,
  });

  const { isLoading: GdLoading, data: GdData } = useQuery({
    queryKey: ["goodsDeclaration"],
    queryFn: fetchGoodsDeclaration,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);

    try {
      const response = await fetch(`${apiUrl}/fiu`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          financialInstrumentId: parseInt(formData.financialInstrumentId),
          goodsDeclarationId: parseInt(formData.goodsDeclarationId),
          utilized: parseFloat(formData.utilized),
          isGoodsVerified: formData.isGoodsVerified,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save financial instrument utilization");
      }

      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Utilization added successfully!",
      });

      setFormData({
        financialInstrumentId: "",
        goodsDeclarationId: "",
        utilized: "",
        isGoodsVerified: false,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message,
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-gray-900 shadow-md rounded-lg p-6 w-full max-w-lg mx-auto"
    >
      <h2 className="text-2xl font-bold mb-6 text-center">
        Financial Instrument Utilized
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Financial Instrument Dropdown */}
        <motion.div>
          <label className="block text-sm font-medium mb-1">
            Financial Instrument
          </label>
          <select
            className="w-full p-2 border rounded-md bg-LightPBg dark:bg-DarkPBg dark:text-white"
            value={formData.financialInstrumentId}
            onChange={(e) =>
              setFormData({
                ...formData,
                financialInstrumentId: e.target.value,
              })
            }
          >
            <option value="">Select Financial Instrument</option>
            {FiData?.map((fi) => (
              <option key={fi.id} value={fi.id}>
                {fi.number}
              </option>
            ))}
          </select>
        </motion.div>

        {/* Goods Declaration Dropdown */}
        <motion.div>
          <label className="block text-sm font-medium mb-1">
            Goods Declaration
          </label>
          <select
            className="w-full p-2 border rounded-md bg-LightPBg dark:bg-DarkPBg dark:text-white"
            value={formData.goodsDeclarationId}
            onChange={(e) =>
              setFormData({ ...formData, goodsDeclarationId: e.target.value })
            }
          >
            <option value="">Select Goods Declaration</option>
            {GdData?.map((gd) => (
              <option key={gd.id} value={gd.id}>
                {gd.number}
              </option>
            ))}
          </select>
        </motion.div>

        {/* Utilized Amount */}
        <motion.div>
          <Input
            id="utilized"
            label="Utilized Amount"
            type="number"
            value={formData.utilized}
            onChange={(e) =>
              setFormData({ ...formData, utilized: e.target.value })
            }
          />
        </motion.div>

        {/* Goods Verification Checkbox */}
        <motion.div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isGoodsVerified"
            checked={formData.isGoodsVerified}
            onChange={(e) =>
              setFormData({ ...formData, isGoodsVerified: e.target.checked })
            }
            className="w-4 h-4"
          />
          <label htmlFor="isGoodsVerified" className="text-sm">
            Verify Goods Declaration
          </label>
        </motion.div>

        {/* Save Button */}
        <motion.div>
          <SaveButton handleSubmit={handleSubmit} isLoading={submitLoading} />
        </motion.div>
      </form>
    </motion.div>
  );
}
