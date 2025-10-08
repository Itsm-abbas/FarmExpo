"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Swal from "sweetalert2";
import Input from "@components/Input";
import SaveButton from "@components/Button/SaveButton";
import LinkButton from "@components/Button/LinkButton";
import {
  FaEye,
  FaFileInvoiceDollar,
  FaUser,
  FaBuilding,
  FaCalendarAlt,
  FaMoneyCheckAlt,
} from "react-icons/fa";
import { fetchConsignees, fetchTraders } from "@constants/consignmentAPI";
import axiosInstance from "@utils/axiosConfig";

export default function FinancialInstrumentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    number: "",
    traderId: "",
    mode: "",
    consigneeId: "",
    currency: "",
    localDate: "",
    expiryDate: "",
    status: "",
    amount: "",
    balance: "",
    iban: "",
    deliveryTerm: "",
  });

  const { data: traders = [], isLoading: tradersLoading } = useQuery({
    queryKey: ["traders"],
    queryFn: fetchTraders,
  });

  const { data: consignees = [], isLoading: consigneesLoading } = useQuery({
    queryKey: ["consignees"],
    queryFn: fetchConsignees,
  });

  const mutation = useMutation({
    mutationFn: async (payload) => {
      if (id) {
        return await axiosInstance.put(`/financialinstrument/${id}`, payload);
      } else {
        return await axiosInstance.post(`/financialinstrument`, payload);
      }
    },
    onSuccess: () => {
      Swal.fire({
        icon: "success",
        title: id ? "Updated successfully!" : "Added successfully!",
        text: id
          ? "Financial instrument has been updated."
          : "New financial instrument has been created.",
        showConfirmButton: false,
        timer: 2000,
        background: "rgb(var(--color-background))",
        color: "rgb(var(--color-text))",
        iconColor: "rgb(var(--color-primary))",
      });

      if (!id) {
        setFormData({
          number: "",
          traderId: "",
          mode: "",
          consigneeId: "",
          currency: "",
          localDate: "",
          expiryDate: "",
          status: "",
          amount: "",
          balance: "",
          iban: "",
          deliveryTerm: "",
        });
      }

      queryClient.invalidateQueries({ queryKey: ["financialInstruments"] });

      // Redirect after success
      setTimeout(() => {
        router.push("/consignment/view-financial-instrument");
      }, 1000);
    },
    onError: (error) => {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message,
        background: "rgb(var(--color-background))",
        color: "rgb(var(--color-text))",
        confirmButtonColor: "rgb(var(--color-primary))",
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (
      !formData.number ||
      !formData.traderId ||
      !formData.consigneeId ||
      !formData.currency
    ) {
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

    const payload = {
      ...formData,
      traderId: Number(formData.traderId),
      consigneeId: Number(formData.consigneeId),
      amount: parseFloat(formData.amount) || 0,
      balance: parseFloat(formData.balance) || 0,
    };

    mutation.mutate(payload);
  };

  useEffect(() => {
    if (id) {
      const fetchFI = async () => {
        try {
          const response = await axiosInstance.get(
            `/financialinstrument/${id}`
          );
          const { data } = response;
          setFormData({
            ...data,
            traderId: data.traderId?.toString(),
            consigneeId: data.consigneeId?.toString(),
            localDate: data.localDate?.split("T")[0],
            expiryDate: data.expiryDate?.split("T")[0],
          });
        } catch (error) {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Failed to fetch financial instrument details.",
            background: "rgb(var(--color-background))",
            color: "rgb(var(--color-text))",
            confirmButtonColor: "rgb(var(--color-primary))",
          });
        }
      };
      fetchFI();
    }
  }, [id]);

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
    loading,
    label,
    placeholder,
    icon: Icon,
  }) => (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="text-sm font-medium text-text font-poppins flex items-center space-x-2"
      >
        {Icon && <Icon className="text-primary text-sm" />}
        <span>{label}</span>
      </label>
      <select
        id={id}
        value={value}
        onChange={onChange}
        disabled={mutation.isLoading || loading}
        className="w-full px-4 py-3 bg-background border border-primary/20 rounded-xl text-text placeholder-text/50 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 font-inter disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <option value="" className="text-text/50">
          {loading ? "Loading..." : placeholder}
        </option>
        {options.map((option) => (
          <option
            key={option.id}
            value={option.id}
            className="text-text bg-background"
          >
            {option.vendor?.name || option.name}
          </option>
        ))}
      </select>
    </div>
  );

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
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <h3 className="font-semibold text-text font-poppins flex items-center space-x-2">
                  <FaFileInvoiceDollar className="text-primary text-sm" />
                  <span>Instrument Details</span>
                </h3>

                <Input
                  id="number"
                  type="text"
                  placeholder="Instrument number"
                  value={formData.number}
                  onChange={(e) =>
                    setFormData({ ...formData, number: e.target.value })
                  }
                  disabled={mutation.isLoading}
                  label="Instrument Number"
                  required
                />

                <Input
                  id="mode"
                  type="text"
                  placeholder="Payment mode"
                  value={formData.mode}
                  onChange={(e) =>
                    setFormData({ ...formData, mode: e.target.value })
                  }
                  disabled={mutation.isLoading}
                  label="Payment Mode"
                />

                <Input
                  id="currency"
                  type="text"
                  placeholder="e.g., USD, EUR, PKR"
                  value={formData.currency}
                  onChange={(e) =>
                    setFormData({ ...formData, currency: e.target.value })
                  }
                  disabled={mutation.isLoading}
                  label="Currency"
                  required
                />
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <h3 className="font-semibold text-text font-poppins flex items-center space-x-2">
                  <FaUser className="text-primary text-sm" />
                  <span>Parties Involved</span>
                </h3>

                <CustomSelect
                  id="traderId"
                  value={formData.traderId}
                  onChange={(e) =>
                    setFormData({ ...formData, traderId: e.target.value })
                  }
                  options={traders}
                  loading={tradersLoading}
                  label="Trader"
                  placeholder="Select trader"
                  icon={FaUser}
                />

                <CustomSelect
                  id="consigneeId"
                  value={formData.consigneeId}
                  onChange={(e) =>
                    setFormData({ ...formData, consigneeId: e.target.value })
                  }
                  options={consignees}
                  loading={consigneesLoading}
                  label="Consignee"
                  placeholder="Select consignee"
                  icon={FaBuilding}
                />
              </div>
            </div>

            {/* Dates Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div className="space-y-4">
                <h3 className="font-semibold text-text font-poppins flex items-center space-x-2">
                  <FaCalendarAlt className="text-primary text-sm" />
                  <span>Dates</span>
                </h3>

                <Input
                  id="localDate"
                  type="date"
                  value={formData.localDate}
                  onChange={(e) =>
                    setFormData({ ...formData, localDate: e.target.value })
                  }
                  disabled={mutation.isLoading}
                  label="Instrument Date"
                  required
                />

                <Input
                  id="expiryDate"
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) =>
                    setFormData({ ...formData, expiryDate: e.target.value })
                  }
                  disabled={mutation.isLoading}
                  label="Expiry Date"
                />
              </div>

              {/* Financial Details */}
              <div className="space-y-4">
                <h3 className="font-semibold text-text font-poppins flex items-center space-x-2">
                  <FaMoneyCheckAlt className="text-primary text-sm" />
                  <span>Financial Details</span>
                </h3>

                <Input
                  id="amount"
                  type="number"
                  placeholder="Total amount"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  disabled={mutation.isLoading}
                  label="Total Amount"
                  min="0"
                  step="0.01"
                />

                <Input
                  id="balance"
                  type="number"
                  placeholder="Current balance"
                  value={formData.balance}
                  onChange={(e) =>
                    setFormData({ ...formData, balance: e.target.value })
                  }
                  disabled={mutation.isLoading}
                  label="Current Balance"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            {/* Additional Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <Input
                id="status"
                type="text"
                placeholder="Current status"
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                disabled={mutation.isLoading}
                label="Status"
              />

              <Input
                id="iban"
                type="text"
                placeholder="IBAN number"
                value={formData.iban}
                onChange={(e) =>
                  setFormData({ ...formData, iban: e.target.value })
                }
                disabled={mutation.isLoading}
                label="IBAN"
              />
            </div>

            <Input
              id="deliveryTerm"
              type="text"
              placeholder="Delivery terms and conditions"
              value={formData.deliveryTerm}
              onChange={(e) =>
                setFormData({ ...formData, deliveryTerm: e.target.value })
              }
              disabled={mutation.isLoading}
              label="Delivery Terms"
            />

            {/* Save Button */}
            <motion.div
              className="mt-8 pt-6 border-t border-primary/10"
              variants={itemVariants}
            >
              <SaveButton
                handleSubmit={handleSubmit}
                isLoading={mutation.isLoading}
                existingData={!!id}
              />
            </motion.div>
          </form>
        </div>
      </motion.div>

      {/* Quick Action Section */}
      <motion.div variants={itemVariants} className="text-center">
        <LinkButton
          href="/consignment/view-financial-instrument"
          title="View All Financial Instruments"
          icon={FaEye}
          desc="Browse and manage your existing financial instruments"
        />
      </motion.div>
    </motion.div>
  );
}
