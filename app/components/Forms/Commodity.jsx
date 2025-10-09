//components/Forms/Commodity.jsx
"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import SaveButton from "@components/Button/SaveButton";
import Input from "@components/Input";
import LinkButton from "@components/Button/LinkButton";
import { FaEye, FaBox, FaEdit } from "react-icons/fa";
import { useRouter } from "next/navigation";
import axiosInstance from "@utils/axiosConfig";
import { getCookie } from "cookies-next";
import { motion } from "framer-motion";

export default function CommodityForm() {
  const token = getCookie("token");
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [formData, setFormData] = useState({ name: "", number: "" });
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (id) {
      const fetchCommodity = async () => {
        setLoading(true);
        try {
          const response = await axiosInstance.get(`/commodity/${id}`);
          const { data } = response;
          setFormData(data);
        } catch (error) {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Failed to fetch commodity details.",
            background: "rgb(var(--color-background))",
            color: "rgb(var(--color-text))",
            confirmButtonColor: "rgb(var(--color-primary))",
          });
        } finally {
          setLoading(false);
        }
      };
      fetchCommodity();
    }
  }, [id]);

  const handleSubmit = async () => {
    if (!formData.name?.trim() || !formData.number?.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Missing Information",
        text: "Please fill in all the fields.",
        background: "rgb(var(--color-background))",
        color: "rgb(var(--color-text))",
        confirmButtonColor: "rgb(var(--color-primary))",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const method = id ? "PUT" : "POST";
      const url = id ? `/api/commodity/${id}` : `/api/commodity`;

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          number: formData.number.trim(),
          name: formData.name.trim(),
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
          ? "Commodity has been updated."
          : "New commodity has been added.",
        showConfirmButton: false,
        timer: 2000,
        background: "rgb(var(--color-background))",
        color: "rgb(var(--color-text))",
        iconColor: "rgb(var(--color-primary))",
      });

      if (!id) {
        setFormData({ number: "", name: "" });
        // Redirect to view page after successful creation
        setTimeout(() => {
          router.push("/consignment/commodity/view-commodity");
        }, 1000);
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "Something went wrong. Please try again.",
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
        duration: 0.3,
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
          <span className="font-inter text-text">Loading commodity...</span>
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
        <div className="p-5 md:p-8 space-y-6">
          <div className="space-y-6">
            <Input
              id="number"
              type="text"
              label="Commodity Number"
              placeholder="Enter commodity number"
              value={formData.number}
              onChange={(e) =>
                setFormData({ ...formData, number: e.target.value })
              }
              disabled={isSubmitting}
              required
            />

            <Input
              id="name"
              type="text"
              label="Commodity Name"
              placeholder="Enter commodity name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              disabled={isSubmitting}
              required
            />
          </div>

          <motion.div variants={itemVariants} className="pt-4">
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
          href="/consignment/commodity/view-commodity"
          title="View All Commodities"
          icon={FaEye}
          desc="Browse and manage your existing commodities"
        />
      </motion.div>

      {/* Form Guidelines */}
      <motion.div
        className="bg-primary/5 rounded-xl p-6 border border-primary/10"
        variants={itemVariants}
      >
        <h3 className="font-semibold font-poppins text-text mb-3 flex items-center space-x-2">
          <FaBox className="text-primary" />
          <span>Commodity Guidelines</span>
        </h3>
        <ul className="text-sm font-inter text-text/70 space-y-2">
          <li>• Ensure the commodity number is unique and identifiable</li>
          <li>• Use descriptive names for easy identification</li>
          <li>• Both fields are required for proper inventory tracking</li>
        </ul>
      </motion.div>
    </motion.div>
  );
}
