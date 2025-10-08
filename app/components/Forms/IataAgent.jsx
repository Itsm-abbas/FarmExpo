"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Swal from "sweetalert2";
import SaveButton from "@components/Button/SaveButton";
import Input from "@components/Input";
import LinkButton from "@components/Button/LinkButton";
import {
  FaEye,
  FaPlane,
  FaMapMarkerAlt,
  FaGlobe,
  FaDollarSign,
  FaIdCard,
  FaBalanceScale,
} from "react-icons/fa";
import axiosInstance from "@utils/axiosConfig";
import { getCookie } from "cookies-next";
import { motion } from "framer-motion";

export default function IataAgent() {
  const token = getCookie("token");
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    ntn: "",
    address: "",
    country: "",
    station: "",
    balance: 0,
    currency: "",
  });
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      const fetchIataAgent = async () => {
        setLoading(true);
        try {
          const response = await axiosInstance.get(`/iata-agent/${id}`);
          const { data } = response;
          if (data) {
            setFormData(data.vendor);
          } else {
            Swal.fire({
              icon: "warning",
              title: "No Data Found",
              text: "No IATA agent found with the provided ID.",
              background: "rgb(var(--color-background))",
              color: "rgb(var(--color-text))",
              confirmButtonColor: "rgb(var(--color-primary))",
            });
          }
        } catch (error) {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Failed to fetch IATA agent details.",
            background: "rgb(var(--color-background))",
            color: "rgb(var(--color-text))",
            confirmButtonColor: "rgb(var(--color-primary))",
          });
        } finally {
          setLoading(false);
        }
      };
      fetchIataAgent();
    }
  }, [id]);

  const handleSubmit = async () => {
    const requiredFields = [
      "name",
      "station",
      "ntn",
      "address",
      "country",
      "currency",
    ];
    const missingFields = requiredFields.filter(
      (field) => !formData[field]?.trim()
    );

    if (missingFields.length > 0) {
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
      const url = id ? `/api/iata-agent/${id}` : `/api/iata-agent`;

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          name: formData.name.trim(),
          ntn: formData.ntn.trim(),
          address: formData.address.trim(),
          country: formData.country.trim(),
          station: formData.station.trim(),
          currency: formData.currency.trim(),
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
          ? "IATA agent details have been updated."
          : "New IATA agent has been registered.",
        showConfirmButton: false,
        timer: 2000,
        background: "rgb(var(--color-background))",
        color: "rgb(var(--color-text))",
        iconColor: "rgb(var(--color-primary))",
      });

      if (!id) {
        setFormData({
          name: "",
          ntn: "",
          address: "",
          country: "",
          station: "",
          balance: 0,
          currency: "",
        });
        // Redirect after successful creation
        setTimeout(() => {
          router.push("/consignment/iata-agent/view-iataAgent");
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
            Loading IATA agent details...
          </span>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-text font-poppins flex items-center space-x-2">
                <FaPlane className="text-primary text-sm" />
                <span>Agent Information</span>
              </h3>

              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter agent name"
                label="Full Name"
                disabled={isSubmitting}
                required
              />

              <Input
                id="ntn"
                type="text"
                value={formData.ntn}
                onChange={(e) =>
                  setFormData({ ...formData, ntn: e.target.value })
                }
                placeholder="Enter NTN number"
                label="NTN Number"
                disabled={isSubmitting}
                required
              />
            </div>

            {/* Location Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-text font-poppins flex items-center space-x-2">
                <FaMapMarkerAlt className="text-primary text-sm" />
                <span>Location Details</span>
              </h3>

              <Input
                id="address"
                type="text"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                placeholder="Enter complete address"
                label="Address"
                disabled={isSubmitting}
                required
              />

              <Input
                id="station"
                type="text"
                value={formData.station}
                onChange={(e) =>
                  setFormData({ ...formData, station: e.target.value })
                }
                placeholder="Enter operating station"
                label="Station"
                disabled={isSubmitting}
                required
              />
            </div>

            {/* Regional Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-text font-poppins flex items-center space-x-2">
                <FaGlobe className="text-primary text-sm" />
                <span>Regional Information</span>
              </h3>

              <Input
                id="country"
                type="text"
                value={formData.country}
                onChange={(e) =>
                  setFormData({ ...formData, country: e.target.value })
                }
                placeholder="Enter country"
                label="Country"
                disabled={isSubmitting}
                required
              />
            </div>

            {/* Financial Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-text font-poppins flex items-center space-x-2">
                <FaDollarSign className="text-primary text-sm" />
                <span>Financial Details</span>
              </h3>

              <Input
                id="balance"
                type="number"
                min="0"
                step="0.01"
                value={formData.balance}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    balance: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="Enter initial balance"
                label="Initial Balance"
                disabled={isSubmitting}
              />

              <Input
                id="currency"
                type="text"
                value={formData.currency}
                onChange={(e) =>
                  setFormData({ ...formData, currency: e.target.value })
                }
                placeholder="e.g., USD, EUR, PKR"
                label="Currency"
                disabled={isSubmitting}
                required
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

      {/* Quick Action Section */}
      <motion.div variants={itemVariants} className="text-center">
        <LinkButton
          href="/consignment/iata-agent/view-iataAgent"
          title="View All IATA Agents"
          icon={FaEye}
          desc="Browse and manage your existing IATA agents"
        />
      </motion.div>

      {/* Form Guidelines */}
      <motion.div
        className="bg-primary/5 rounded-xl p-6 border border-primary/10"
        variants={itemVariants}
      >
        <h3 className="font-semibold font-poppins text-text mb-3 flex items-center space-x-2">
          <FaIdCard className="text-primary" />
          <span>IATA Agent Guidelines</span>
        </h3>
        <ul className="text-sm font-inter text-text/70 space-y-2">
          <li>• Fields marked with * are required for IATA compliance</li>
          <li>• Ensure NTN number is accurate for legal and tax purposes</li>
          <li>• Provide complete address for official IATA correspondence</li>
          <li>• Specify station for operational coordination</li>
          <li>• Set initial balance to reflect current financial standing</li>
        </ul>
      </motion.div>
    </motion.div>
  );
}
