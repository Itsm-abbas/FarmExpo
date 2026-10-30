"use client";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import Swal from "sweetalert2";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import {
  FaArrowLeft,
  FaEdit,
  FaTrash,
  FaPlus,
  FaExchangeAlt,
  FaReceipt,
  FaMoneyBillWave,
  FaBalanceScale,
  FaCalendar,
  FaIdCard,
  FaFileInvoice,
  FaFilePdf,
  FaFileExcel,
} from "react-icons/fa";

import DataLoader from "@components/Loader/dataLoader";
import Loading from "app/loading";
import useSession from "@hooks/useSession";

const errorText = async (res, fallback) => {
  const body = await res.json().catch(() => ({}));
  return typeof body.error === "string" ? body.error : fallback;
};

const NO_FILTERS = { text: "", type: "", kind: "", from: "", to: "", min: "", max: "" };

// The calendar day an entry was recorded, on this device ("YYYY-MM-DD").
const entryDay = (t) => new Date(t.createdAt).toLocaleDateString("en-CA");

function matchesFilters(t, f) {
  if (f.text) {
    const words = f.text.toLowerCase().split(/s+/).filter(Boolean);
    const haystack = [
      t.details,
      t.transactionId,
      t.voucherId,
      t.consignment?.number,
      t.consignmentId && `consignment ${t.consignmentId}`,
      t.purchaseId && `purchase #${t.purchaseId} purchase ${t.purchaseId}`,
      String(t.amount),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    if (!words.every((w) => haystack.includes(w))) return false;
  }
  if (f.type && t.type !== f.type) return false;
  if (f.kind === "manual" && t.source) return false;
  if (f.kind === "consignment" && !(t.source && t.source !== "purchase")) return false;
  if (f.kind === "purchase" && t.source !== "purchase") return false;
  if (f.from && entryDay(t) < f.from) return false;
  if (f.to && entryDay(t) > f.to) return false;
  if (f.min !== "" && t.amount < Number(f.min)) return false;
  if (f.max !== "" && t.amount > Number(f.max)) return false;
  return true;
}

const filterInput =
  "w-full rounded-lg border border-primary/20 bg-background px-3 py-2 text-sm text-text placeholder:text-text/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

export default function VendorTransactionPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  // Staff can add entries; correcting or removing them is admin-only.
  const { permissions, organization } = useSession();

  // ✅ Fetch vendor + transactions (with balanceAfter from DB)
  const { data, isLoading } = useQuery({
    queryKey: ["vendorTransactions", id],
    queryFn: async () => {
      const res = await fetch(`/api/vendor/transactions/${id}`);
      if (!res.ok) throw new Error("Failed to fetch transactions");
      return res.json();
    },
  });

  // --- Form States ---
  const [form, setForm] = useState({
    type: "credit",
    transactionId: "",
    amount: "",
    details: "",
    voucherId: "",
  });
  // --- Search: every filter narrows the entries shown ---
  const [filters, setFilters] = useState(NO_FILTERS);
  const filtering = Object.entries(filters).some(([key, value]) => value !== NO_FILTERS[key]);
  const visible = useMemo(
    () => (data?.transactions || []).filter((t) => matchesFilters(t, filters)),
    [data, filters]
  );
  const visibleCredits = visible.filter((t) => t.type === "credit").reduce((s, t) => s + t.amount, 0);
  const visibleDebits = visible.filter((t) => t.type === "debit").reduce((s, t) => s + t.amount, 0);
  const setFilter = (e) => setFilters((f) => ({ ...f, [e.target.name]: e.target.value }));

  const [editForm, setEditForm] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // --- Exports: a statement of account, as PDF (in the organization's
  // template and letterhead) or as an Excel workbook ---
  const [exporting, setExporting] = useState(null);
  const exportStatement = async (kind) => {
    if (!data?.vendor) return;
    setExporting(kind);
    try {
      const pdf = await import("@utils/pdf");
      const name = pdf.fileSlug(
        `statement-${data.vendor.name}-${new Date().toISOString().slice(0, 10)}`
      );
      if (kind === "excel") {
        const { exportStatementExcel } = await import("@utils/excel");
        exportStatementExcel({
          vendor: data.vendor,
          transactions: data.transactions,
          organization,
          filename: `${name}.xlsx`,
        });
      } else {
        const branding = await pdf.loadBranding(organization);
        const bytes = await pdf.buildStatementPdf({
          vendor: data.vendor,
          transactions: data.transactions,
          organization,
          branding,
        });
        pdf.downloadFile(bytes, `${name}.pdf`);
      }
    } catch (error) {
      console.error("Statement export failed:", error);
      Swal.fire({
        position: "top-center",
        icon: "error",
        title: "Export failed",
        text: error.message || "Couldn't create the file. Try again.",
        confirmButtonColor: "rgb(var(--color-primary))",
        background: "rgb(var(--color-background))",
        color: "rgb(var(--color-text))",
      });
    } finally {
      setExporting(null);
    }
  };
  const exportToExcel = () => exportStatement("excel");
  const exportToPdf = () => exportStatement("pdf");

  // --- Mutations ---
  const addMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await fetch("/api/vendor/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok)
        throw new Error(await errorText(res, "Failed to add transaction"));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendorTransactions", id] });
      queryClient.invalidateQueries({ queryKey: ["vendors-list"], refetchType: "none" });
      Swal.fire({
        position: "top-center",
        icon: "success",
        title: "Transaction Added!",
        showConfirmButton: false,
        timer: 2000,
        background: "rgb(var(--color-background))",
        color: "rgb(var(--color-text))",
      });
      setForm({
        type: "credit",
        transactionId: "",
        amount: "",
        details: "",
        voucherId: "",
      });
      setShowAddForm(false);
    },
    onError: (error) =>
      Swal.fire({
        position: "top-center",
        icon: "error",
        title: "Add Failed",
        text: error.message,
        confirmButtonColor: "rgb(var(--color-primary))",
        background: "rgb(var(--color-background))",
        color: "rgb(var(--color-text))",
      }),
  });

  const editMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await fetch("/api/vendor/transactions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok)
        throw new Error(await errorText(res, "Failed to update transaction"));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendorTransactions", id] });
      queryClient.invalidateQueries({ queryKey: ["vendors-list"], refetchType: "none" });
      setShowEdit(false);
      setEditForm(null);
      Swal.fire({
        position: "top-center",
        icon: "success",
        title: "Transaction Updated!",
        showConfirmButton: false,
        timer: 1500,
        background: "rgb(var(--color-background))",
        color: "rgb(var(--color-text))",
      });
    },
    onError: (error) =>
      Swal.fire({
        position: "top-center",
        icon: "error",
        title: "Update Failed",
        text: error.message,
        confirmButtonColor: "rgb(var(--color-primary))",
        background: "rgb(var(--color-background))",
        color: "rgb(var(--color-text))",
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (tid) => {
      const res = await fetch("/api/vendor/transactions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: tid }),
      });
      if (!res.ok)
        throw new Error(await errorText(res, "Failed to delete transaction"));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendorTransactions", id] });
      queryClient.invalidateQueries({ queryKey: ["vendors-list"], refetchType: "none" });
      Swal.fire({
        position: "top-center",
        icon: "success",
        title: "Transaction Deleted!",
        showConfirmButton: false,
        timer: 1500,
        background: "rgb(var(--color-background))",
        color: "rgb(var(--color-text))",
      });
    },
    onError: (error) =>
      Swal.fire({
        position: "top-center",
        icon: "error",
        title: "Delete Failed",
        text: error.message,
        confirmButtonColor: "rgb(var(--color-primary))",
        background: "rgb(var(--color-background))",
        color: "rgb(var(--color-text))",
      }),
  });

  // --- Handlers ---
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.amount || !form.details || !form.transactionId) {
      return Swal.fire({
        position: "top-center",
        icon: "warning",
        title: "Missing Fields",
        text: "Please fill out transaction ID, amount, and details before adding.",
        confirmButtonColor: "rgb(var(--color-primary))",
        background: "rgb(var(--color-background))",
        color: "rgb(var(--color-text))",
      });
    }
    addMutation.mutate({ ...form, vendorId: Number(id) });
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editForm.amount || !editForm.details || !editForm.transactionId) {
      return Swal.fire({
        position: "top-center",
        icon: "warning",
        title: "Missing Fields",
        text: "Please fill out transaction ID, amount, and details before saving.",
        confirmButtonColor: "rgb(var(--color-primary))",
        background: "rgb(var(--color-background))",
        color: "rgb(var(--color-text))",
      });
    }
    editMutation.mutate({ ...editForm });
  };

  const handleDelete = (tid) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This will permanently delete the transaction.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "rgb(var(--color-primary))",
      confirmButtonText: "Yes, delete it!",
      background: "rgb(var(--color-background))",
      color: "rgb(var(--color-text))",
    }).then((result) => {
      if (result.isConfirmed) deleteMutation.mutate(tid);
    });
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-background font-inter py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <Link
                href="/vendors/transactions"
                className="flex items-center gap-2 text-primary hover:text-accent transition-colors"
              >
                <FaArrowLeft className="text-sm" />
                Back to Vendors
              </Link>
            </div>

            <div className="flex flex-col w-full sm:w-auto sm:flex-row  gap-3">
              {/* Export Buttons */}
              {data?.transactions?.length > 0 && (
                <>
                  <button
                    onClick={exportToExcel}
                    disabled={Boolean(exporting)}
                    className="flex items-center gap-2 border border-text/15 bg-surface text-text hover:bg-text/5 px-4 py-2 rounded-xl transition-colors font-medium disabled:opacity-60"
                  >
                    <FaFileExcel className="text-sm" />
                    {exporting === "excel" ? "Preparing…" : "Excel statement"}
                  </button>
                  <button
                    onClick={exportToPdf}
                    disabled={Boolean(exporting)}
                    className="flex items-center gap-2 border border-text/15 bg-surface text-text hover:bg-text/5 px-4 py-2 rounded-xl transition-colors font-medium disabled:opacity-60"
                  >
                    <FaFilePdf className="text-sm" />
                    {exporting === "pdf" ? "Preparing…" : "PDF statement"}
                  </button>
                </>
              )}

              <motion.button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 bg-primary text-white hover:bg-accent px-4 py-2 rounded-xl transition-all duration-200 font-medium"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <FaPlus className="text-sm" />
                Add Transaction
              </motion.button>
            </div>
          </div>

          <div className="bg-background border-2 border-primary/20 rounded-2xl p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-poppins font-bold text-text mb-2">
                  {data.vendor.name} - Transaction Ledger
                </h1>
                <p className="text-text/60">
                  Complete transaction history and balance tracking
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="bg-primary/10 rounded-xl p-4 text-center">
                  <div className="flex items-center gap-2 mb-1">
                    <FaBalanceScale className="text-primary" />
                    <span className="text-text/60 text-sm">
                      Current Balance
                    </span>
                  </div>
                  <div
                    className={`text-xl font-bold ${
                      Number(data.vendor.balance) >= 0
                        ? "text-green-500"
                        : "text-red-500"
                    }`}
                  >
                    {data.vendor.currency}{" "}
                    {Number(data.vendor.balance).toLocaleString()}
                    {/* {Number(data.vendor.balance) < 0 && " CR"} */}
                  </div>
                </div>

                <div className="bg-primary/10 rounded-xl p-4 text-center">
                  <div className="flex items-center gap-2 mb-1">
                    <FaExchangeAlt className="text-primary" />
                    <span className="text-text/60 text-sm">
                      Total Transactions
                    </span>
                  </div>
                  <div className="text-xl font-bold text-text">
                    {data.transactions?.length || 0}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Add Transaction Modal */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-background border-2 border-primary/20 rounded-2xl shadow-2xl w-full max-w-2xl"
              >
                <div className="flex items-center justify-between p-6 border-b border-primary/10">
                  <h2 className="text-xl font-poppins font-semibold text-text">
                    Add New Transaction
                  </h2>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="w-8 h-8 flex items-center justify-center bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-white transition-all duration-200"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="flex items-center gap-2 text-text text-sm font-medium mb-2">
                        <FaExchangeAlt className="text-primary/60" />
                        Transaction Type
                      </label>
                      <select
                        value={form.type}
                        onChange={(e) =>
                          setForm({ ...form, type: e.target.value })
                        }
                        className="w-full p-3 border-2 border-primary/20 rounded-xl bg-background text-text focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 outline-none"
                      >
                        <option value="credit">Credit (+)</option>
                        <option value="debit">Debit (-)</option>
                      </select>
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-text text-sm font-medium mb-2">
                        <FaIdCard className="text-primary/60" />
                        Transaction ID
                      </label>
                      <input
                        type="text"
                        value={form.transactionId}
                        onChange={(e) =>
                          setForm({ ...form, transactionId: e.target.value })
                        }
                        placeholder="Enter transaction ID"
                        className="w-full p-3 border-2 border-primary/20 rounded-xl bg-background text-text placeholder:text-text/40 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 outline-none"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-text text-sm font-medium mb-2">
                        <FaMoneyBillWave className="text-primary/60" />
                        Amount
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={form.amount}
                        onChange={(e) =>
                          setForm({ ...form, amount: e.target.value })
                        }
                        placeholder="Enter amount"
                        className="w-full p-3 border-2 border-primary/20 rounded-xl bg-background text-text placeholder:text-text/40 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 outline-none"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-text text-sm font-medium mb-2">
                        <FaFileInvoice className="text-primary/60" />
                        Voucher ID
                      </label>
                      <input
                        type="text"
                        value={form.voucherId}
                        onChange={(e) =>
                          setForm({ ...form, voucherId: e.target.value })
                        }
                        placeholder="Enter voucher ID"
                        className="w-full p-3 border-2 border-primary/20 rounded-xl bg-background text-text placeholder:text-text/40 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 outline-none"
                      />
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="flex items-center gap-2 text-text text-sm font-medium mb-2">
                      <FaReceipt className="text-primary/60" />
                      Details
                    </label>
                    <input
                      type="text"
                      value={form.details}
                      onChange={(e) =>
                        setForm({ ...form, details: e.target.value })
                      }
                      placeholder="Enter transaction details"
                      className="w-full p-3 border-2 border-primary/20 rounded-xl bg-background text-text placeholder:text-text/40 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 outline-none"
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-6 py-3 bg-text/10 text-text hover:bg-text/20 rounded-xl transition-all duration-200 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={addMutation.isPending}
                      className="flex items-center gap-2 bg-primary text-white hover:bg-accent disabled:bg-text/30 px-6 py-3 rounded-xl transition-all duration-200 font-medium"
                    >
                      {addMutation.isPending ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <FaPlus className="text-sm" />
                          Add Transaction
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {isLoading ? (
          <DataLoader />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-background border-2 border-primary/20 rounded-2xl shadow-xl overflow-hidden"
          >
            {!data?.transactions?.length ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-text/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FaExchangeAlt className="text-3xl text-text/40" />
                </div>
                <h3 className="text-xl font-poppins font-semibold text-text mb-2">
                  No Transactions Found
                </h3>
                <p className="text-text/60 mb-6">
                  Start by adding the first transaction for this vendor.
                </p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="bg-primary text-white px-6 py-3 rounded-xl hover:bg-accent transition-all duration-200 font-medium"
                >
                  Add First Transaction
                </button>
              </div>
            ) : (
              <>
              <div className="border-b border-primary/10 p-4 sm:p-5 space-y-3" role="search" aria-label="Search this ledger">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <label className="sm:col-span-2 text-xs font-medium text-text/70">
                    Search
                    <input
                      name="text"
                      type="search"
                      value={filters.text}
                      onChange={setFilter}
                      placeholder="Details, transaction or voucher ID, consignment, purchase, amount"
                      className={`${filterInput} mt-1`}
                    />
                  </label>
                  <label className="text-xs font-medium text-text/70">
                    Type
                    <select name="type" value={filters.type} onChange={setFilter} className={`${filterInput} mt-1`}>
                      <option value="">Credits and debits</option>
                      <option value="credit">Credits only</option>
                      <option value="debit">Debits only</option>
                    </select>
                  </label>
                  <label className="text-xs font-medium text-text/70">
                    Entry
                    <select name="kind" value={filters.kind} onChange={setFilter} className={`${filterInput} mt-1`}>
                      <option value="">All entries</option>
                      <option value="manual">Added by hand</option>
                      <option value="consignment">From consignments</option>
                      <option value="purchase">From purchases</option>
                    </select>
                  </label>
                  <label className="text-xs font-medium text-text/70">
                    From
                    <input name="from" type="date" value={filters.from} onChange={setFilter} className={`${filterInput} mt-1`} />
                  </label>
                  <label className="text-xs font-medium text-text/70">
                    To
                    <input name="to" type="date" value={filters.to} onChange={setFilter} className={`${filterInput} mt-1`} />
                  </label>
                  <label className="text-xs font-medium text-text/70">
                    Amount from
                    <input name="min" type="number" min="0" step="any" value={filters.min} onChange={setFilter} placeholder="0" className={`${filterInput} mt-1`} />
                  </label>
                  <label className="text-xs font-medium text-text/70">
                    Amount to
                    <input name="max" type="number" min="0" step="any" value={filters.max} onChange={setFilter} placeholder="Any" className={`${filterInput} mt-1`} />
                  </label>
                </div>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm" role="status" aria-live="polite">
                  <span className="text-text/70">
                    {filtering
                      ? `${visible.length} of ${data.transactions.length} entries match`
                      : `${data.transactions.length} entries`}
                  </span>
                  <span className="text-text/70">
                    Credits <strong className="text-text">{data.vendor.currency} {visibleCredits.toLocaleString("en-US", { maximumFractionDigits: 2 })}</strong>
                  </span>
                  <span className="text-text/70">
                    Debits <strong className="text-text">{data.vendor.currency} {visibleDebits.toLocaleString("en-US", { maximumFractionDigits: 2 })}</strong>
                  </span>
                  {filtering && (
                    <button type="button" onClick={() => setFilters(NO_FILTERS)} className="font-medium text-primary hover:underline">
                      Clear search
                    </button>
                  )}
                </div>
              </div>
              {visible.length === 0 ? (
                <p className="px-6 py-12 text-center text-text/60">
                  No entries match this search. Change or clear the filters to see more.
                </p>
              ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-primary/5 border-b border-primary/10">
                      <th className="p-4 text-left text-text font-semibold text-sm">
                        <div className="flex items-center gap-2">
                          <FaCalendar />
                          Date
                        </div>
                      </th>
                      <th className="p-4 text-left text-text font-semibold text-sm">
                        <div className="flex items-center gap-2">
                          <FaIdCard />
                          Transaction ID
                        </div>
                      </th>
                      <th className="p-4 text-left text-text font-semibold text-sm">
                        <div className="flex items-center gap-2">
                          <FaFileInvoice />
                          Voucher ID
                        </div>
                      </th>
                      <th className="p-4 text-left text-text font-semibold text-sm">
                        <div className="flex items-center gap-2">
                          <FaReceipt />
                          Details
                        </div>
                      </th>
                      <th className="p-4 text-left text-text font-semibold text-sm">
                        Linked to
                      </th>
                      <th className="p-4 text-right text-text font-semibold text-sm">
                        Credit ({data.vendor.currency})
                      </th>
                      <th className="p-4 text-right text-text font-semibold text-sm">
                        Debit ({data.vendor.currency})
                      </th>
                      <th className="p-4 text-right text-text font-semibold text-sm">
                        <div className="flex items-center gap-2 justify-end">
                          <FaBalanceScale />
                          Balance
                        </div>
                      </th>
                      <th className="p-4 text-center text-text font-semibold text-sm">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Plain rows: search results update at once, and long
                        ledgers don't wait on a staggered animation. */}
                    {visible.map((transaction) => (
                        <tr
                          key={transaction.id}
                          className="border-b border-primary/5 hover:bg-primary/5 transition-colors"
                        >
                          <td className="p-4 text-text">
                            {new Date(transaction.createdAt).toLocaleDateString(
                              "en-GB",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </td>
                          <td className="p-4 text-text font-medium">
                            {transaction.transactionId || "-"}
                          </td>
                          <td className="p-4 text-text">
                            {transaction.voucherId || "-"}
                          </td>
                          <td className="p-4 text-text max-w-xs">
                            {transaction.details}
                          </td>
                          <td className="p-4">
                            {transaction.consignmentId ? (
                              <Link
                                href={`/startconsignment/${transaction.consignmentId}`}
                                className="text-primary hover:text-accent underline font-medium"
                              >
                                Consignment {transaction.consignment?.number || `#${transaction.consignmentId}`}
                              </Link>
                            ) : transaction.purchaseId ? (
                              <Link
                                href={`/purchases?edit=${transaction.purchaseId}`}
                                className="text-primary hover:text-accent underline font-medium"
                              >
                                Purchase #{transaction.purchaseId}
                              </Link>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="p-4 text-right">
                            {transaction.type === "credit" && (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-green-700 bg-green-500/20 text-sm font-semibold">
                                +{Number(transaction.amount).toLocaleString()}
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            {transaction.type === "debit" && (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-red-700 bg-red-500/20 text-sm font-semibold">
                                -{Number(transaction.amount).toLocaleString()}
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <AnimatePresence mode="wait">
                              <motion.div
                                key={transaction.balanceAfter}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.2 }}
                                transition={{ duration: 0.3 }}
                                className={`font-semibold ${
                                  Number(transaction.balanceAfter) >= 0
                                    ? "text-green-500"
                                    : "text-red-500"
                                }`}
                              >
                                {Number(
                                  transaction.balanceAfter
                                ).toLocaleString()}
                              </motion.div>
                            </AnimatePresence>
                          </td>
                          <td className="p-4">
                            {transaction.source ? (
                              // Posted from a consignment or purchase: change it there.
                              <div
                                className="text-center text-xs text-text/60"
                                title={
                                  transaction.source === "purchase"
                                    ? "Posted from the purchase. Edit the purchase to change it."
                                    : "Posted from the consignment. Edit the consignment to change it."
                                }
                              >
                                Auto
                              </div>
                            ) : !permissions.editLedger ? (
                              <div
                                className="text-center text-xs text-text/60"
                                title="Only an admin can correct or remove ledger entries."
                              >
                                —
                              </div>
                            ) : (
                            <div className="flex items-center justify-center gap-2">
                              <motion.button
                                onClick={() => {
                                  setEditForm(transaction);
                                  setShowEdit(true);
                                }}
                                className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-white transition-all duration-200"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                title="Edit transaction"
                              >
                                <FaEdit className="text-sm" />
                              </motion.button>
                              <motion.button
                                onClick={() => handleDelete(transaction.id)}
                                className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all duration-200"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                title="Delete transaction"
                              >
                                <FaTrash className="text-sm" />
                              </motion.button>
                            </div>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              )}
              </>
            )}
          </motion.div>
        )}

        {/* Edit Modal */}
        <AnimatePresence>
          {showEdit && editForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-background border-2 border-primary/20 rounded-2xl shadow-2xl w-full max-w-md"
              >
                <div className="flex items-center justify-between p-6 border-b border-primary/10">
                  <h2 className="text-xl font-poppins font-semibold text-text">
                    Edit Transaction
                  </h2>
                  <button
                    onClick={() => setShowEdit(false)}
                    className="w-8 h-8 flex items-center justify-center bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-white transition-all duration-200"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleEditSubmit} className="p-6">
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="flex items-center gap-2 text-text text-sm font-medium mb-2">
                        Transaction Type
                      </label>
                      <select
                        value={editForm.type}
                        onChange={(e) =>
                          setEditForm({ ...editForm, type: e.target.value })
                        }
                        className="w-full p-3 border-2 border-primary/20 rounded-xl bg-background text-text focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 outline-none"
                      >
                        <option value="credit">Credit</option>
                        <option value="debit">Debit</option>
                      </select>
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-text text-sm font-medium mb-2">
                        Transaction ID
                      </label>
                      <input
                        type="text"
                        value={editForm.transactionId || ""}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            transactionId: e.target.value,
                          })
                        }
                        placeholder="Transaction ID"
                        className="w-full p-3 border-2 border-primary/20 rounded-xl bg-background text-text placeholder:text-text/40 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 outline-none"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-text text-sm font-medium mb-2">
                        Amount
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editForm.amount}
                        onChange={(e) =>
                          setEditForm({ ...editForm, amount: e.target.value })
                        }
                        className="w-full p-3 border-2 border-primary/20 rounded-xl bg-background text-text focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 outline-none"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-text text-sm font-medium mb-2">
                        Details
                      </label>
                      <input
                        type="text"
                        value={editForm.details || ""}
                        onChange={(e) =>
                          setEditForm({ ...editForm, details: e.target.value })
                        }
                        placeholder="Details"
                        className="w-full p-3 border-2 border-primary/20 rounded-xl bg-background text-text placeholder:text-text/40 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 outline-none"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-text text-sm font-medium mb-2">
                        Voucher ID
                      </label>
                      <input
                        type="text"
                        value={editForm.voucherId || ""}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            voucherId: e.target.value,
                          })
                        }
                        placeholder="Voucher ID"
                        className="w-full p-3 border-2 border-primary/20 rounded-xl bg-background text-text placeholder:text-text/40 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowEdit(false)}
                      className="px-6 py-3 bg-text/10 text-text hover:bg-text/20 rounded-xl transition-all duration-200 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={editMutation.isPending}
                      className="flex items-center gap-2 bg-primary text-white hover:bg-accent disabled:bg-text/30 px-6 py-3 rounded-xl transition-all duration-200 font-medium"
                    >
                      {editMutation.isPending ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <FaEdit className="text-sm" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
