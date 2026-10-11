"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AuthButton,
  AuthField,
  AuthLayout,
  AuthNotice,
} from "@components/Auth";

// Creates a new organization with you as its admin. Staff don't sign up here:
// an admin adds them from Team, and they share the organization's data.
export default function Signup() {
  const router = useRouter();
  const [form, setForm] = useState({
    organizationName: "",
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.organizationName.trim() || !form.name.trim() || !form.email.trim()) {
      return setError("Fill in your organization, name and email.");
    }
    if (form.password.length < 6) {
      return setError("Choose a password of at least 6 characters.");
    }
    if (form.password !== form.confirmPassword) {
      return setError("The two passwords don't match.");
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationName: form.organizationName,
          name: form.name,
          email: form.email,
          password: form.password,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          typeof result.error === "string"
            ? result.error
            : "Couldn't create the account. Try again."
        );
      }
      router.push("/auth/login?created=1");
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create your organization"
      subtitle="You'll be its admin. Add your team once you're in."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/auth/login" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <AuthField
          id="organizationName"
          label="Organization name"
          autoComplete="organization"
          placeholder="e.g. Green Valley Exports"
          value={form.organizationName}
          onChange={update}
          required
        />
        <AuthField
          id="name"
          label="Your name"
          autoComplete="name"
          value={form.name}
          onChange={update}
          required
        />
        <AuthField
          id="email"
          label="Work email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={update}
          required
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <AuthField
            id="password"
            label="Password"
            type="password"
            autoComplete="new-password"
            hint="At least 6 characters"
            value={form.password}
            onChange={update}
            required
          />
          <AuthField
            id="confirmPassword"
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={update}
            required
          />
        </div>
        <AuthNotice>{error}</AuthNotice>
        <AuthButton loading={isLoading}>
          {isLoading ? "Creating account…" : "Create account"}
        </AuthButton>
      </form>
    </AuthLayout>
  );
}
