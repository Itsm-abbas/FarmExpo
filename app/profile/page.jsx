"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Input from "@components/Input";
import SaveButton from "@components/Button/SaveButton";
import Swal from "sweetalert2";
import { getCookie } from "cookies-next";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaSave,
  FaUserCircle,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";

export default function ProfileSettings() {
  const queryClient = useQueryClient();
  const [token, setToken] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});

  // Hydration-safe token
  useEffect(() => {
    setMounted(true);
    const cookieToken = getCookie("token");
    setToken(cookieToken || null);
  }, []);

  const { data: user, isLoading } = useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => {
      const res = await fetch("/api/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch profile");
      return res.json();
    },
    enabled: !!token && mounted,
  });

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        email: user.email || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    }
  }, [user]);

  const validateForm = () => {
    const newErrors = {};

    if (!form.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = "Email is invalid";
    }

    // Password validation only if any password field is filled
    if (form.currentPassword || form.newPassword || form.confirmPassword) {
      if (!form.currentPassword) {
        newErrors.currentPassword =
          "Current password is required to change password";
      }

      if (!form.newPassword) {
        newErrors.newPassword = "New password is required";
      } else if (form.newPassword.length < 6) {
        newErrors.newPassword = "Password must be at least 6 characters";
      }

      if (!form.confirmPassword) {
        newErrors.confirmPassword = "Please confirm your new password";
      } else if (form.newPassword !== form.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update profile");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["userProfile"]);
      // Clear password fields after success
      setForm((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
      setErrors({});

      Swal.fire({
        position: "top-center",
        icon: "success",
        title: "Profile Updated!",
        text: "Your profile has been updated successfully",
        showConfirmButton: false,
        timer: 2000,
        background: "rgb(var(--color-background))",
        color: "rgb(var(--color-text))",
        iconColor: "rgb(var(--color-primary))",
      });
    },
    onError: (error) => {
      Swal.fire({
        position: "top-center",
        icon: "error",
        title: "Update Failed",
        text: error.message || "Could not update profile",
        confirmButtonColor: "rgb(var(--color-primary))",
        background: "rgb(var(--color-background))",
        color: "rgb(var(--color-text))",
      });
    },
  });

  const handleChange = (e) => {
    const { id, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [id]: value,
    }));
    // Clear error when user starts typing
    if (errors[id]) {
      setErrors((prev) => ({
        ...prev,
        [id]: "",
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Prepare data for API
    const updateData = {
      name: form.name,
      email: form.email,
    };

    // Only include password data if user is trying to change password
    if (form.currentPassword && form.newPassword) {
      updateData.currentPassword = form.currentPassword;
      updateData.newPassword = form.newPassword;
    }

    updateMutation.mutate(updateData);
  };

  return (
    <div className="min-h-screen bg-background font-inter py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="flex justify-center mb-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center"
            >
              <FaUserCircle className="text-4xl text-primary" />
            </motion.div>
          </div>
          <h1 className="text-3xl lg:text-4xl font-poppins font-bold text-text mb-2">
            Profile Settings
          </h1>
          <p className="text-text/60 text-lg">
            Manage your account information and security
          </p>
        </motion.div>

        {/* Profile Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-background border-2 border-primary/20 rounded-2xl shadow-xl p-6 sm:p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field */}
            <div>
              <label
                htmlFor="name"
                className="flex items-center gap-2 text-text text-sm font-medium mb-3"
              >
                <FaUser className="text-primary/60 text-sm" />
                Full Name
                <span className="text-red-500 ml-1">*</span>
              </label>
              <Input
                id="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                error={errors.name}
                required
              />
            </div>

            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="flex items-center gap-2 text-text text-sm font-medium mb-3"
              >
                <FaEnvelope className="text-primary/60 text-sm" />
                Email Address
                <span className="text-red-500 ml-1">*</span>
              </label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter your email address"
                error={errors.email}
                required
              />
            </div>

            {/* Password Change Section */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="border-t border-primary/10 pt-6"
            >
              <h3 className="text-lg font-semibold font-poppins text-text mb-4 flex items-center gap-2">
                <FaLock className="text-primary" />
                Change Password
                <span className="text-text/40 text-sm font-normal ml-auto">
                  (Optional)
                </span>
              </h3>

              <div className="space-y-4">
                {/* Current Password */}
                <div>
                  <label
                    htmlFor="currentPassword"
                    className="flex items-center gap-2 text-text text-sm font-medium mb-3"
                  >
                    Current Password
                  </label>
                  <Input
                    id="currentPassword"
                    type={showPassword ? "text" : "password"}
                    value={form.currentPassword}
                    onChange={handleChange}
                    placeholder="Enter current password"
                    error={errors.currentPassword}
                  />
                </div>

                {/* New Password */}
                <div>
                  <label
                    htmlFor="newPassword"
                    className="flex items-center gap-2 text-text text-sm font-medium mb-3"
                  >
                    New Password
                  </label>
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    value={form.newPassword}
                    onChange={handleChange}
                    placeholder="Enter new password"
                    error={errors.newPassword}
                  />
                </div>

                {/* Confirm Password */}
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="flex items-center gap-2 text-text text-sm font-medium mb-3"
                  >
                    Confirm New Password
                  </label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm new password"
                    error={errors.confirmPassword}
                  />
                </div>
              </div>

              {/* Password Requirements */}
              {(form.newPassword || form.confirmPassword) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="bg-primary/5 rounded-xl p-4 mt-4"
                >
                  <p className="text-text font-medium text-sm mb-2">
                    Password Requirements:
                  </p>
                  <ul className="text-text/60 text-xs space-y-1">
                    <li
                      className={
                        form.newPassword.length >= 6 ? "text-green-500" : ""
                      }
                    >
                      • At least 6 characters long
                    </li>
                    <li
                      className={
                        form.newPassword === form.confirmPassword &&
                        form.confirmPassword
                          ? "text-green-500"
                          : ""
                      }
                    >
                      • Passwords must match
                    </li>
                  </ul>
                </motion.div>
              )}
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-primary/10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <SaveButton
                handleSubmit={handleSubmit}
                isLoading={updateMutation.isPending}
                existingData={true}
                label="Update Profile"
              />

              {/* <button
                type="button"
                onClick={() => {
                  setForm({
                    name: user?.name || "",
                    email: user?.email || "",
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                  });
                  setErrors({});
                }}
                className="px-6 py-3 bg-text/10 text-text w-full hover:bg-text/20 rounded-xl transition-all duration-200 font-medium"
                disabled={updateMutation.isPending}
              >
                Reset Changes
              </button> */}
            </motion.div>
          </form>
        </motion.div>

        {/* Additional Info Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Account Status */}
          <div className="bg-background border-2 border-primary/20 rounded-2xl p-6">
            <h3 className="text-text font-semibold mb-3">Account Status</h3>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-text/60 text-sm">Active</span>
            </div>
            <p className="text-text/40 text-xs mt-2">
              Your account is in good standing
            </p>
          </div>

          {/* Last Updated */}
          <div className="bg-background border-2 border-primary/20 rounded-2xl p-6">
            <h3 className="text-text font-semibold mb-3">Last Updated</h3>
            <p className="text-text/60 text-sm">
              {user?.updatedAt
                ? new Date(user.updatedAt).toLocaleDateString()
                : "Never"}
            </p>
            <p className="text-text/40 text-xs mt-2">
              Profile information last modified
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
