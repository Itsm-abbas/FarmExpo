// /app/components/Forms/ConsignmentItem.jsx
"use client";

import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import SaveButton from "@components/Button/SaveButton";
import Input from "@components/Input";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import axiosInstance from "@utils/axiosConfig";
import { getCookie } from "cookies-next/client";
import { motion } from "framer-motion";
import {
  FaBox,
  FaWeight,
  FaDollarSign,
  FaPlus,
  FaExclamationTriangle,
} from "react-icons/fa";

export default function ConsignmentItemForm({ consignmentId }) {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const router = useRouter();
  const token = getCookie("token");

  const [formData, setFormData] = useState({
    item: null,
    packaging: null,
    weightPerUnit: "",
    commodityPerUnitCost: "",
    packagingPerUnitCost: "",
    quantity: "",
    damage: "",
  });

  const [items, setItems] = useState([]);
  const [packaging, setPackaging] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  const handlePackagingChange = (e) => {
    const selectedId = e.target.value;
    if (selectedId === "add-new-packaging") {
      router.push("/consignment/packaging/add-packaging");
    } else {
      const selectedPackaging = packaging.find(
        (pack) => pack.id === parseInt(selectedId)
      );
      setFormData({ ...formData, packaging: selectedPackaging });
    }
  };

  const handleItemChange = (e) => {
    const selectedId = e.target.value;
    if (selectedId === "add-new-item") {
      router.push("/consignment/commodity/add-commodity");
    } else {
      const selectedItem = items.find(
        (item) => item.id === parseInt(selectedId)
      );
      setFormData({ ...formData, item: selectedItem });
    }
  };

  useEffect(() => {
    if (id) {
      const fetchConsignmentItem = async () => {
        setDataLoading(true);
        try {
          const response = await axiosInstance.get(`/consignmentitem/${id}`);
          const { data } = response;
          setFormData(data);
        } catch (error) {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Failed to fetch consignment item details.",
            background: "rgb(var(--color-background))",
            color: "rgb(var(--color-text))",
            confirmButtonColor: "rgb(var(--color-primary))",
          });
        } finally {
          setDataLoading(false);
        }
      };
      fetchConsignmentItem();
    }
  }, [id]);

  // Fetch items and packaging data
  useEffect(() => {
    const fetchData = async () => {
      setDataLoading(true);
      try {
        const [itemsResponse, packagingResponse] = await Promise.all([
          fetch(`${apiUrl}/commodity`, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${apiUrl}/packaging`, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        if (!itemsResponse.ok || !packagingResponse.ok) {
          throw new Error("Failed to fetch data");
        }

        const itemsData = await itemsResponse.json();
        const packagingData = await packagingResponse.json();

        setItems(itemsData);
        setPackaging(packagingData);
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to fetch items or packaging data.",
          background: "rgb(var(--color-background))",
          color: "rgb(var(--color-text))",
          confirmButtonColor: "rgb(var(--color-primary))",
        });
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, [apiUrl, token]);

  const handleSubmit = async () => {
    if (!formData.item || !formData.packaging || !formData.quantity) {
      Swal.fire({
        icon: "warning",
        title: "Missing Information",
        text: "Please select an item, packaging, and enter quantity.",
        background: "rgb(var(--color-background))",
        color: "rgb(var(--color-text))",
        confirmButtonColor: "rgb(var(--color-primary))",
      });
      return;
    }

    const payload = {
      item: formData.item,
      packaging: formData.packaging,
      weightPerUnit: parseFloat(formData.weightPerUnit) || 0,
      commodityPerUnitCost: parseFloat(formData.commodityPerUnitCost) || 0,
      packagingPerUnitCost: parseFloat(formData.packagingPerUnitCost) || 0,
      quantity: parseInt(formData.quantity) || 0,
      damage: parseInt(formData.damage) || 0,
      consignmentId: Number(consignmentId),
    };

    setIsSubmitting(true);

    try {
      const method = id ? "PUT" : "POST";
      const url = id
        ? `${apiUrl}/consignmentitem/${id}`
        : `${apiUrl}/consignmentitem`;

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
      }

      Swal.fire({
        icon: "success",
        title: "Success!",
        text: id
          ? "Consignment item updated successfully."
          : "Consignment item added successfully.",
        background: "rgb(var(--color-background))",
        color: "rgb(var(--color-text))",
        confirmButtonColor: "rgb(var(--color-primary))",
      }).then((result) => {
        if (result.isConfirmed || result.isDismissed) {
          if (!id) {
            setFormData({
              item: null,
              packaging: null,
              weightPerUnit: "",
              commodityPerUnitCost: "",
              packagingPerUnitCost: "",
              quantity: "",
              damage: "",
            });
          }
          router.push("/consignment/view-consignmentitem");
        }
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error.message ||
          "An error occurred while saving the consignment item.",
        background: "rgb(var(--color-background))",
        color: "rgb(var(--color-text))",
        confirmButtonColor: "rgb(var(--color-primary))",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut",
      },
    },
  };

  const CustomSelect = ({
    id,
    value,
    onChange,
    options,
    label,
    placeholder,
    addNewRoute,
  }) => (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-text font-poppins"
      >
        {label}
      </label>
      <select
        id={id}
        value={value || ""}
        onChange={onChange}
        disabled={isSubmitting || dataLoading}
        className="w-full px-4 py-3 bg-background border border-primary/20 rounded-xl text-text placeholder-text/50 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 font-inter disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <option value="" className="text-text/50">
          {placeholder}
        </option>
        {options.map((option) => (
          <option
            key={option.id}
            value={option.id}
            className="text-text bg-background"
          >
            {option.name} {option.number ? `(${option.number})` : ""}
          </option>
        ))}
        <option
          value={`add-new-${id}`}
          className="text-primary font-semibold bg-primary/10 cursor-pointer"
        >
          <FaPlus className="inline mr-2" />
          Add New {label}
        </option>
      </select>
    </div>
  );

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <motion.div
          className="flex items-center space-x-3 text-primary"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="font-inter text-text">Loading form data...</span>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-6 w-full max-w-4xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Form Section */}
      <motion.div
        className="bg-background rounded-2xl border border-primary/20 shadow-lg overflow-hidden"
        variants={itemVariants}
      >
        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Selection */}
            <div className="space-y-6">
              <h3 className="font-semibold text-text font-poppins flex items-center space-x-2">
                <FaBox className="text-primary text-sm" />
                <span>Item Selection</span>
              </h3>

              <CustomSelect
                id="item"
                value={formData.item?.id || ""}
                onChange={handleItemChange}
                options={items}
                label="Commodity Item *"
                placeholder="Select a commodity item"
                addNewRoute="/consignment/commodity/add-commodity"
              />

              <CustomSelect
                id="packaging"
                value={formData.packaging?.id || ""}
                onChange={handlePackagingChange}
                options={packaging}
                label="Packaging Type *"
                placeholder="Select packaging type"
                addNewRoute="/consignment/packaging/add-packaging"
              />

              <Input
                id="quantity"
                type="number"
                label="Quantity *"
                placeholder="Enter quantity"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: e.target.value })
                }
                disabled={isSubmitting}
                min="1"
                required
              />
            </div>

            {/* Right Column - Details */}
            <div className="space-y-6">
              <h3 className="font-semibold text-text font-poppins flex items-center space-x-2">
                <FaWeight className="text-primary text-sm" />
                <span>Item Details</span>
              </h3>

              <Input
                id="weightPerUnit"
                type="number"
                label="Weight Per Unit (kg)"
                placeholder="Enter weight per unit"
                value={formData.weightPerUnit}
                onChange={(e) =>
                  setFormData({ ...formData, weightPerUnit: e.target.value })
                }
                disabled={isSubmitting}
                min="0"
                step="0.01"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  id="commodityPerUnitCost"
                  type="number"
                  label="Commodity Cost"
                  placeholder="Unit cost"
                  value={formData.commodityPerUnitCost}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      commodityPerUnitCost: e.target.value,
                    })
                  }
                  disabled={isSubmitting}
                  min="0"
                  step="0.01"
                />

                <Input
                  id="packagingPerUnitCost"
                  type="number"
                  label="Packaging Cost"
                  placeholder="Unit cost"
                  value={formData.packagingPerUnitCost}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      packagingPerUnitCost: e.target.value,
                    })
                  }
                  disabled={isSubmitting}
                  min="0"
                  step="0.01"
                />
              </div>

              <Input
                id="damage"
                type="number"
                label="Damaged Items"
                placeholder="Enter damaged quantity"
                value={formData.damage}
                onChange={(e) =>
                  setFormData({ ...formData, damage: e.target.value })
                }
                disabled={isSubmitting}
                min="0"
              />
            </div>
          </div>

          {/* Save Button */}
          <motion.div
            className="mt-8 pt-6 border-t border-primary/10"
            variants={itemVariants}
          >
            <SaveButton
              handleSubmit={handleSubmit}
              isLoading={isSubmitting}
              existingData={!!id}
            />
          </motion.div>
        </div>
      </motion.div>

      {/* Summary Card */}
      {formData.item && formData.packaging && formData.quantity && (
        <motion.div
          className="bg-accent/5 rounded-xl p-6 border border-accent/20"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <h3 className="font-semibold font-poppins text-text mb-3 flex items-center space-x-2">
            <FaDollarSign className="text-accent" />
            <span>Item Summary</span>
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm font-inter">
            <div>
              <p className="text-text/70">Total Weight</p>
              <p className="font-semibold text-text">
                {(formData.weightPerUnit * formData.quantity || 0).toFixed(2)}{" "}
                kg
              </p>
            </div>
            <div>
              <p className="text-text/70">Total Cost</p>
              <p className="font-semibold text-text">
                $
                {(
                  (formData.commodityPerUnitCost +
                    formData.packagingPerUnitCost) *
                    formData.quantity || 0
                ).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-text/70">Good Items</p>
              <p className="font-semibold text-text">
                {formData.quantity - (formData.damage || 0)}
              </p>
            </div>
            <div>
              <p className="text-text/70">Damage Rate</p>
              <p className="font-semibold text-text">
                {((formData.damage / formData.quantity) * 100 || 0).toFixed(1)}%
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
