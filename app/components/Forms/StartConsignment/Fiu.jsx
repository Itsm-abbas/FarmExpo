"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { FaChartLine, FaFileInvoice, FaPlus, FaTrash } from "react-icons/fa";
import SaveButton from "@components/Button/SaveButton";
import Input from "@components/Input";
import axiosInstance from "@utils/axiosConfig";
import { formatMoney } from "@utils/money";
import { listQueries, queryKeys } from "@hooks/queries";

const MySwal = withReactContent(Swal);
const swalTheme = {
  background: "rgb(var(--color-background))",
  color: "rgb(var(--color-text))",
  confirmButtonColor: "rgb(var(--color-primary))",
};

const emptyRow = () => ({ financialInstrumentId: "", utilized: "" });

// The financial instruments (LC, contract…) a consignment uses, and how much
// of each. A consignment can use several. Their currency becomes the goods
// declaration's currency.
export default function FinancialInstrumentsForm({
  consignmentId,
  formStatus,
  setFormStatuses,
  isLocked = false,
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const saved = formStatus?.utilizations || [];

  const [rows, setRows] = useState(() =>
    saved.length
      ? saved.map((u) => ({
          financialInstrumentId: String(u.financialInstrumentId),
          utilized: String(u.utilized),
        }))
      : [emptyRow()]
  );

  const { data: instruments = [], isLoading } = useQuery(listQueries.financialInstruments);

  // What this consignment already uses is given back when it saves, so it
  // counts as available.
  const usedHere = (fiId) =>
    saved
      .filter((u) => u.financialInstrumentId === fiId)
      .reduce((sum, u) => sum + u.utilized, 0);
  const available = (fi) => (fi ? fi.balance + usedHere(fi.id) : 0);

  // Instruments for this consignment's trader or consignee are listed first.
  const traderId = formStatus?.trader?.id;
  const consigneeId = formStatus?.consignee?.id;
  const matches = (fi) =>
    (traderId && fi.traderId === traderId) || (consigneeId && fi.consigneeId === consigneeId);
  const options = [...instruments].sort((a, b) => Number(matches(b)) - Number(matches(a)));

  const instrumentOf = (row) =>
    instruments.find((fi) => fi.id === Number(row.financialInstrumentId));

  const save = useMutation({
    mutationFn: async (list) =>
      (
        await axiosInstance.put(`/consignment/${consignmentId}/financial-instruments`, {
          instruments: list,
        })
      ).data,
    onSuccess: (consignment) => {
      setFormStatuses(() => consignment);
      queryClient.invalidateQueries({ queryKey: queryKeys.financialInstruments });
      queryClient.invalidateQueries({ queryKey: queryKeys.utilization });
      MySwal.fire({
        ...swalTheme,
        icon: "success",
        title: "Saved",
        text: consignment.utilizations.length
          ? "Financial instruments saved. Their balances are updated."
          : "Financial instruments removed from this consignment.",
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
    // A blank last row is ignored, so "Save" with no rows removes them all.
    const filled = rows.filter((r) => r.financialInstrumentId || r.utilized);
    const invalid = filled.find(
      (r) => !r.financialInstrumentId || !(Number(r.utilized) > 0)
    );
    if (invalid) {
      return MySwal.fire({
        ...swalTheme,
        icon: "warning",
        title: "Check the amounts",
        text: "Choose an instrument and enter an amount more than 0 on every row.",
      });
    }
    const over = filled.find((r) => Number(r.utilized) > available(instrumentOf(r)) + 0.000001);
    if (over) {
      const fi = instrumentOf(over);
      return MySwal.fire({
        ...swalTheme,
        icon: "warning",
        title: "Not enough balance",
        text: `${fi.number} has ${formatMoney(available(fi), fi.currency, { decimals: 2 })} available.`,
      });
    }
    save.mutate(
      filled.map((r) => ({
        financialInstrumentId: Number(r.financialInstrumentId),
        utilized: Number(r.utilized),
      }))
    );
  };

  const update = (index, field, value) => {
    if (field === "financialInstrumentId" && value === "add-new") {
      router.push("/consignment/add-financialinstrument");
      return;
    }
    setRows((current) => current.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  };

  const chosenIds = rows.map((r) => Number(r.financialInstrumentId));
  // Totals per currency: instruments may be in different currencies.
  const totals = rows.reduce((acc, r) => {
    const fi = instrumentOf(r);
    if (fi && Number(r.utilized) > 0) {
      acc[fi.currency || ""] = (acc[fi.currency || ""] || 0) + Number(r.utilized);
    }
    return acc;
  }, {});
  const currencies = Object.keys(totals);

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
              <FaChartLine className="text-primary text-xl" />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-poppins text-text">
                Financial Instruments
              </h2>
              <p className="text-text/70 font-inter mt-1">
                Add one or more instruments and the amount of each this consignment uses.
                The goods declaration uses their currency.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {currencies.length > 1 && (
            <p role="status" className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-text">
              These instruments are in different currencies ({currencies.join(", ")}). The goods
              declaration can only use one of them.
            </p>
          )}

          <AnimatePresence initial={false}>
            {rows.map((row, index) => {
              const fi = instrumentOf(row);
              const tooMuch = fi && Number(row.utilized) > available(fi) + 0.000001;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="rounded-xl border border-primary/20 p-4 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-text font-poppins flex items-center gap-2">
                      <FaFileInvoice className="text-primary text-sm" />
                      Instrument {index + 1}
                    </h4>
                    {!isLocked && (rows.length > 1 || row.financialInstrumentId) && (
                      <button
                        type="button"
                        onClick={() =>
                          setRows((current) =>
                            current.length > 1 ? current.filter((_, i) => i !== index) : [emptyRow()]
                          )
                        }
                        className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                        aria-label={`Remove instrument ${index + 1}`}
                        title="Remove"
                      >
                        <FaTrash size={14} />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor={`fi-${index}`} className="block text-sm font-medium text-text font-poppins">
                        Financial instrument *
                      </label>
                      <select
                        id={`fi-${index}`}
                        value={row.financialInstrumentId}
                        onChange={(e) => update(index, "financialInstrumentId", e.target.value)}
                        disabled={isLocked || isLoading}
                        className="w-full px-4 py-3 bg-background border border-primary/20 rounded-xl text-text focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 font-inter disabled:opacity-50"
                      >
                        <option value="">{isLoading ? "Loading instruments…" : "Choose an instrument"}</option>
                        {options.map((option) => (
                          <option
                            key={option.id}
                            value={option.id}
                            disabled={chosenIds.includes(option.id) && option.id !== Number(row.financialInstrumentId)}
                          >
                            {option.number}
                            {option.bankName ? ` · ${option.bankName}` : ""} · {formatMoney(available(option), option.currency)} available
                          </option>
                        ))}
                        <option value="add-new">+ Add a new financial instrument</option>
                      </select>
                      {fi && (
                        <p className="text-xs text-text/60 font-inter">
                          {[fi.mode, fi.trader?.name && `Trader: ${fi.trader.name}`, fi.consignee?.vendor?.name && `Consignee: ${fi.consignee.vendor.name}`]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Input
                        id={`utilized-${index}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.utilized}
                        onChange={(e) => update(index, "utilized", e.target.value)}
                        label={`Amount used${fi?.currency ? ` (${fi.currency})` : ""} *`}
                        placeholder="Enter the amount used"
                        disabled={isLocked}
                      />
                      {fi && (
                        <p className={`text-xs font-inter ${tooMuch ? "text-red-600" : "text-text/60"}`}>
                          {tooMuch ? "More than the " : ""}
                          {formatMoney(available(fi), fi.currency, { decimals: 2 })} available
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {!isLocked && (
            <button
              type="button"
              onClick={() => setRows((current) => [...current, emptyRow()])}
              disabled={rows.some((r) => !r.financialInstrumentId)}
              className="w-full py-3 rounded-xl border border-dashed border-primary/40 text-primary font-poppins font-medium flex items-center justify-center gap-2 hover:bg-primary/5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaPlus /> Add another instrument
            </button>
          )}

          {currencies.length > 0 && (
            <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 text-sm font-inter">
              <p className="text-text/70">Total used</p>
              <p className="mt-1 text-xl font-bold text-text font-poppins">
                {currencies.map((c) => formatMoney(totals[c], c, { decimals: 2 })).join(" + ")}
              </p>
            </div>
          )}

          <div className="pt-4 border-t border-primary/10">
            <SaveButton handleSubmit={handleSubmit} isLoading={save.isPending} disabled={isLocked} />
          </div>

          {isLocked && (
            <p className="text-center text-text/60 text-sm font-inter">
              This form is locked because the consignment is fulfilled
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
