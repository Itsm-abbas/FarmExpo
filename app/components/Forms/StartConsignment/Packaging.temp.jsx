"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { fetchPackaging } from "@constants/consignmentAPI";
import { getCookie } from "cookies-next";
const MySwal = withReactContent(Swal);

export default function PackagingForm({ consignmentId, setFormStatuses }) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = getCookie("token");
  const router = useRouter();
  const [loadingStates, setLoadingStates] = useState({});
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState({});
  const { data: packagingOptions, isLoading: LoadingPackaging } = useQuery({
    queryKey: ["packaging"],
    queryFn: fetchPackaging,
  });

  // Fetch consignment data to get goods
  useEffect(() => {
    const fetchConsignmentData = async () => {
      try {
        const response = await fetch(`${apiUrl}/consignment/${consignmentId}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) throw new Error("Failed to fetch consignment data.");
        const data = await response.json();
        setItems(data.goods || []);
        setFormData(
          data.goods.reduce(
            (acc, item) => ({
              ...acc,
              [item.id]: item.packaging?.id || "",
            }),
            {}
          )
        );
      } catch (error) {
        Swal.fire({ icon: "error", title: "Error", text: error.message });
      }
    };

    fetchConsignmentData();
  }, [consignmentId]);

  // Handle save/update
  const handleSubmit = async (itemId) => {
    if (!formData[itemId]) {
      MySwal.fire({
        icon: "error",
        title: "Oops...",
        text: "Please select a packaging option.",
      });
      return;
    }

    setLoadingStates((prev) => ({ ...prev, [itemId]: true }));

    try {
      const targetItem = items.find((item) => item.id === itemId);
      if (!targetItem) throw new Error("Item not found.");

      const updatedItem = {
        ...targetItem,
        packaging: { id: parseInt(formData[itemId]) },
      };

      const response = await fetch(`${apiUrl}/consignmentitem/${itemId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedItem),
      });

      if (!response.ok) {
        throw new Error("Already using in another consignment");
      }

      const updatedItems = items?.map((item) =>
        item.id === itemId ? updatedItem : item
      );

      setItems(updatedItems);
      setFormStatuses((prev) => ({ ...prev, goods: updatedItems }));

      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Packaging updated successfully!",
      });
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: error.message });
    } finally {
      setLoadingStates((prev) => ({ ...prev, [itemId]: false }));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4 text-LightPText dark:text-DarkPText w-full md:w-4/5 lg:w-1/2"
    >
      {items?.map((item) => (
        <motion.div
          key={item.id}
          className="shadow-md rounded-md p-6 space-y-4 border-LightBorder dark:border-DarkBorder border-2"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <h2 className="text-xl font-semibold mb-8 capitalize">
            {item.item.name}
          </h2>

          {/* <select
            id={`packaging-${item.id}`}
            value={formData[item.id] || ""}
            onChange={(e) => {
              const selectedValue = e.target.value;
              if (selectedValue === "add-new-packaging") {
                router.push("/consignment/packaging/add-packaging");
              } else {
                setFormData({ ...formData, [item.id]: selectedValue });
              }
            }}
            className="bg-LightPBg text-black dark:text-white mb-7 mt-1 block w-full border border-LightBorder dark:border-DarkBorder dark:bg-[#2d3748] rounded-md p-2 focus:ring-PrimaryButton focus:border-PrimaryButton dark:focus:ring-PrimaryButton dark:focus:border-PrimaryButton outline-none"
          >
            <option value="">Select Packaging</option>
            {packagingOptions.map((pkg) => (
              <option key={pkg.id} value={pkg.id}>
                {pkg.name}
              </option>
            ))}
            <option
              value="add-new-packaging"
              className="text-green-600 capitalize font-semibold cursor-pointer"
            >
              + Add New Packaging
            </option>
          </select> */}
          <div className="relative">
            <motion.div
              className="relative"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <motion.select
                id={`packaging-${item.id}`}
                value={formData[item.id] || ""}
                onChange={(e) => {
                  const selectedValue = e.target.value;
                  if (selectedValue === "add-new-packaging") {
                    router.push("/consignment/packaging/add-packaging");
                  } else {
                    setFormData({ ...formData, [item.id]: selectedValue });
                  }
                }}
                className="bg-LightPBg text-black dark:text-white mb-7  block w-full border border-LightBorder dark:border-DarkBorder dark:bg-DarkInput rounded-md p-2 focus:ring-PrimaryButton focus:border-PrimaryButton dark:focus:ring-PrimaryButton dark:focus:border-PrimaryButton outline-none relative z-30 mt-7"
                whileFocus={{ scale: 1.02 }}
              >
                {LoadingPackaging ? (
                  <option value="">Loading...</option>
                ) : (
                  <option value="">Select Packaging</option>
                )}
                {packagingOptions?.map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.name}
                  </option>
                ))}
                <option
                  value="add-new-packaging"
                  className="text-green-600 capitalize font-semibold cursor-pointer"
                >
                  + Add New Packaging
                </option>
              </motion.select>
            </motion.div>
          </div>
          <button
            onClick={() => handleSubmit(item.id)}
            className={`uppercase w-full px-4 py-2 rounded-md text-white transition-all duration-200 ${
              loadingStates[item.id]
                ? "bg-[#A7F3D0] cursor-not-allowed"
                : "bg-PrimaryButton hover:bg-PrimaryButtonHover"
            } ${
              formData[item.id] &&
              "bg-SecondaryButton hover:bg-SecondaryButtonHover"
            }`}
            disabled={loadingStates[item.id]}
          >
            {loadingStates[item.id]
              ? "Saving..."
              : formData[item.id]
              ? "Update"
              : "Save"}
          </button>
        </motion.div>
      ))}
    </motion.div>
  );
}
