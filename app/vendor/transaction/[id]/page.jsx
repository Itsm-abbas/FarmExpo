"use client";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import Swal from "sweetalert2"; // <-- Install: npm install sweetalert2
import fonts from "@utils/fonts";
import Loading from "app/loading";

export default function VendorTransactionPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["vendorTransactions", id],
    queryFn: async () => {
      const res = await fetch(`/api/vendor/transactions/${id}`);
      return res.json();
    },
  });

  const [form, setForm] = useState({ type: "credit", amount: "", note: "" });
  const [editForm, setEditForm] = useState(null);
  const [showEdit, setShowEdit] = useState(false);

  const addMutation = useMutation({
    mutationFn: async (payload) => {
      await fetch("/api/vendor/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["vendorTransactions", id]);
      Swal.fire({
        icon: "success",
        title: "Transaction Added",
        text: "Your transaction has been successfully added.",
        timer: 2000,
        showConfirmButton: false,
      });
      setForm({ type: "credit", amount: "", note: "" });
    },
    onError: () => {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Something went wrong while adding the transaction.",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (tid) => {
      await fetch("/api/vendor/transactions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: tid }),
      });
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
  });

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
      if (result.isConfirmed) {
        Swal.fire({
          title: "Deleting...",
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading(),
        });
        deleteMutation.mutate(tid);
      }
    });
  };
  const editMutation = useMutation({
    mutationFn: async (payload) => {
      await fetch("/api/vendor/transactions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["vendorTransactions", id]);
      setShowEdit(false);
      setEditForm(null);
    },
  });

  if (isLoading) return <div className="p-6"></div>;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.amount) {
      Swal.fire({
        icon: "warning",
        title: "Missing Fields",
        text: "Please fill out both the amount and note before adding.",
      });
      return;
    }
    addMutation.mutate({ ...form, vendorId: Number(id) });
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    editMutation.mutate({ ...editForm });
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className={`${fonts.montserrat.className} text-2xl  `}>
        {data.vendor.name} - Transactions
      </h1>
      <p className="text-gray-600 mb-6">
        Balance:{" "}
        <span className="font-semibold text-green-600 number-font ">
          {data.vendor.currency} {Number(data.vendor.balance).toLocaleString()}
        </span>
      </p>

      {/* Add Transaction Form */}
      <form
        onSubmit={handleSubmit}
        className="mb-6 flex flex-col sm:flex-row gap-3"
      >
        <select
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
          className="outline-SecondaryButton p-2 px-4 rounded w-full sm:w-auto"
        >
          <option value="credit">Credit (+) </option>
          <option value="debit">Debit (-) </option>
        </select>
        <input
          type="number"
          step="0.01"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          placeholder="Amount"
          className="outline-SecondaryButton p-2 rounded w-full sm:w-auto"
        />
        <input
          type="text"
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
          placeholder="Note"
          className="border p-2 outline-SecondaryButton rounded flex-1"
        />
        <button
          type="submit"
          className=" bg-SecondaryButton text-white px-8  py-2 rounded hover:bg-SecondaryButtonHover w-full sm:w-auto flex items-center justify-center"
          disabled={addMutation.isPending}
        >
          {addMutation.isPending ? (
            <span className="border-t-transparent border-white">
              Loading...
            </span>
          ) : (
            "Add"
          )}
        </button>
      </form>

      {/* Transaction List */}
      <div className="hidden sm:block overflow-x-auto">
        {data.transactions.length === 0 && (
          <p className="p-6 w-full flex justify-center items-center text-xl">
            No transactions found.
          </p>
        )}
        {data.transactions.length > 0 && (
          <table className="w-full border border-gray-200 shadow-sm rounded">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-2 border">Date</th>
                <th className="p-2 border">Type</th>
                <th className="p-2 border">Amount</th>
                <th className="p-2 border">Note</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.transactions.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="p-2 border number-font">
                    {new Date(t.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-2 border capitalize">{t.type}</td>
                  <td className="p-2 border font-medium number-font ">
                    {data.vendor.currency} {Number(t.amount).toLocaleString()}
                  </td>
                  <td className="p-2 border">{t.note}</td>
                  <td className="p-2 border flex gap-2">
                    <button
                      onClick={() => {
                        setEditForm(t);
                        setShowEdit(true);
                      }}
                      className="text-blue-500 hover:underline"
                    >
                      Edit
                    </button>
                    |{" "}
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="text-red-500 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="sm:hidden space-y-4">
        {data.transactions.map((t) => (
          <div
            key={t.id}
            className="border border-gray-200 rounded-lg p-4 shadow-sm bg-white"
          >
            <p className="text-sm text-gray-500">
              {new Date(t.createdAt).toLocaleDateString()}
            </p>
            <p className="font-semibold capitalize">{t.type}</p>
            <p className="text-green-600 font-bold">
              {data.vendor.currency} {Number(t.amount).toLocaleString()}
            </p>
            <p className="text-gray-700">{t.note}</p>
            <div className="flex gap-4 mt-2">
              <button
                onClick={() => {
                  setEditForm(t);
                  setShowEdit(true);
                }}
                className="text-blue-500 hover:underline text-sm"
              >
                Edit
              </button>
              {" | "}
              <button
                onClick={() => handleDelete(t.id)}
                className="text-red-500 hover:underline text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
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
                value={editForm.note || ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, note: e.target.value })
                }
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
