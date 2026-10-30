"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { FaPercent, FaPlus, FaTrash } from "react-icons/fa";
import SaveButton from "@components/Button/SaveButton";
import Input from "@components/Input";
import useSession from "@hooks/useSession";
import axiosInstance from "@utils/axiosConfig";
import { formatMoney } from "@utils/money";

const MySwal = withReactContent(Swal);
const swalTheme = {
  background: "rgb(var(--color-background))",
  color: "rgb(var(--color-text))",
  confirmButtonColor: "rgb(var(--color-primary))",
};

const emptyRow = () => ({ remark: "", amount: "" });

// Taxes on a consignment, each with a remark. They are added to the total
// cost and listed on the invoice.
export default function TaxesForm({ consignmentId, formStatus, setFormStatuses, isLocked = false }) {
  const { currency } = useSession();
  const saved = Array.isArray(formStatus?.taxes) ? formStatus.taxes : [];
  const [rows, setRows] = useState(() =>
    saved.length ? saved.map((t) => ({ remark: t.remark, amount: String(t.amount) })) : [emptyRow()]
  );

  const save = useMutation({
    mutationFn: async (taxes) =>
      (await axiosInstance.put(`/consignment/${consignmentId}`, { taxes })).data,
    onSuccess: (consignment) => {
      setFormStatuses(() => consignment);
      MySwal.fire({
        ...swalTheme,
        icon: "success",
        title: "Saved",
        text: consignment.taxes?.length
          ? "Taxes saved and added to the total cost."
          : "Taxes removed from this consignment.",
        showConfirmButton: false,
        timer: 1800,
        iconColor: "rgb(var(--color-primary))",
      });
    },
    onError: (error) =>
      MySwal.fire({ ...swalTheme, icon: "error", title: "Couldn't save", text: error.message }),
  });

  const handleSubmit = () => {
    if (isLocked) {
      return MySwal.fire({
        ...swalTheme,
        icon: "warning",
        title: "Form locked",
        text: "This consignment is fulfilled. Please contact an administrator to make changes.",
      });
    }
    // Fully blank rows are ignored, so saving with none removes them all.
    const filled = rows.filter((r) => r.remark.trim() || r.amount !== "");
    if (filled.some((r) => !r.remark.trim() || r.amount === "" || !(Number(r.amount) >= 0))) {
      return MySwal.fire({
        ...swalTheme,
        icon: "warning",
        title: "Check the taxes",
        text: "Each tax needs a remark and an amount of 0 or more.",
      });
    }
    save.mutate(filled.map((r) => ({ remark: r.remark.trim(), amount: Number(r.amount) })));
  };

  const update = (index, field, value) =>
    setRows((current) => current.map((r, i) => (i === index ? { ...r, [field]: value } : r)));

  const total = rows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-4xl mx-auto"
    >
      <div className="bg-background rounded-2xl border border-primary/20 shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-6 border-b border-primary/20">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <FaPercent className="text-primary text-xl" />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-poppins text-text">Taxes</h2>
              <p className="text-text/70 font-inter mt-1">
                Add each tax with a remark. They are added to the total cost and shown on the invoice.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <AnimatePresence initial={false}>
            {rows.map((row, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="grid grid-cols-1 gap-3 rounded-xl border border-primary/20 p-4 sm:grid-cols-[1fr_12rem_auto] sm:items-center"
              >
                <Input
                  id={`tax-remark-${index}`}
                  type="text"
                  value={row.remark}
                  onChange={(e) => update(index, "remark", e.target.value)}
                  label="Remark"
                  placeholder="e.g. Sales tax, withholding tax"
                  maxLength={200}
                  disabled={isLocked}
                />
                <Input
                  id={`tax-amount-${index}`}
                  type="number"
                  min="0"
                  step="0.01"
                  value={row.amount}
                  onChange={(e) => update(index, "amount", e.target.value)}
                  label={`Amount (${currency})`}
                  placeholder="0.00"
                  disabled={isLocked}
                />
                {!isLocked && (
                  <button
                    type="button"
                    onClick={() =>
                      setRows((current) =>
                        current.length > 1 ? current.filter((_, i) => i !== index) : [emptyRow()]
                      )
                    }
                    className="justify-self-end p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                    aria-label={`Remove tax ${index + 1}`}
                    title="Remove"
                  >
                    <FaTrash size={14} />
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {!isLocked && (
            <button
              type="button"
              onClick={() => setRows((current) => [...current, emptyRow()])}
              className="w-full py-3 rounded-xl border border-dashed border-primary/40 text-primary font-poppins font-medium flex items-center justify-center gap-2 hover:bg-primary/5"
            >
              <FaPlus /> Add another tax
            </button>
          )}

          <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 text-sm font-inter">
            <p className="text-text/70">Total taxes, added to the cost</p>
            <p className="mt-1 text-xl font-bold text-text font-poppins">
              {formatMoney(total, currency, { decimals: 2 })}
            </p>
          </div>

          <div className="pt-4 border-t border-primary/10">
            <SaveButton handleSubmit={handleSubmit} isLoading={save.isPending} disabled={isLocked} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
