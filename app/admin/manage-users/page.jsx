"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import Input from "@components/Input";
import SaveButton from "@components/Button/SaveButton";
import { getCookie } from "cookies-next";
import useAuth from "../../../hooks/useAuth";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaUserPlus,
  FaUserShield,
  FaUser,
  FaTrash,
  FaEdit,
  FaUsers,
} from "react-icons/fa";

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

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      if (!token || !user || user.role !== "admin") return [];
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
        title: "User Created Successfully!",
        timer: 1500,
        showConfirmButton: false,
      });
    },
    onError: (error) => {
      Swal.fire({
        icon: "error",
        title: "Creation Failed",
        text: error.message || "Failed to create user. Please try again.",
        confirmButtonColor: "#dc2626",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`/api/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete user");
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["users"]);
      Swal.fire({
        icon: "success",
        title: "User Deleted!",
        timer: 1500,
        showConfirmButton: false,
      });
    },
    onError: () => {
      Swal.fire({
        icon: "error",
        title: "Deletion Failed",
        text: "Failed to delete user. Please try again.",
        confirmButtonColor: "#dc2626",
      });
    },
  });

  const [actionLoading, setActionLoading] = useState({});
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    password: "",
  });

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
          title: `User ${
            toRole === "admin" ? "Promoted to Admin" : "Set as Regular User"
          }`,
          timer: 1500,
          showConfirmButton: false,
        });
        queryClient.invalidateQueries(["users"]);
      } else {
        Swal.fire({
          icon: "error",
          title: "Action Failed",
          text: data.error || "Unable to perform this action.",
          confirmButtonColor: "#dc2626",
        });
      }
    } catch {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Something went wrong. Please try again.",
        confirmButtonColor: "#dc2626",
      });
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <FaUsers className="text-2xl text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white font-poppins">
              User Management
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            Manage system users and their permissions
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Add User Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-center gap-2 mb-6">
              <FaUserPlus className="text-blue-600 text-lg" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Add New User
              </h2>
            </div>

            <div className="space-y-4">
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                label="Email Address"
                placeholder="user@example.com"
                required
              />
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                label="Full Name"
                placeholder="Enter full name (optional)"
              />
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                label="Password"
                placeholder="Enter secure password"
                required
              />

              <SaveButton
                handleSubmit={() => createUserMutation.mutate(formData)}
                isLoading={createUserMutation.isPending}
                existingData={false}
                className="w-full"
              />
            </div>
          </motion.div>

          {/* Users List */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <FaUsers className="text-gray-600 dark:text-gray-400 text-lg" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Users List
                </h2>
              </div>
              <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm px-3 py-1 rounded-full">
                {users.length} users
              </span>
            </div>

            {usersLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                    </div>
                    <div className="flex gap-2">
                      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <AnimatePresence>
                <div className="space-y-3">
                  {users?.map((userItem, index) => (
                    <motion.div
                      key={userItem.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-full ${
                            userItem.role === "admin"
                              ? "bg-purple-100 dark:bg-purple-900"
                              : "bg-gray-100 dark:bg-gray-700"
                          }`}
                        >
                          {userItem.role === "admin" ? (
                            <FaUserShield className="text-purple-600 dark:text-purple-400" />
                          ) : (
                            <FaUser className="text-gray-600 dark:text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {userItem.email}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                            <span>{userItem.name || "No name provided"}</span>
                            <span className="text-gray-400">•</span>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                userItem.role === "admin"
                                  ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
                                  : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                              }`}
                            >
                              {userItem.role}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {userItem.role !== "admin" ? (
                          <button
                            onClick={() =>
                              promoteOrUnpromoteUser(userItem.id, "admin")
                            }
                            disabled={actionLoading[userItem.id]}
                            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                          >
                            <FaUserShield className="text-sm" />
                            {actionLoading[userItem.id] ? "..." : "Promote"}
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              promoteOrUnpromoteUser(userItem.id, "user")
                            }
                            disabled={actionLoading[userItem.id]}
                            className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-400 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                          >
                            <FaUser className="text-sm" />
                            {actionLoading[userItem.id] ? "..." : "Demote"}
                          </button>
                        )}

                        <button
                          onClick={async () => {
                            const result = await Swal.fire({
                              title: "Delete User?",
                              text: `Are you sure you want to delete ${userItem.email}? This action cannot be undone.`,
                              icon: "warning",
                              showCancelButton: true,
                              confirmButtonColor: "#dc2626",
                              cancelButtonColor: "#6b7280",
                              confirmButtonText: "Yes, delete it!",
                              cancelButtonText: "Cancel",
                              reverseButtons: true,
                            });

                            if (result.isConfirmed) {
                              deleteUserMutation.mutate(userItem.id);
                            }
                          }}
                          disabled={deleteUserMutation.isPending}
                          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                        >
                          <FaTrash className="text-sm" />
                          {deleteUserMutation.isPending ? "..." : "Delete"}
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </AnimatePresence>
            )}

            {!usersLoading && users.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8"
              >
                <FaUsers className="text-4xl text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">
                  No users found
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  Create your first user using the form
                </p>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
