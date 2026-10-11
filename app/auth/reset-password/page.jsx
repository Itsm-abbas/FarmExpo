"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { deleteCookie } from "cookies-next";
import {
  AuthButton,
  AuthField,
  AuthLayout,
  AuthNotice,
} from "@components/Auth";

function ResetPasswordForm() {
  const token = useSearchParams().get("token") || "";
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password.length < 6) {
      return setError("Choose a password of at least 6 characters.");
    }
    if (form.password !== form.confirmPassword) {
      return setError("The two passwords don't match.");
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: form.password }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Couldn't reset the password.");
      // Every session of this account was signed out, this browser's too.
      deleteCookie("token");
      setDone(result.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="space-y-4">
        <AuthNotice>This page needs the link from your reset email.</AuthNotice>
        <Link href="/auth/forgot-password" className="text-sm font-semibold text-primary hover:underline">
          Request a new link
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="space-y-5">
        <AuthNotice tone="success">{done}</AuthNotice>
        <Link
          href="/auth/login"
          className="flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-[15px] font-semibold text-white hover:bg-accent"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <AuthField
        id="password"
        label="New password"
        type="password"
        autoComplete="new-password"
        hint="At least 6 characters"
        value={form.password}
        onChange={update}
        required
      />
      <AuthField
        id="confirmPassword"
        label="Confirm new password"
        type="password"
        autoComplete="new-password"
        value={form.confirmPassword}
        onChange={update}
        required
      />
      <AuthNotice>{error}</AuthNotice>
      <AuthButton loading={isLoading}>
        {isLoading ? "Saving…" : "Set new password"}
      </AuthButton>
    </form>
  );
}

export default function ResetPassword() {
  return (
    <AuthLayout
      title="Choose a new password"
      subtitle="You'll be signed out everywhere and can sign in with the new one."
      footer={
        <Link href="/auth/login" className="font-semibold text-primary hover:underline">
          Back to sign in
        </Link>
      }
    >
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </AuthLayout>
  );
}
