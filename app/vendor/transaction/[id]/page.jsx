"use client";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
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

// Dynamic imports to avoid SSR issues
const loadJsPDF = async () => {
  const { jsPDF } = await import("jspdf");
  return jsPDF;
};

import * as XLSX from "xlsx";
import DataLoader from "@components/Loader/dataLoader";
import Loading from "app/loading";

export default function VendorTransactionPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();

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
  const [editForm, setEditForm] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // --- Excel Export Function ---
  const exportToExcel = () => {
    if (!data || !data.transactions.length) {
      Swal.fire({
        position: "top-center",
        icon: "warning",
        title: "No Data",
        text: "No transactions available to export",
        confirmButtonColor: "rgb(var(--color-primary))",
        background: "rgb(var(--color-background))",
        color: "rgb(var(--color-text))",
      });
      return;
    }

    try {
      // Prepare data for Excel
      const excelData = data.transactions.map((transaction, index) => ({
        "S.No": index + 1,
        Date: new Date(transaction.createdAt).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
        "Transaction ID": transaction.transactionId || "-",
        "Voucher ID": transaction.voucherId || "-",
        Details: transaction.details,
        Type: transaction.type.toUpperCase(),
        "Credit Amount":
          transaction.type === "credit" ? Number(transaction.amount) : 0,
        "Debit Amount":
          transaction.type === "debit" ? Number(transaction.amount) : 0,
        "Balance After": Number(transaction.balanceAfter),
        Currency: data.vendor.currency,
      }));

      // Calculate totals
      const totalCredits = data.transactions
        .filter((t) => t.type === "credit")
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const totalDebits = data.transactions
        .filter((t) => t.type === "debit")
        .reduce((sum, t) => sum + Number(t.amount), 0);

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Add summary data
      const summaryData = [
        ["Vendor Transaction Ledger Report"],
        [`Vendor: ${data.vendor.name}`],
        [`Report Generated: ${new Date().toLocaleString()}`],
        [
          `Current Balance: ${data.vendor.currency} ${Number(
            data.vendor.balance
          ).toLocaleString()}`,
        ],
        [
          `Total Credits: ${
            data.vendor.currency
          } ${totalCredits.toLocaleString()}`,
        ],
        [
          `Total Debits: ${
            data.vendor.currency
          } ${totalDebits.toLocaleString()}`,
        ],
        [
          `Net Position: ${data.vendor.currency} ${(
            totalCredits - totalDebits
          ).toLocaleString()}`,
        ],
        [""], // Empty row for spacing
      ];

      // Add headers to the summary
      XLSX.utils.sheet_add_aoa(ws, summaryData, { origin: -1 });

      // Set column widths
      const colWidths = [
        { wch: 8 }, // S.No
        { wch: 12 }, // Date
        { wch: 20 }, // Transaction ID
        { wch: 15 }, // Voucher ID
        { wch: 40 }, // Details
        { wch: 10 }, // Type
        { wch: 15 }, // Credit Amount
        { wch: 15 }, // Debit Amount
        { wch: 15 }, // Balance After
        { wch: 10 }, // Currency
      ];
      ws["!cols"] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, "Transaction Ledger");

      // Generate Excel file and download
      XLSX.writeFile(
        wb,
        `Transaction-Ledger-${data.vendor.name}-${
          new Date().toISOString().split("T")[0]
        }.xlsx`
      );

      Swal.fire({
        position: "top-center",
        icon: "success",
        title: "Excel Exported!",
        text: "Transaction ledger has been downloaded as Excel",
        showConfirmButton: false,
        timer: 2000,
        background: "rgb(var(--color-background))",
        color: "rgb(var(--color-text))",
      });
    } catch (error) {
      console.error("Excel export error:", error);
      Swal.fire({
        position: "top-center",
        icon: "error",
        title: "Export Failed",
        text: "Failed to generate Excel file. Please try again.",
        confirmButtonColor: "rgb(var(--color-primary))",
        background: "rgb(var(--color-background))",
        color: "rgb(var(--color-text))",
      });
    }
  };

  // --- Alternative Simple PDF Export (if autoTable still doesn't work) ---
  const exportToPDFSimple = async () => {
    if (!data || !data.transactions.length) {
      Swal.fire({
        position: "top-center",
        icon: "warning",
        title: "No Data",
        text: "No transactions available to export",
        confirmButtonColor: "rgb(var(--color-primary))",
        background: "rgb(var(--color-background))",
        color: "rgb(var(--color-text))",
      });
      return;
    }

    try {
      const jsPDF = await loadJsPDF();
      const doc = new jsPDF();

      // Add title
      doc.setFontSize(16);
      doc.setTextColor(40, 40, 40);
      doc.text(`Transaction Ledger - ${data.vendor.name}`, 14, 15);

      // Add header info
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 25);
      doc.text(
        `Balance: ${data.vendor.currency} ${Number(
          data.vendor.balance
        ).toLocaleString()}`,
        14,
        32
      );
      doc.text(`Total Transactions: ${data.transactions.length}`, 14, 39);

      // Simple table header
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.setFillColor(97, 140, 143);
      doc.rect(14, 45, 182, 6, "F");
      doc.text("Date", 16, 49);
      doc.text("Trans ID", 40, 49);
      doc.text("Voucher ID", 70, 49);
      doc.text("Details", 100, 49);
      doc.text("Type", 150, 49);
      doc.text("Amount", 165, 49);
      doc.text("Balance", 185, 49);

      // Table rows
      let yPosition = 53;
      doc.setTextColor(40, 40, 40);

      data.transactions.forEach((transaction, index) => {
        if (yPosition > 280) {
          doc.addPage();
          yPosition = 20;
          // Add header on new page
          doc.setFontSize(10);
          doc.text(`Transaction Ledger - ${data.vendor.name} (Cont.)`, 14, 15);
          yPosition = 25;
        }

        doc.setFontSize(7);
        doc.text(
          new Date(transaction.createdAt).toLocaleDateString("en-GB"),
          16,
          yPosition
        );
        doc.text(transaction.transactionId || "-", 40, yPosition);
        doc.text(transaction.voucherId || "-", 70, yPosition);

        // Truncate long details
        const details =
          transaction.details.length > 25
            ? transaction.details.substring(0, 25) + "..."
            : transaction.details;
        doc.text(details, 100, yPosition);

        doc.text(transaction.type.toUpperCase(), 150, yPosition);
        doc.text(Number(transaction.amount).toLocaleString(), 165, yPosition);
        doc.text(
          Number(transaction.balanceAfter).toLocaleString(),
          185,
          yPosition
        );

        yPosition += 4;
      });

      // Add footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Page ${i} of ${pageCount} - Farm Expo Management System`,
          105,
          290,
          { align: "center" }
        );
      }

      doc.save(
        `Ledger-${data.vendor.name.replace(/\s+/g, "-")}-${
          new Date().toISOString().split("T")[0]
        }.pdf`
      );

      Swal.fire({
        position: "top-center",
        icon: "success",
        title: "PDF Exported!",
        text: "Transaction ledger has been downloaded",
        showConfirmButton: false,
        timer: 2000,
        background: "rgb(var(--color-background))",
        color: "rgb(var(--color-text))",
      });
    } catch (error) {
      console.error("Simple PDF export error:", error);
      Swal.fire({
        position: "top-center",
        icon: "error",
        title: "Export Failed",
        text: "Failed to generate PDF. Please try again.",
        confirmButtonColor: "rgb(var(--color-primary))",
        background: "rgb(var(--color-background))",
        color: "rgb(var(--color-text))",
      });
    }
  };

  // --- Mutations ---
  const addMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await fetch("/api/vendor/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to add transaction");
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["vendorTransactions", id]);
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
        throw new Error("Only the most recent transaction can be updated");
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["vendorTransactions", id]);
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
      if (!res.ok) throw new Error("Failed to delete transaction");
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["vendorTransactions", id]);
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
                  <motion.button
                    onClick={exportToExcel}
                    className="flex items-center gap-2 bg-green-600 text-white hover:bg-green-700 px-4 py-2 rounded-xl transition-all duration-200 font-medium"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <FaFileExcel className="text-sm" />
                    Export Excel
                  </motion.button>
                  <motion.button
                    onClick={exportToPDFSimple}
                    className="flex items-center gap-2 bg-red-500 text-white hover:bg-red-600 px-4 py-2 rounded-xl transition-all duration-200 font-medium"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <FaFilePdf className="text-sm" />
                    Export PDF
                  </motion.button>
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
                        Consignment
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
                    <AnimatePresence>
                      {data.transactions.map((transaction, index) => (
                        <motion.tr
                          key={transaction.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
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
                                #{transaction.consignmentId}
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
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
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
