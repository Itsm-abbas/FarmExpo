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

const MySwal = withReactContent(Swal);

export default function GoodsDeclarationForm({
  consignmentId,
  existingData,
  setFormStatuses,
  formStatus,
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
  const [showFinancialUtilization, setShowFinancialUtilization] =
    useState(false);

  useEffect(() => {
    if (existingData) {
      setFormData(existingData);
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
      "r1",
      "dateR1",
      "r2",
      "dateR2",
      "r3",
      "dateR3",
      "r4",
      "dateR4",
    ];

    const emptyField = requiredFields.find((field) => !formData[field]);

    if (emptyField) {
      MySwal.fire({
        icon: "error",
        title: "Oops...",
        text: "Please fill in all the fields.",
      });
      return;
    }

    setIsLoading(true);

    try {
      const url = existingData
        ? `/api/goods-declaration/${existingData.id}`
        : `/api/goods-declaration`;
      const method = existingData ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const { id } = await response.json();
      if (!existingData) {
        await UpdateConsignment(consignmentId, {
          goodsDeclaration: { id, ...formData },
        });
      }

      setFormStatuses((prev) => ({
        ...prev,
        goodsDeclaration: { id, ...formData },
      }));

      setShowFinancialUtilization(true);

      MySwal.fire({
        icon: "success",
        title: "Success",
        showConfirmButton: false,
        timer: 1500,
        text: existingData
          ? "Goods Declaration updated successfully!"
          : "Goods Declaration added successfully!",
      });

      if (!existingData) {
        setFormData({
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
      }
    } catch (error) {
      MySwal.fire({
        icon: "error",
        title: "Error",
        text: "An error occurred while saving data.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      className="space-y-4 text-LightPText dark:text-DarkPText w-full md:w-4/5 lg:w-1/2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      {!showFinancialUtilization ? (
        <motion.div
          className="shadow-md rounded-md p-6 space-y-4 border-LightBorder dark:border-DarkBorder border-2"
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <h2 className="text-xl font-semibold mb-8">Goods Declaration</h2>

          <motion.div
            className="space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
          >
            <Input
              label="Number"
              value={formData.number}
              onChange={(e) =>
                setFormData({ ...formData, number: e.target.value })
              }
              placeholder="Enter number*"
            />
            <Input
              type="date"
              label="Date"
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
            />
            <Input
              type="number"
              step="0.01"
              label="Exchange Rate"
              value={formData.exchangeRate}
              onChange={(e) =>
                setFormData({ ...formData, exchangeRate: e.target.value })
              }
              placeholder="Enter exchange rate"
            />
            <Input
              label="Commercial Invoice Number"
              value={formData.commercialInvoiceNumber}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  commercialInvoiceNumber: e.target.value,
                })
              }
              placeholder="Enter Invoice Number"
            />
            <Input
              type="number"
              step="0.01"
              label="FOB"
              value={formData.fob}
              onChange={(e) =>
                setFormData({ ...formData, fob: e.target.value })
              }
              placeholder="Enter FOB"
            />
            <Input
              type="number"
              step="0.01"
              label="GD Freight"
              value={formData.gdFreight}
              onChange={(e) =>
                setFormData({ ...formData, gdFreight: e.target.value })
              }
              placeholder="Enter GD Freight"
            />

            {/* New R1–R4 fields */}
            <Input
              type="number"
              step="0.01"
              label="R1"
              placeholder={"Enter R1"}
              value={formData.r1}
              onChange={(e) => setFormData({ ...formData, r1: e.target.value })}
            />
            <Input
              type="date"
              label="Date R1"
              value={formData.dateR1}
              onChange={(e) =>
                setFormData({ ...formData, dateR1: e.target.value })
              }
            />

            <Input
              type="number"
              step="0.01"
              label="R2"
              placeholder={"Enter R2"}
              value={formData.r2}
              onChange={(e) => setFormData({ ...formData, r2: e.target.value })}
            />
            <Input
              type="date"
              label="Date R2"
              value={formData.dateR2}
              onChange={(e) =>
                setFormData({ ...formData, dateR2: e.target.value })
              }
            />

            <Input
              type="number"
              step="0.01"
              label="R3"
              placeholder={"Enter R3"}
              value={formData.r3}
              onChange={(e) => setFormData({ ...formData, r3: e.target.value })}
            />
            <Input
              type="date"
              label="Date R3"
              value={formData.dateR3}
              onChange={(e) =>
                setFormData({ ...formData, dateR3: e.target.value })
              }
            />

            <Input
              type="number"
              step="0.01"
              label="R4"
              placeholder={"Enter R4"}
              value={formData.r4}
              onChange={(e) => setFormData({ ...formData, r4: e.target.value })}
            />
            <Input
              type="date"
              label="Date R4"
              value={formData.dateR4}
              onChange={(e) =>
                setFormData({ ...formData, dateR4: e.target.value })
              }
            />
          </motion.div>

          <SaveButton
            handleSubmit={handleSubmit}
            isLoading={isLoading}
            existingData={existingData}
          />

          <button
            onClick={() => setShowFinancialUtilization(true)}
            className="flex item-center capitalize justify-center w-full bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 transition-all py-2 rounded-sm"
          >
            Add Financial instrument utilization
          </button>
        </motion.div>
      ) : (
        <FIU
          setShowFinancialUtilization={setShowFinancialUtilization}
          formStatus={formStatus}
        />
      )}
    </motion.div>
  );
}
