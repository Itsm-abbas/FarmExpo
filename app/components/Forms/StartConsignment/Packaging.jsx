"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { fetchPackaging } from "@constants/consignmentAPI";
import { getCookie } from "cookies-next";
import { FaBox, FaSave, FaPlus, FaCheckCircle } from "react-icons/fa";

const MySwal = withReactContent(Swal);

export default function PackagingForm({
  consignmentId,
  existingData,
  setFormStatuses,
  setActiveAccordion,
  isLocked = false,
}) {
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
        Swal.fire({
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
  }, [consignmentId]);

  // Handle save/update
  const handleSubmit = async (itemId) => {
    if (!formData[itemId]) {
      MySwal.fire({
        icon: "warning",
        title: "Missing Selection",
        text: "Please select a packaging option.",
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

      MySwal.fire({
        icon: "success",
        title: "Success!",
        text: "Packaging updated successfully!",
        showConfirmButton: false,
        timer: 1500,
        background: "rgb(var(--color-background))",
        color: "rgb(var(--color-text))",
        iconColor: "rgb(var(--color-primary))",
      });
    } catch (error) {
      MySwal.fire({
        icon: "error",
        title: "Error",
        text: error.message,
        background: "rgb(var(--color-background))",
        color: "rgb(var(--color-text))",
        confirmButtonColor: "rgb(var(--color-primary))",
      });
    } finally {
      setLoadingStates((prev) => ({ ...prev, [itemId]: false }));
    }
  };

  const CustomSelect = ({ item, value, onChange, loading }) => (
    <div className="space-y-2">
      <label
        htmlFor={`packaging-${item.id}`}
        className="text-sm font-medium text-text font-poppins flex items-center space-x-2"
      >
        <FaBox className="text-primary text-sm" />
        <span>
          Packaging for {item.commodityItem?.name || "Item"}{" "}
          {isLocked && <span className="text-red-500 text-xs">(Locked)</span>}
        </span>
      </label>
      <select
        id={`packaging-${item.id}`}
        value={value || ""}
        onChange={onChange}
        disabled={isLocked || loading}
        className="w-full px-4 py-3 bg-background border border-primary/20 rounded-xl text-text placeholder-text/50 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 font-inter disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <option value="" className="text-text/50">
          {loading ? "Loading packaging options..." : "Select packaging"}
        </option>
        {packagingOptions?.map((pkg) => (
          <option
            key={pkg.id}
            value={pkg.id}
            className="text-text bg-background"
          >
            {pkg.name}{" "}
            {pkg.packagingWeightPerUnit && `(${pkg.packagingWeightPerUnit} kg)`}
          </option>
        ))}
        <option
          value="add-new-packaging"
          className="text-primary font-semibold bg-primary/10 cursor-pointer"
        >
          + Add New Packaging
        </option>
      </select>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-4xl mx-auto"
    >
      <div className="bg-background rounded-2xl border border-primary/20 shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-6 border-b border-primary/20">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <FaBox className="text-primary text-xl" />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-poppins text-text">
                Item Packaging
              </h2>
              <p className="text-text/70 font-inter mt-1">
                Assign packaging materials to each item in the consignment
              </p>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6">
          {items.length === 0 ? (
            <div className="text-center py-8">
              <FaBox className="text-4xl text-text/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-text font-poppins mb-2">
                No Items Found
              </h3>
              <p className="text-text/60 font-inter">
                Please add items to the consignment first.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {items?.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-primary/5 rounded-xl p-6 border border-primary/20"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-text font-poppins capitalize">
                        {item.commodityItem?.name}
                      </h3>
                      <p className="text-text/60 text-sm font-inter">
                        Quantity: {item.quantity} • Weight: {item.weightPerUnit}{" "}
                        kg/unit
                      </p>
                    </div>
                    {formData[item.id] && (
                      <div className="flex items-center gap-2 text-green-500">
                        <FaCheckCircle className="text-sm" />
                        <span className="text-sm font-medium">Packaged</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <CustomSelect
                      item={item}
                      value={formData[item.id]}
                      onChange={(e) => {
                        const selectedValue = e.target.value;
                        if (selectedValue === "add-new-packaging") {
                          router.push("/consignment/packaging/add-packaging");
                        } else {
                          setFormData({
                            ...formData,
                            [item.id]: selectedValue,
                          });
                        }
                      }}
                      loading={LoadingPackaging}
                    />

                    <motion.button
                      onClick={() => handleSubmit(item.id)}
                      disabled={
                        loadingStates[item.id] || isLocked || !formData[item.id]
                      }
                      className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                        loadingStates[item.id]
                          ? "bg-text/30 text-text/60 cursor-not-allowed"
                          : formData[item.id]
                          ? "bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl"
                          : "bg-primary text-white hover:bg-accent shadow-lg hover:shadow-xl"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                      whileHover={
                        !loadingStates[item.id] &&
                        !isLocked &&
                        formData[item.id]
                          ? { scale: 1.02 }
                          : {}
                      }
                      whileTap={
                        !loadingStates[item.id] &&
                        !isLocked &&
                        formData[item.id]
                          ? { scale: 0.98 }
                          : {}
                      }
                    >
                      {loadingStates[item.id] ? (
                        <>
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          Saving...
                        </>
                      ) : formData[item.id] ? (
                        <>
                          <FaSave className="text-sm" />
                          Update Packaging
                        </>
                      ) : (
                        <>
                          <FaSave className="text-sm" />
                          Save Packaging
                        </>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {isLocked && (
            <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
              <p className="text-center text-text/80 text-sm font-inter">
                This form is locked because the consignment is fulfilled
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
