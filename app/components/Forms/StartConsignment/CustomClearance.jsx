"use client";
import React, { useState, useEffect } from "react";
import UpdateConsignment from "@utils/updateConsignment";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import SaveButton from "@components/Button/SaveButton";
import Input from "@components/Input";
import { useQuery } from "@tanstack/react-query";
import { fetchCustomAgents } from "@constants/consignmentAPI";
import { motion } from "framer-motion";
import { getCookie } from "cookies-next";
const MySwal = withReactContent(Swal);

export default function CustomClearence({
  consignmentId,
  existingData,
  setFormStatuses,
  setActiveAccordion,
}) {
  const token = getCookie("token");
  const [fee, setFee] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedCustomAgent, setSelectedCustomAgent] = useState(null); // Selected custom agent
  const { data: customAgentsData, isLoading: LoadingCustomAgents } = useQuery({
    queryKey: ["customAgents"],
    queryFn: fetchCustomAgents,
  });
  useEffect(() => {
    if (existingData) {
      setSelectedCustomAgent(existingData.ca); // Pre-select the existing agent
      setFee(existingData.fee); // Pre-fill the fee
    }
  }, [existingData]);

  // Save Data
  const handleSubmit = async () => {
    if (!fee || !selectedCustomAgent) {
      MySwal.fire({
        icon: "error",
        title: "Oops...",
        text: "Please fill in all the fields.",
      });
      return;
    }
    if (existingData) {
      if (
        formData.ntn === existingData.ntn &&
        formData.name === existingData.name &&
        formData.address === existingData.address &&
        formData.country === existingData.country
      ) {
        MySwal.fire({
          icon: "error",
          title: "Same data",
          text: "Please make changes to update the data.",
        });
        return;
      } // Check if there are changes in existing data - if not, return
    }
    setLoading(true);
    try {
      const payload = {
        ca: selectedCustomAgent, // Pass the full selected agent
        fee,
      };
      const url = existingData
        ? `/api/customclearance/${existingData.id}`
        : `/api/customclearance`;
      const method = existingData ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const { id } = await response.json();

      if (!existingData) {
        await UpdateConsignment(
          consignmentId,
          { customClearance: { id, ...payload } },
          "Custom Cleared"
        );
      }
      setFormStatuses((prev) => ({
        ...prev,
        customClearance: { id, ...payload },
      }));
      setActiveAccordion(null);
      if (!response.ok) {
        throw new Error("Failed to save data");
      }
      MySwal.fire({
        icon: "success",
        title: "Success",
        showConfirmButton: false,
        timer: 1500,
        text: existingData
          ? "Custom Clearence updated successfully!"
          : "Custom Clearence added successfully!",
      });

      if (!existingData) {
        setFee("");
        setSelectedCustomAgent(null);
      }
    } catch (error) {
      MySwal.fire({
        icon: "error",
        title: "Error",
        text: "An error occurred while saving data.",
      });
    } finally {
      setLoading(false);
    }
  };
  const handleCustomAgentsChange = (e) => {
    const selectedId = e.target.value;
    if (selectedId === "add-new-customagent") {
      router.push("/consignment/customagent/add-customagent");
    } else {
      const ca = customAgentsData.find((c) => c.id === parseInt(selectedId));
      setSelectedCustomAgent(ca);
    }
  };
  return (
    <div className="space-y-4 text-LightPText dark:text-DarkPText w-full md:w-4/5 lg:w-1/2">
      <div className=" shadow-md rounded-md p-6 space-y-4 border-LightBorder dark:border-DarkBorder border-2">
        <h2 className="text-xl font-semibold mb-8">Custom Clearance</h2>

        {/* Custom Agent Dropdown */}
        <div className="relative">
          <motion.div
            className="relative"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <motion.select
              id="customagents"
              value={selectedCustomAgent?.id || ""}
              onChange={handleCustomAgentsChange}
              className="bg-LightPBg text-black dark:text-white mb-7  block w-full border border-LightBorder dark:border-DarkBorder dark:bg-DarkInput rounded-md p-2 focus:ring-PrimaryButton focus:border-PrimaryButton dark:focus:ring-PrimaryButton dark:focus:border-PrimaryButton outline-none relative z-30 mt-7"
              whileFocus={{ scale: 1.02 }}
            >
              {LoadingCustomAgents ? (
                <option value="">Loading...</option>
              ) : (
                <option value="">Select Custom Agent</option>
              )}
              {customAgentsData?.map((ca) => (
                <option key={ca.id} value={ca.id}>
                  {ca.vendor.name}
                </option>
              ))}
              <option
                value="add-new-customagent"
                className="text-green-600 capitalize font-semibold cursor-pointer"
              >
                + Add New Custom Agent
              </option>
            </motion.select>
          </motion.div>
        </div>

        {/* Fee Input */}
        <Input
          id={"fee"}
          type="number"
          value={fee}
          onChange={(e) => setFee(e.target.value)}
          placeholder="Enter fee"
          label={"Fee*"}
        />

        {/* Save Button */}
        <SaveButton
          existingData={existingData}
          handleSubmit={handleSubmit}
          isLoading={loading}
        />
      </div>
    </div>
  );
}
