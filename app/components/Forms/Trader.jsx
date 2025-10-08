"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import SaveButton from "@components/Button/SaveButton";
import Input from "@components/Input";
import LinkButton from "@components/Button/LinkButton";
import {
  FaEye,
  FaUserTie,
  FaMapMarkerAlt,
  FaGlobe,
  FaIdCard,
  FaHandshake,
} from "react-icons/fa";
import { getCookie } from "cookies-next";
import axiosInstance from "@utils/axiosConfig";
import { motion } from "framer-motion";

export default function TraderForm() {
  const token = getCookie("token");
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const router = useRouter();

  const [formData, setFormData] = useState({
    ntn: "",
    name: "",
    address: "",
    country: "",
  });
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      const fetchTrader = async () => {
        setLoading(true);
        try {
          const response = await axiosInstance.get(`/trader/${id}`);
          const { data } = response;
          setFormData(data);
        } catch (error) {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Failed to fetch trader details.",
            background: "rgb(var(--color-background))",
            color: "rgb(var(--color-text))",
            confirmButtonColor: "rgb(var(--color-primary))",
          });
        } finally {
          setLoading(false);
        }
      };
      fetchTrader();
    }
  }, [id]);

  const handleSubmit = async () => {
    const requiredFields = ["ntn", "name", "address", "country"];
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
      const url = id ? `/api/trader/${id}` : `/api/trader`;

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ntn: formData.ntn.trim(),
          name: formData.name.trim(),
          address: formData.address.trim(),
          country: formData.country.trim(),
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
          ? "Trader details have been updated."
          : "New trader has been registered.",
        showConfirmButton: false,
        timer: 2000,
        background: "rgb(var(--color-background))",
        color: "rgb(var(--color-text))",
        iconColor: "rgb(var(--color-primary))",
      });

      if (!id) {
        setFormData({ ntn: "", name: "", address: "", country: "" });
        // Redirect after successful creation
        setTimeout(() => {
          router.push("/consignment/trader/view-trader");
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
            Loading trader details...
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
                <FaUserTie className="text-primary text-sm" />
                <span>Trader Information</span>
              </h3>

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

              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter trader/company name"
                label="Trader Name"
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
                placeholder="Enter complete business address"
                label="Business Address"
                disabled={isSubmitting}
                required
              />

              <Input
                id="country"
                type="text"
                value={formData.country}
                onChange={(e) =>
                  setFormData({ ...formData, country: e.target.value })
                }
                placeholder="Enter country of operation"
                label="Country"
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
          href="/consignment/trader/view-trader"
          title="View All Traders"
          icon={FaEye}
          desc="Browse and manage your existing trading partners"
        />
      </motion.div>

      {/* Form Guidelines */}
      <motion.div
        className="bg-primary/5 rounded-xl p-6 border border-primary/10"
        variants={itemVariants}
      >
        <h3 className="font-semibold font-poppins text-text mb-3 flex items-center space-x-2">
          <FaHandshake className="text-primary" />
          <span>Trader Guidelines</span>
        </h3>
        <ul className="text-sm font-inter text-text/70 space-y-2">
          <li>• All fields are required for proper business registration</li>
          <li>• Ensure NTN number is accurate for tax compliance</li>
          <li>
            • Provide complete business address for official correspondence
          </li>
          <li>• Use the legal business name as registered</li>
          <li>• Keep trader information updated for smooth transactions</li>
        </ul>
      </motion.div>
    </motion.div>
  );
}
