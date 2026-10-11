"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { setCookie } from "cookies-next";
import {
  AuthButton,
  AuthField,
  AuthLayout,
  AuthNotice,
} from "@components/Auth";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState(false);

  useEffect(() => {
    setCreated(new URLSearchParams(window.location.search).has("created"));
  }, []);

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch(`/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          response.status === 401
            ? "That email and password don't match an account."
            : result.error || "Couldn't sign in. Try again."
        );
      }

      // Kept for 7 days (the token's lifetime) or for 12 hours.
      setCookie("token", result.token, {
        maxAge: rememberMe ? 7 * 24 * 60 * 60 : 12 * 60 * 60,
        path: "/",
        sameSite: "lax",
      });
      window.location.replace("/");
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Welcome back. Sign in to your organization's export desk."
      footer={
        <>
          New to FarmExpo?{" "}
          <Link href="/auth/signup" className="font-semibold text-primary hover:underline">
            Create an organization account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <AuthField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={update}
          required
        />
        <AuthField
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          value={form.password}
          onChange={update}
          required
          aside={
            <Link
              href="/auth/forgot-password"
              className="text-sm font-medium text-primary hover:underline"
            >
              Forgot password?
            </Link>
          }
        />
        <label className="flex items-center gap-2.5 text-sm text-text/75">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="h-4 w-4 rounded border-text/30 accent-[rgb(var(--color-primary))]"
          />
          Keep me signed in for 7 days
        </label>
        {created && !error && (
          <AuthNotice tone="success">
            Your organization is ready. Sign in to get started.
          </AuthNotice>
        )}
        <AuthNotice>{error}</AuthNotice>
        <AuthButton loading={isLoading}>
          {isLoading ? "Signing in…" : "Sign in"}
        </AuthButton>
      </form>
    </AuthLayout>
  );
}
