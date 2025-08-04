"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import Input from "@components/Input";
import SaveButton from "@components/Button/SaveButton";
import { getCookie } from "cookies-next";
import useAuth from "../../../hooks/useAuth";
import { useRouter } from "next/navigation";
export default function ManageUsersPage() {
  const { user, loading } = useAuth();
  console.log(user);
  const router = useRouter();
  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      router.replace("/"); // Redirect non-admins
    }
  }, [user, loading]);
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const token = getCookie("token");
  const fetchUsers = async () => {
    if (!loading && (user || user.role == "admin")) {
      try {
        const res = await fetch("/api/users", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setUsers(data);
      } catch (err) {
        Swal.fire("Error", "Failed to fetch users", "error");
      }
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);
  const handleCreateUser = async () => {
    const { email, name, password } = formData;

    if (!email || !password) {
      Swal.fire("Error", "Email and Password are required", "error");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/users/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorMessage = await res.json(); // Get detailed error
        throw new Error(errorMessage.error);
      }

      await fetchUsers();
      setFormData({ email: "", name: "", password: "" });
      Swal.fire("Success", "User created", "success");
    } catch (err) {
      console.error("Error creating user:", err);
      Swal.fire("Error", "Failed to create user", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "User will be deleted permanently.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
    });

    if (confirm.isConfirmed) {
      try {
        await fetch(`/api/users/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        await fetchUsers();
        Swal.fire("Deleted!", "User has been deleted.", "success");
      } catch {
        Swal.fire("Error", "Failed to delete user", "error");
      }
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Admin: Manage Users</h2>

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
          handleSubmit={handleCreateUser}
          isLoading={isLoading}
          existingData={false}
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold mb-2">Users List</h3>
        {users?.map((user) => (
          <div
            key={user.id}
            className="flex items-center justify-between border p-3 rounded-md"
          >
            <div>
              <p className="font-semibold">{user.email}</p>
              <p className="text-sm">{user.name || "No Name"}</p>
              <p className="text-xs italic">{user.role}</p>
            </div>

            <div className="flex gap-2">
              {user.role !== "admin" && (
                <button
                  className="bg-blue-500 text-white px-2 py-1 rounded text-sm hover:bg-blue-600"
                  onClick={async () => {
                    try {
                      const res = await fetch(`/api/users/${user.id}`, {
                        method: "PUT",
                      });
                      const data = await res.json();
                      if (res.ok) {
                        Swal.fire("Success", "Promoted to admin", "success");
                        await fetchUsers();
                      } else {
                        Swal.fire(
                          "Error",
                          data.error || "Failed to promote",
                          "error"
                        );
                      }
                    } catch {
                      Swal.fire("Error", "Something went wrong", "error");
                    }
                  }}
                >
                  Promote
                </button>
              )}

              <button
                onClick={() => handleDelete(user.id)}
                className="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
