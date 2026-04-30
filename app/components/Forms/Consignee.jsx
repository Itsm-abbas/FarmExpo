// /app/components/Forms/Consignee.jsx
"use client";

import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import SaveButton from "@components/Button/SaveButton";
import Input from "@components/Input";
import { useSearchParams } from "next/navigation";
import LinkButton from "@components/Button/LinkButton";
import {
  FaEye,
  FaUser,
  FaMapMarkerAlt,
  FaGlobe,
  FaDollarSign,
} from "react-icons/fa";
import axiosInstance from "@utils/axiosConfig";
import { getCookie } from "cookies-next";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function ConsigneeForm() {
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
      const fetchConsignee = async () => {
        setLoading(true);
        try {
          const response = await axiosInstance.get(`/consignee/${id}`);
          const { data } = response;
          setFormData(data.vendor);
        } catch (error) {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Failed to fetch consignee details.",
            background: "rgb(var(--color-background))",
            color: "rgb(var(--color-text))",
            confirmButtonColor: "rgb(var(--color-primary))",
          });
        } finally {
          setLoading(false);
        }
      };
      fetchConsignee();
    }
  }, [id]);

  const handleSubmit = async () => {
    const requiredFields = ["name", "address", "country", "ntn", "station"];
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
      const url = id ? `/api/consignee/${id}` : `/api/consignee`;

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          name: formData.name.trim(),
          address: formData.address.trim(),
          country: formData.country.trim(),
          ntn: formData.ntn.trim(),
          station: formData.station.trim(),
          currency: formData.currency.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
      }

      Swal.fire({
        position: "top-center",
        icon: "success",
        title: id ? "Updated successfully!" : "Added successfully!",
        text: id
          ? "Consignee details have been updated."
          : "New consignee has been added.",
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
          router.push("/consignment/consignee/view-consignee");
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
            Loading consignee details...
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
        <div className="p-5 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-text font-poppins flex items-center space-x-2">
                <FaUser className="text-primary text-sm" />
                <span>Basic Information</span>
              </h3>

              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter consignee name"
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
                placeholder="Enter station"
                label="Station"
                disabled={isSubmitting}
                required
              />
            </div>

            {/* Additional Details */}
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
          href="/consignment/consignee/view-consignee"
          title="View All Consignees"
          icon={FaEye}
          desc="Browse and manage your existing consignees"
        />
      </motion.div>

      {/* Form Guidelines */}
      <motion.div
        className="bg-primary/5 rounded-xl p-6 border border-primary/10"
        variants={itemVariants}
      >
        <h3 className="font-semibold font-poppins text-text mb-3 flex items-center space-x-2">
          <FaUser className="text-primary" />
          <span>Consignee Guidelines</span>
        </h3>
        <ul className="text-sm font-inter text-text/70 space-y-2">
          <li>• Fields marked with * are required for proper record keeping</li>
          <li>• Ensure NTN number is accurate for compliance purposes</li>
          <li>• Provide complete address for shipping and communication</li>
          <li>• Set initial balance to reflect current financial status</li>
        </ul>
      </motion.div>
    </motion.div>
  );
}
