"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import Input from "@components/Input";
import SaveButton from "@components/Button/SaveButton";
import { getCookie } from "cookies-next";
import useAuth from "../../../hooks/useAuth";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function ManageUsersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const token = getCookie("token");

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      router.replace("/");
    }
  }, [user, loading]);

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      if (!token || !user || user.role != "admin") return [];
      const res = await fetch("/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.json();
    },
    enabled: !!user && user.role === "admin",
  });

  const createUserMutation = useMutation({
    mutationFn: async (formData) => {
      const res = await fetch("/api/users/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["users"]);
      setFormData({ email: "", name: "", password: "" });
      Swal.fire({
        icon: "success",
        title: "User created",
        timer: 1500,
        showConfirmButton: false,
      });
    },
    onError: (error) => {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "Failed to create user",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id) => {
      await fetch(`/api/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["users"]);
      Swal.fire({
        icon: "success",
        title: "User deleted",
        timer: 1500,
        showConfirmButton: false,
      });
    },
    onError: () => {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to delete user",
      });
    },
  });

  const [actionLoading, setActionLoading] = useState({});

  const promoteOrUnpromoteUser = async (id, toRole) => {
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await fetch(`/api/users/${id}?role=${toRole}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        Swal.fire({
          icon: "success",
          title: `User ${toRole === "admin" ? "promoted" : "unpromoted"}`,
          timer: 1500,
          showConfirmButton: false,
        });
        queryClient.invalidateQueries(["users"]);
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: data.error || "Action failed",
        });
      }
    } catch {
      Swal.fire("Error", "Something went wrong", "error");
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const [formData, setFormData] = useState({
    email: "",
    name: "",
    password: "",
  });

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Add User</h2>

      <div className="bg-white dark:bg-gray-800 p-4 rounded shadow mb-8 space-y-4 w-full max-w-md">
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          label="Email"
          placeholder="Enter user email"
        />
        <Input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          label="Name"
          placeholder="Enter name (optional)"
        />
        <Input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
          label="Password"
          placeholder="Enter password"
        />
        <SaveButton
          handleSubmit={() => createUserMutation.mutate(formData)}
          isLoading={createUserMutation.isLoading}
          existingData={false}
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold mb-2">Users List</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {users?.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between border p-4 rounded-md shadow bg-white dark:bg-gray-700 hover:shadow-md transition-all"
            >
              <div>
                <p className="font-semibold text-gray-800 dark:text-gray-100">
                  {user.email}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {user.name || "No Name"}
                </p>
                <p className="text-xs italic text-gray-500 dark:text-gray-400">
                  {user.role}
                </p>
              </div>

              <div className="flex gap-2">
                {user.role !== "admin" ? (
                  <button
                    className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition"
                    onClick={() => promoteOrUnpromoteUser(user.id, "admin")}
                    disabled={actionLoading[user.id]}
                  >
                    {actionLoading[user.id] ? "Loading..." : "Promote"}
                  </button>
                ) : (
                  <button
                    className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600 transition"
                    onClick={() => promoteOrUnpromoteUser(user.id, "user")}
                    disabled={actionLoading[user.id]}
                  >
                    {actionLoading[user.id] ? "Loading..." : "Unpromote"}
                  </button>
                )}

                <button
                  onClick={async () => {
                    const result = await Swal.fire({
                      title: "Are you sure?",
                      text: "This action cannot be undone.",
                      icon: "warning",
                      showCancelButton: true,
                      confirmButtonColor: "#d33",
                      cancelButtonColor: "#3085d6",
                      confirmButtonText: "Yes, delete it!",
                    });

                    if (result.isConfirmed) {
                      deleteUserMutation.mutate(user.id);
                    }
                  }}
                  className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition"
                  disabled={
                    deleteUserMutation.isLoading && actionLoading[user.id]
                  }
                >
                  {deleteUserMutation.isLoading && actionLoading[user.id]
                    ? "Deleting..."
                    : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
