"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Swal from "sweetalert2";
import Input from "@components/Input";
import SaveButton from "@components/Button/SaveButton";
import LinkButton from "@components/Button/LinkButton";
import { FaEye } from "react-icons/fa";
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
        title: id ? "Updated successfully." : "Added successfully.",
        showConfirmButton: false,
        timer: 1500,
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
    },
    onError: (error) => {
      Swal.fire({ icon: "error", title: "Error", text: error.message });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = {
      ...formData,
      traderId: Number(formData.traderId),
      consigneeId: Number(formData.consigneeId),
      amount: parseFloat(formData.amount),
      balance: parseFloat(formData.balance),
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
            traderId: data.traderId,
            consigneeId: data.consigneeId,
          });
        } catch (error) {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Failed to fetch financial instrument.",
          });
        }
      };
      fetchFI();
    }
  }, [id]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-4 w-full md:w-4/5 lg:w-1/2"
    >
      <div className="shadow-md rounded-md p-6 space-y-4 border-2">
        <h2 className="text-2xl font-bold mb-6 text-center">
          Add Financial Instrument
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="number"
            placeholder="Number"
            value={formData.number}
            onChange={(e) =>
              setFormData({ ...formData, number: e.target.value })
            }
          />

          <select
            className="w-full p-2 border rounded-md"
            value={formData.traderId}
            onChange={(e) =>
              setFormData({ ...formData, traderId: e.target.value })
            }
          >
            <option value="">
              {tradersLoading ? "Loading..." : "Select Trader"}
            </option>
            {traders.map((trader) => (
              <option key={trader.id} value={trader.id}>
                {trader.name}
              </option>
            ))}
          </select>

          <Input
            id="mode"
            placeholder="Mode"
            value={formData.mode}
            onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
          />

          <select
            className="w-full p-2 border rounded-md"
            value={formData.consigneeId}
            onChange={(e) =>
              setFormData({ ...formData, consigneeId: e.target.value })
            }
          >
            <option value="">
              {consigneesLoading ? "Loading..." : "Select Consignee"}
            </option>
            {consignees.map((consignee) => (
              <option key={consignee.id} value={consignee.id}>
                {consignee.vendor.name}
              </option>
            ))}
          </select>

          <Input
            id="currency"
            placeholder="Currency"
            value={formData.currency}
            onChange={(e) =>
              setFormData({ ...formData, currency: e.target.value })
            }
          />
          <div className="space-y-2">
            <label
              htmlFor="localDate"
              className="block text-sm font-medium text-gray-700"
            >
              Instrument Date (Local)
            </label>
            <Input
              id="localDate"
              type="date"
              value={formData.localDate}
              onChange={(e) =>
                setFormData({ ...formData, localDate: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="expiryDate"
              className="block text-sm font-medium text-gray-700"
            >
              Expiry Date
            </label>
            <Input
              id="expiryDate"
              type="date"
              value={formData.expiryDate}
              onChange={(e) =>
                setFormData({ ...formData, expiryDate: e.target.value })
              }
            />
          </div>
          <Input
            id="status"
            placeholder="Status"
            value={formData.status}
            onChange={(e) =>
              setFormData({ ...formData, status: e.target.value })
            }
          />
          <Input
            id="amount"
            type="number"
            placeholder="Amount"
            value={formData.amount}
            onChange={(e) =>
              setFormData({ ...formData, amount: e.target.value })
            }
          />
          <Input
            id="balance"
            type="number"
            placeholder="Balance"
            value={formData.balance}
            onChange={(e) =>
              setFormData({ ...formData, balance: e.target.value })
            }
          />
          <Input
            id="iban"
            placeholder="IBAN"
            value={formData.iban}
            onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
          />
          <Input
            id="deliveryTerm"
            placeholder="Delivery Term"
            value={formData.deliveryTerm}
            onChange={(e) =>
              setFormData({ ...formData, deliveryTerm: e.target.value })
            }
          />

          <SaveButton
            handleSubmit={handleSubmit}
            isLoading={mutation.isLoading}
          />
        </form>
      </div>

      <LinkButton
        href="/consignment/view-financial-instrument"
        title="See your financial instruments"
        icon={FaEye}
        desc="Click to view your existing financial instruments"
      />
    </motion.div>
  );
}
