"use client";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import Swal from "sweetalert2";
import fonts from "@utils/fonts";
import { AnimatePresence, motion } from "framer-motion";

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
        icon: "success",
        title: "Transaction Added",
        timer: 2000,
        showConfirmButton: false,
      });
      setForm({
        type: "credit",
        transactionId: "",
        amount: "",
        details: "",
        voucherId: "",
      });
    },
    onError: () =>
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Something went wrong while adding the transaction.",
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
        icon: "success",
        title: "Transaction Updated",
        timer: 1500,
        showConfirmButton: false,
      });
    },
    onError: (error) =>
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message,
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
        icon: "success",
        title: "Transaction Deleted",
        timer: 1500,
        showConfirmButton: false,
      });
    },
    onError: () =>
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Only the latest transaction can be deleted.",
      }),
  });

  // --- Handlers ---
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.amount || !form.details || !form.transactionId) {
      return Swal.fire({
        icon: "warning",
        title: "Missing Fields",
        text: "Please fill out transaction ID, amount, and details before adding.",
      });
    }
    addMutation.mutate({ ...form, vendorId: Number(id) });
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editForm.amount || !editForm.details || !editForm.transactionId) {
      return Swal.fire({
        icon: "warning",
        title: "Missing Fields",
        text: "Please fill out transaction ID, amount, and details before saving.",
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
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) deleteMutation.mutate(tid);
    });
  };

  if (isLoading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className={`${fonts.montserrat.className} text-2xl font-bold mb-2`}>
        {data.vendor.name} - Transactions
      </h1>
      <p className="text-gray-600 mb-6">
        Current Balance:{" "}
        <span className="font-semibold text-green-600 number-font">
          {data.vendor.currency} {Number(data.vendor.balance).toLocaleString()}
        </span>
      </p>

      {/* Add Transaction Form */}
      <form
        onSubmit={handleSubmit}
        className="mb-6 grid grid-cols-1 md:grid-cols-6 gap-3 bg-gray-50 p-4 rounded-lg shadow"
      >
        <select
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
          className="border p-2 rounded-md text-gray-700"
        >
          <option value="credit">Credit (+)</option>
          <option value="debit">Debit (-)</option>
        </select>
        <input
          type="text"
          value={form.transactionId}
          onChange={(e) => setForm({ ...form, transactionId: e.target.value })}
          placeholder="Transaction ID"
          className="border p-2 rounded-md"
        />
        <input
          type="number"
          step="0.01"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          placeholder="Amount"
          className="border p-2 rounded-md"
        />
        <input
          type="text"
          value={form.details}
          onChange={(e) => setForm({ ...form, details: e.target.value })}
          placeholder="Details"
          className="border p-2 rounded-md"
        />
        <input
          type="text"
          value={form.voucherId}
          onChange={(e) => setForm({ ...form, voucherId: e.target.value })}
          placeholder="voucherId #"
          className="border p-2 rounded-md"
        />
        <button
          type="submit"
          className="bg-SecondaryButton text-white px-6 py-2 rounded-md hover:bg-SecondaryButtonHover"
          disabled={addMutation.isPending}
        >
          {addMutation.isPending ? "Saving..." : "Add"}
        </button>
      </form>

      {/* Transaction List */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        {!data?.transactions?.length ? (
          <p className="p-6 text-center text-gray-500">
            No transactions found.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr
                className={`${fonts.poppins.className} bg-gray-50 text-gray-700`}
              >
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">Transaction ID</th>
                <th className="p-3 text-left">Voucher ID</th>
                <th className="p-3 text-left">Details</th>
                <th className="p-3 text-right">
                  Credit({data.vendor.currency})
                </th>
                <th className="p-3 text-right">
                  Debit({data.vendor.currency})
                </th>
                <th className="p-3 text-right">
                  Balance({data.vendor.currency})
                </th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.transactions.map((t, idx) => (
                <tr
                  key={t.id}
                  className={`${
                    idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                  } hover:bg-gray-100 transition`}
                >
                  <td className="p-3 text-gray-700">
                    {new Date(t.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="p-3 text-gray-700">
                    {t.transactionId || "-"}
                  </td>
                  <td className="p-3 text-gray-700">{t.voucherId || "-"}</td>
                  <td className="p-3 text-gray-700">{t.details}</td>
                  <td className="p-3 text-right">
                    {t.type === "credit" && (
                      <span className="px-2 py-1 text-green-700 bg-green-100 rounded-full text-sm font-semibold number-font">
                        {Number(t.amount).toLocaleString()}
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    {t.type === "debit" && (
                      <span className="px-2 py-1 text-red-700 bg-red-100 rounded-full text-sm font-semibold number-font">
                        {Number(t.amount).toLocaleString()}
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-right number-font font-semibold  text-gray-800">
                    <AnimatePresence>
                      <motion.div
                        key={t.balanceAfter}
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        transition={{ duration: 0.8 }}
                      >
                        {Number(t.balanceAfter).toLocaleString()}
                      </motion.div>
                    </AnimatePresence>
                  </td>
                  <td className="p-3 text-center flex justify-center gap-3">
                    <button
                      onClick={() => {
                        setEditForm(t);
                        setShowEdit(true);
                      }}
                      className="text-blue-500 hover:text-blue-700 transition"
                      title="Edit transaction"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="text-red-500 hover:text-red-700 transition"
                      title="Delete transaction"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit Modal */}
      {showEdit && editForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center px-4">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Edit Transaction</h2>
            <form onSubmit={handleEditSubmit} className="flex flex-col gap-3">
              <select
                value={editForm.type}
                onChange={(e) =>
                  setEditForm({ ...editForm, type: e.target.value })
                }
                className="border p-2 rounded"
              >
                <option value="credit">Credit</option>
                <option value="debit">Debit</option>
              </select>
              <input
                type="text"
                value={editForm.transactionId || ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, transactionId: e.target.value })
                }
                placeholder="Transaction ID"
                className="border p-2 rounded"
              />
              <input
                type="number"
                step="0.01"
                value={editForm.amount}
                onChange={(e) =>
                  setEditForm({ ...editForm, amount: e.target.value })
                }
                className="border p-2 rounded"
              />
              <input
                type="text"
                value={editForm.details || ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, details: e.target.value })
                }
                placeholder="Details"
                className="border p-2 rounded"
              />
              <input
                type="text"
                value={editForm.voucherId || ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, voucherId: e.target.value })
                }
                placeholder="voucherId #"
                className="border p-2 rounded"
              />
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowEdit(false)}
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
