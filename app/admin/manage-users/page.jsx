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
  FaSearch,
  FaFilter,
  FaEllipsisV,
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
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(null);

  // Filter users based on search and role filter
  const filteredUsers = users.filter((userItem) => {
    const matchesSearch =
      userItem.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userItem.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || userItem.role === roleFilter;
    return matchesSearch && matchesRole;
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
      setMobileMenuOpen(null);
    }
  };

  const handleDeleteUser = async (userItem) => {
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
      setMobileMenuOpen(null);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        mobileMenuOpen &&
        !event.target.closest(".mobile-menu-trigger") &&
        !event.target.closest(".mobile-menu-dropdown")
      ) {
        setMobileMenuOpen(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [mobileMenuOpen]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto py-6 sm:py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <FaUsers className="text-2xl text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white font-poppins">
                  User Management
                </h1>
                <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
                  Manage system users and their permissions
                </p>
              </div>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm px-3 py-2 rounded-full font-medium">
              {users.length} user{users.length !== 1 ? "s" : ""}
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Add User Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6"
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
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <div className="flex items-center gap-2">
                <FaUsers className="text-gray-600 dark:text-gray-400 text-lg" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Users List
                </h2>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 sm:w-48">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                </select>
              </div>
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
                  {/* Table Header - Hidden on mobile */}
                  <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                    <div className="col-span-5">User</div>
                    <div className="col-span-4">Role</div>
                    <div className="col-span-3 text-right">Actions</div>
                  </div>

                  {filteredUsers?.map((userItem, index) => (
                    <motion.div
                      key={userItem.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex flex-col md:grid md:grid-cols-12 md:gap-4 p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:shadow-md transition-all duration-200"
                    >
                      {/* User Info */}
                      <div className="col-span-5 flex items-center gap-3 mb-3 md:mb-0">
                        <div
                          className={`p-2 rounded-full flex-shrink-0 ${
                            userItem.role === "admin"
                              ? "bg-purple-100 dark:bg-purple-900"
                              : "bg-gray-100 dark:bg-gray-700"
                          }`}
                        >
                          {userItem.role === "admin" ? (
                            <FaUserShield className="text-purple-600 dark:text-purple-400 text-sm" />
                          ) : (
                            <FaUser className="text-gray-600 dark:text-gray-400 text-sm" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-900 dark:text-white truncate">
                            {userItem.email}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                            {userItem.name || "No name provided"}
                          </p>
                        </div>
                      </div>

                      {/* Role Badge */}
                      <div className="col-span-4 flex items-center mb-3 md:mb-0">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            userItem.role === "admin"
                              ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
                              : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                          }`}
                        >
                          {userItem.role}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="col-span-3 flex justify-between md:justify-end items-center">
                        {/* Desktop Actions */}
                        <div className="hidden md:flex gap-2">
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
                            onClick={() => handleDeleteUser(userItem)}
                            disabled={deleteUserMutation.isPending}
                            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                          >
                            <FaTrash className="text-sm" />
                            {deleteUserMutation.isPending ? "..." : "Delete"}
                          </button>
                        </div>

                        {/* Mobile Actions Dropdown */}
                        <div className="md:hidden relative">
                          <button
                            onClick={() =>
                              setMobileMenuOpen(
                                mobileMenuOpen === userItem.id
                                  ? null
                                  : userItem.id
                              )
                            }
                            className="mobile-menu-trigger p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            <FaEllipsisV className="text-gray-600 dark:text-gray-400" />
                          </button>

                          <AnimatePresence>
                            {mobileMenuOpen === userItem.id && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="mobile-menu-dropdown absolute left-0 sm:left-auto sm:right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50 py-1"
                              >
                                {userItem.role !== "admin" ? (
                                  <button
                                    onClick={() =>
                                      promoteOrUnpromoteUser(
                                        userItem.id,
                                        "admin"
                                      )
                                    }
                                    disabled={actionLoading[userItem.id]}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                                  >
                                    <FaUserShield className="text-purple-600 flex-shrink-0" />
                                    <span>Promote to Admin</span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() =>
                                      promoteOrUnpromoteUser(
                                        userItem.id,
                                        "user"
                                      )
                                    }
                                    disabled={actionLoading[userItem.id]}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                                  >
                                    <FaUser className="text-yellow-600 flex-shrink-0" />
                                    <span>Demote to User</span>
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteUser(userItem)}
                                  disabled={deleteUserMutation.isPending}
                                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                                >
                                  <FaTrash className="flex-shrink-0" />
                                  <span>Delete User</span>
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </AnimatePresence>
            )}

            {!usersLoading && filteredUsers.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8"
              >
                <FaUsers className="text-4xl text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">
                  {searchTerm || roleFilter !== "all"
                    ? "No users match your filters"
                    : "No users found"}
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  {searchTerm || roleFilter !== "all"
                    ? "Try adjusting your search or filters"
                    : "Create your first user using the form"}
                </p>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
