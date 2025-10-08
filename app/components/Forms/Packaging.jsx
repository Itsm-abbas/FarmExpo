"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Swal from "sweetalert2";
import SaveButton from "@components/Button/SaveButton";
import Input from "@components/Input";
import LinkButton from "@components/Button/LinkButton";
import { FaEye, FaBox, FaWeight, FaRuler, FaInfoCircle } from "react-icons/fa";
import axiosInstance from "@utils/axiosConfig";
import { getCookie } from "cookies-next";
import { motion } from "framer-motion";

export default function Packaging() {
  const token = getCookie("token");
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    packagingWeightPerUnit: "",
  });
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      const fetchPackaging = async () => {
        setLoading(true);
        try {
          const response = await axiosInstance.get(`/api/packaging/${id}`);
          const { data } = response;
          setFormData({
            name: data?.name || "",
            packagingWeightPerUnit: data?.packagingWeightPerUnit || "",
          });
        } catch (error) {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Failed to fetch packaging details.",
            background: "rgb(var(--color-background))",
            color: "rgb(var(--color-text))",
            confirmButtonColor: "rgb(var(--color-primary))",
          });
        } finally {
          setLoading(false);
        }
      };
      fetchPackaging();
    }
  }, [id]);

  const handleSubmit = async () => {
    if (!formData.name?.trim() || !formData.packagingWeightPerUnit) {
      Swal.fire({
        icon: "warning",
        title: "Missing Information",
        text: "Please fill in all required fields.",
        background: "rgb(var(--color-background))",
        color: "rgb(var(--color-text))",
        confirmButtonColor: "rgb(var(--color-primary))",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const method = id ? "PUT" : "POST";
      const url = id ? `/api/packaging/${id}` : `/api/packaging`;

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          packagingWeightPerUnit: formData.packagingWeightPerUnit || 0,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save data");
      }

      Swal.fire({
        position: "top-center",
        icon: "success",
        title: id ? "Updated successfully!" : "Added successfully!",
        text: id
          ? "Packaging details have been updated."
          : "New packaging type has been added.",
        showConfirmButton: false,
        timer: 2000,
        background: "rgb(var(--color-background))",
        color: "rgb(var(--color-text))",
        iconColor: "rgb(var(--color-primary))",
      });

      if (!id) {
        setFormData({
          name: "",
          packagingWeightPerUnit: "",
        });
        // Redirect after successful creation
        setTimeout(() => {
          router.push("/consignment/packaging/view-packaging");
        }, 1000);
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "An error occurred while saving data.",
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

  if (loading && id) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <motion.div
          className="flex items-center space-x-3 text-primary"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="font-inter text-text">
            Loading packaging details...
          </span>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-6 w-full max-w-2xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Form Section */}
      <motion.div
        className="bg-background rounded-2xl border border-primary/20 shadow-lg overflow-hidden"
        variants={itemVariants}
      >
        <div className="p-8 space-y-6">
          {/* Packaging Name */}
          <div className="space-y-2">
            <label
              htmlFor="name"
              className="text-sm font-medium text-text font-poppins flex items-center space-x-2"
            >
              <FaBox className="text-primary text-sm" />
              <span>Packaging Name *</span>
            </label>
            <Input
              id="name"
              type="text"
              placeholder="e.g., Wooden Crate, Cardboard Box, Plastic Container"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              disabled={isSubmitting}
              required
            />
          </div>

          {/* Weight Per Unit */}
          <div className="space-y-2">
            <label
              htmlFor="packagingWeightPerUnit"
              className="text-sm font-medium text-text font-poppins flex items-center space-x-2"
            >
              <FaWeight className="text-primary text-sm" />
              <span>Weight Per Unit (kg) *</span>
            </label>
            <Input
              id="packagingWeightPerUnit"
              type="number"
              placeholder="Enter weight in kilograms"
              value={formData.packagingWeightPerUnit}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  packagingWeightPerUnit: e.target.value,
                })
              }
              disabled={isSubmitting}
              min="0"
              step="0.01"
              required
            />
            <p className="text-xs text-text/60 font-inter">
              Enter the weight of a single unit of this packaging type
            </p>
          </div>

          {/* Save Button */}
          <motion.div className="pt-4" variants={itemVariants}>
            <SaveButton
              handleSubmit={handleSubmit}
              isLoading={isSubmitting}
              existingData={!!id}
            />
          </motion.div>
        </div>
      </motion.div>

      {/* Quick Action Section */}
      <motion.div variants={itemVariants} className="text-center">
        <LinkButton
          href="/consignment/packaging/view-packaging"
          title="View All Packaging Types"
          icon={FaEye}
          desc="Browse and manage your existing packaging types"
        />
      </motion.div>

      {/* Form Guidelines */}
      <motion.div
        className="bg-primary/5 rounded-xl p-6 border border-primary/10"
        variants={itemVariants}
      >
        <h3 className="font-semibold font-poppins text-text mb-3 flex items-center space-x-2">
          <FaInfoCircle className="text-primary" />
          <span>Packaging Guidelines</span>
        </h3>
        <ul className="text-sm font-inter text-text/70 space-y-2">
          <li>
            • Use descriptive names for easy identification (e.g., "Large Wooden
            Crate")
          </li>
          <li>• Weight should be in kilograms for accurate calculations</li>
          <li>
            • Include the weight of empty packaging for shipping calculations
          </li>
          <li>• Update weights if packaging specifications change</li>
          <li>• Consistent naming helps in inventory management</li>
        </ul>
      </motion.div>

      {/* Weight Calculation Example */}
      <motion.div
        className="bg-accent/5 rounded-xl p-6 border border-accent/20"
        variants={itemVariants}
      >
        <h3 className="font-semibold font-poppins text-text mb-3 flex items-center space-x-2">
          <FaRuler className="text-accent" />
          <span>Weight Calculation Example</span>
        </h3>
        <div className="text-sm font-inter text-text/70 space-y-2">
          <p>If you have 10 units using this packaging:</p>
          <div className="bg-background/50 rounded-lg p-3 mt-2">
            <p className="font-medium text-text">
              Total Packaging Weight:{" "}
              {formData.packagingWeightPerUnit
                ? (parseFloat(formData.packagingWeightPerUnit) * 10).toFixed(2)
                : "0.00"}{" "}
              kg
            </p>
            <p className="text-xs text-text/60 mt-1">
              (Unit Weight × Quantity)
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
