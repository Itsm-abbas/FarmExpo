"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AuthButton,
  AuthField,
  AuthLayout,
  AuthNotice,
} from "@components/Auth";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const response = await fetch(`/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Couldn't send the link. Try again.");
      setSent(result.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter the email you sign in with and we'll send you a link to choose a new password."
      footer={
        <Link href="/auth/login" className="font-semibold text-primary hover:underline">
          Back to sign in
        </Link>
      }
    >
      {sent ? (
        <div className="space-y-4">
          <AuthNotice tone="success">{sent}</AuthNotice>
          <p className="text-sm leading-relaxed text-text/65">
            The link works for one hour. Can't find it? Check your spam folder,
            or ask an admin in your organization to set a new password for you
            from Team.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <AuthField
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <AuthNotice>{error}</AuthNotice>
          <AuthButton loading={isLoading}>
            {isLoading ? "Sending…" : "Send reset link"}
          </AuthButton>
        </form>
      )}
    </AuthLayout>
  );
}
