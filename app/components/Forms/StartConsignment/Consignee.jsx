"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import SaveButton from "@components/Button/SaveButton";
import UpdateConsignment from "@utils/updateConsignment";
import { useQuery } from "@tanstack/react-query";
import { fetchConsignees } from "@constants/consignmentAPI";

const MySwal = withReactContent(Swal);

export default function ConsigneeForm({
  consignmentId,
  existingData,
  setFormStatuses,
  setActiveAccordion,
}) {
  const router = useRouter();
  const [selectedConsignee, setSelectedConsginee] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: consignees, isLoading: LoadingConsignees } = useQuery({
    queryKey: ["consignees"],
    queryFn: fetchConsignees,
  });

  // Set existing data when editing
  useEffect(() => {
    if (existingData) {
      setSelectedConsginee(existingData);
    }
  }, [existingData]);

  // Handle consignees selection
  const handleConsigneeChange = (e) => {
    const selectedId = e.target.value;
    if (selectedId === "add-new-consignees") {
      router.push("/consignment/consignee/add-consignee");
    } else {
      const c = consignees.find((t) => t.id === parseInt(selectedId));
      setSelectedConsginee(c);
    }
  };

  // Submit the selected consignees
  const handleSubmit = async () => {
    if (!selectedConsignee) {
      MySwal.fire({
        icon: "warning",
        title: "Oops...",
        text: "Please select a consignee.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (existingData) {
        await UpdateConsignment(consignmentId, {
          consignee: selectedConsignee,
        });
      } else {
        await UpdateConsignment(
          consignmentId,
          { consignee: selectedConsignee },
          "Pending"
        );
      }

      setFormStatuses((prev) => ({
        ...prev,
        consignee: selectedConsignee,
      }));
      setActiveAccordion(null);

      MySwal.fire({
        icon: "success",
        title: "Success",
        text: "Consignee updated successfully!",
        showConfirmButton: false,
        timer: 1500,
      });
    } catch (error) {
      MySwal.fire({
        icon: "error",
        title: "Error",
        text: "An error occurred while updating the consignees.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      className="space-y-4 text-LightPText dark:text-DarkPText w-full md:w-4/5 lg:w-1/2 "
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        className="shadow-md rounded-md p-6 space-y-4 border-LightBorder dark:border-DarkBorder border-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-xl font-semibold mb-8">Select Consignee</h2>

        {/* Consignee Dropdown */}
        <div className="relative">
          {LoadingConsignees ? (
            <p className="text-gray-500">Fetching consignees...</p>
          ) : (
            <div className="relative">
              <motion.select
                id="consignees"
                value={selectedConsignee?.id || ""}
                onChange={handleConsigneeChange}
                className="bg-LightPBg text-black dark:text-white mb-7 mt-1 block w-full border border-LightBorder dark:border-DarkBorder dark:bg-[#2d3748] rounded-md p-2 focus:ring-PrimaryButton focus:border-PrimaryButton dark:focus:ring-PrimaryButton dark:focus:border-PrimaryButton outline-none relative z-50"
              >
                <option value="">Select Consignee</option>
                {consignees?.map((consignee) => (
                  <option key={consignee.id} value={consignee.id}>
                    {consignee.vendor.name}
                  </option>
                ))}
                <option
                  value="add-new-consignees"
                  className="text-green-600 font-semibold cursor-pointer"
                >
                  + Add New Consignee
                </option>
              </motion.select>
            </div>
          )}
        </div>

        {/* Save Button */}
        <SaveButton
          existingData={existingData}
          handleSubmit={handleSubmit}
          isLoading={isSubmitting}
        />
      </motion.div>
    </motion.div>
  );
}
