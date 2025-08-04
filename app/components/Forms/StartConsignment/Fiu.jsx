"use client";

import SaveButton from "@components/Button/SaveButton";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import Input from "@components/Input";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchFinancialInstrument, fetchFiu } from "@constants/consignmentAPI";
import axiosInstance from "@utils/axiosConfig";
import { FaArrowLeft, FaPlus } from "react-icons/fa";
import fonts from "@utils/fonts";
import { useRouter } from "next/navigation";

const MySwal = withReactContent(Swal);

const FIU = ({ setShowFinancialUtilization, formStatus }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [utilizations, setUtilizations] = useState([]);

  const { data: FiData = [], isLoading: FiLoading } = useQuery({
    queryKey: ["financialinstrument"],
    queryFn: fetchFinancialInstrument,
  });

  const { data: FiuData = [] } = useQuery({
    queryKey: ["utilization"],
    queryFn: fetchFiu,
  });
  console.log(utilizations);
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
      }));

      // Only update state if it differs
      setUtilizations((prev) => {
        const isSame = JSON.stringify(prev) === JSON.stringify(mapped);
        return isSame ? prev : mapped;
      });
    } else {
      // Default one empty row for fresh entry
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

          await axiosInstance.post("/utilization", payload);
        })
      );
    },
    onSuccess: () => {
      MySwal.fire({
        icon: "success",
        title: "Success",
        text: "Utilization saved successfully.",
        showConfirmButton: false,
        timer: 1500,
      });
      queryClient.invalidateQueries(["financialinstrument"]);
      queryClient.invalidateQueries(["utilization"]);
    },
    onError: (err) => {
      MySwal.fire({
        icon: "error",
        title: "Error",
        text: err?.response?.data?.error || err.message,
      });
    },
  });

  const handleSubmit = () => {
    if (!formStatus.goodsDeclaration?.id) {
      return MySwal.fire({
        icon: "error",
        title: "Missing",
        text: "Goods declaration is required.",
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
        icon: "error",
        title: "Invalid",
        text: "Fill all fields correctly.",
      });
    }

    mutation.mutate();
  };

  const handleFiChange = (index, id) => {
    // const selectedId = e.target.value;
    if (id === "add-new-financial-instrument") {
      router.push("/consignment/add-financialinstrument");
    }
    const updated = [...utilizations];
    updated[index].financialInstrumentId = id;
    setUtilizations(updated);
  };

  const handleUtilizedChange = (index, val) => {
    const updated = [...utilizations];
    updated[index].utilized = val;
    setUtilizations(updated);
  };

  const addNew = () => {
    setUtilizations([
      ...utilizations,
      { financialInstrumentId: "", utilized: "" },
    ]);
  };

  const selectedIds = utilizations.map((u) => Number(u.financialInstrumentId));
  const hasEmptyRow = utilizations.some(
    (u) => !u.financialInstrumentId || !u.utilized
  );

  return (
    <motion.div
      className="shadow-md rounded-md p-6 space-y-4 border-LightBorder dark:border-DarkBorder border-2"
      initial={{ scale: 0.95 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-xl font-semibold mb-8">Financial Utilization</h2>

      {utilizations.map((util, index) => (
        <div key={index} className="space-y-2">
          <label className="block text-sm font-medium">
            Financial Instrument
          </label>
          <select
            className="w-full p-2 border rounded-md bg-LightPBg dark:bg-DarkPBg dark:text-white"
            value={util.financialInstrumentId || ""}
            onChange={(e) => handleFiChange(index, e.target.value)}
          >
            <option value="">Select Financial Instrument</option>
            {FiData.map((fi) => (
              <option
                key={fi.id}
                value={fi.id}
                disabled={
                  selectedIds.includes(fi.id) &&
                  fi.id !== Number(util.financialInstrumentId)
                }
              >
                {fi.number} (Balance: {fi.balance})
              </option>
            ))}
            <option
              value="add-new-financial-instrument"
              className="text-green-600 font-semibold cursor-pointer"
            >
              + Add New Financial Instrument
            </option>
          </select>

          <Input
            type="number"
            placeholder="Utilized Amount"
            value={util.utilized}
            onChange={(e) => handleUtilizedChange(index, e.target.value)}
          />
        </div>
      ))}

      <button
        disabled={hasEmptyRow}
        onClick={addNew}
        className={`disabled:bg-opacity-60  w-full bg-blue-500 capitalize text-white py-2 rounded-md hover:bg-blue-600 transition ${fonts.lato.className} `}
      >
        <span className="flex items-center justify-center gap-2">
          <FaPlus />
          Add Another
        </span>
      </button>

      <SaveButton handleSubmit={handleSubmit} isLoading={mutation.isLoading} />

      <button
        onClick={() => setShowFinancialUtilization(false)}
        className="flex items-center gap-2 text-sm mt-4 hover:underline text-gray-600 dark:text-gray-300"
      >
        <FaArrowLeft /> Back to Goods Declaration
      </button>
    </motion.div>
  );
};

export default FIU;
