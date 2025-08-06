"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Input from "@components/Input";
import SaveButton from "@components/Button/SaveButton";
import Swal from "sweetalert2";
import { getCookie } from "cookies-next";

export default function ProfileSettings() {
  const queryClient = useQueryClient();
  const [token, setToken] = useState(null);
  const [mounted, setMounted] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

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
    enabled: !!token && mounted, // ensures hydration-safe fetch
  });

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        email: user.email || "",
        password: "",
      });
    }
  }, [user]);

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
      if (!res.ok) throw new Error("Failed to update profile");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["userProfile"]);
      Swal.fire("Success", "Profile updated", "success");
    },
    onError: () => {
      Swal.fire("Error", "Could not update profile", "error");
    },
  });

  const handleChange = (e) => {
    const { id, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [id]: value,
    }));
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(form);
  };

  if (!mounted || isLoading) return <p>Loading...</p>;

  return (
    <div className="w-full m-auto md:w-1/3 justify-center  p-6">
      <form
        onSubmit={handleSubmit}
        className="space-y-4   bg-white p-6 rounded shadow-md"
      >
        <h2 className="text-xl font-bold text-gray-800">Profile Settings</h2>

        <Input
          id="name"
          type="text"
          value={form.name}
          onChange={handleChange}
          placeholder="Name"
        />
        <Input
          id="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          placeholder="Email"
        />
        <Input
          id="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          placeholder="New Password"
        />
        <SaveButton
          text="Update Profile"
          isLoading={updateMutation.isPending}
        />
      </form>
    </div>
  );
}
