"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import SaveButton from "@components/Button/SaveButton";
import Input from "@components/Input";
import UpdateConsignment from "@utils/updateConsignment";
import { fetchPackers } from "@constants/consignmentAPI";
import { useQuery } from "@tanstack/react-query";
import { getCookie } from "cookies-next";
const MySwal = withReactContent(Swal);
const Packing = ({
  consignmentId,
  existingData,
  setFormStatuses,
  setActiveAccordion,
}) => {
  const token = getCookie("token");
  const [ratePerKg, setRatePerKg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPacker, setSelectedPacker] = useState(null);
  const { data: packersData, isLoading: LoadingPackers } = useQuery({
    queryKey: ["packers"],
    queryFn: fetchPackers,
  });
  useEffect(() => {
    if (existingData) {
      setSelectedPacker(existingData.packer);
      setRatePerKg(existingData.ratePerKg);
    }
  }, [existingData]);

  const handleSubmit = async () => {
    if (!ratePerKg || selectedPacker === null) {
      MySwal.fire({
        icon: "error",
        title: "Error",
        text: "Please fill in all the fields.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const payload = { packer: selectedPacker, ratePerKg };
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

      if (!existingData) {
        await UpdateConsignment(consignmentId, { packing: { id, ...payload } });
      }

      setFormStatuses((prev) => ({
        ...prev,
        packing: { id, ...payload },
      }));
      setActiveAccordion(null);
      MySwal.fire({
        icon: "success",
        title: "Success",
        text: "Packing data added successfully.",
        showConfirmButton: false,
        timer: 1500,
      });

      setRatePerKg("");
      setSelectedPacker(null);
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
  const handlePacker = (e) => {
    const selectedId = e.target.value;
    if (selectedId === "add-new-packer") {
      router.push("/consignment/packer/add-packer");
    } else {
      const packer = packersData.find((p) => p.id === parseInt(selectedId));
      setSelectedPacker(packer);
    }
  };
  return (
    <div className="space-y-4 text-LightPText dark:text-DarkPText w-full md:w-4/5 lg:w-1/2">
      <div className="shadow-md rounded-md p-6 space-y-4 border-LightBorder dark:border-DarkBorder border-2">
        <h2 className="text-xl font-semibold mb-4">Packing</h2>
        <div className="relative">
          <motion.div
            className="relative"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <motion.select
              id="packers"
              value={selectedPacker?.id || ""}
              onChange={handlePacker}
              className="bg-LightPBg text-black dark:text-white mb-7  block w-full border border-LightBorder dark:border-DarkBorder dark:bg-DarkInput rounded-md p-2 focus:ring-PrimaryButton focus:border-PrimaryButton dark:focus:ring-PrimaryButton dark:focus:border-PrimaryButton outline-none relative z-30 mt-7"
              whileFocus={{ scale: 1.02 }}
            >
              {LoadingPackers ? (
                <option value="">Loading...</option>
              ) : (
                <option value="">Select Packer</option>
              )}
              {packersData?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.vendor.name}
                </option>
              ))}
              <option
                value="add-new-customagent"
                className="text-green-600 capitalize font-semibold cursor-pointer"
              >
                + Add New Packer
              </option>
            </motion.select>
          </motion.div>
        </div>
        <Input
          id="ratePerKg"
          type="number"
          placeholder="Enter rate per kg"
          value={ratePerKg}
          onChange={(e) => setRatePerKg(e.target.value)}
        />
        <SaveButton
          handleSubmit={handleSubmit}
          isLoading={isLoading}
          existingData={existingData}
        />
      </div>
    </div>
  );
};

export default Packing;
