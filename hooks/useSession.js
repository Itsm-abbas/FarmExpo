"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCookie } from "cookies-next";

export const SESSION_QUERY_KEY = ["me"];

async function fetchMe() {
  // Plain fetch, not axiosInstance: a 401 here just means "signed out" and
  // must not trigger the session-expired redirect (e.g. on the login page).
  const res = await fetch("/api/me");
  if (res.status === 401) return null;
  if (!res.ok) throw new Error("Failed to load your account");
  return res.json();
}

// The signed-in user, their organization and role permissions.
export default function useSession() {
  // Read the cookie only after mounting, so the first render in the browser
  // matches the server's (which can't see it) and hydration doesn't fail.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const signedIn = mounted && Boolean(getCookie("token"));
  const { data: me, isLoading } = useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: fetchMe,
    enabled: signedIn,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const permissions = me?.permissions || {};
  return {
    user: me || null,
    organization: me?.organization || null,
    permissions,
    isAdmin: me?.role === "admin",
    // Organization currency for costs, invoices and new vendors.
    currency: me?.organization?.baseCurrency || "PKR",
    // Also true before mounting, while the cookie hasn't been read yet.
    isLoading: !mounted || (signedIn && isLoading),
  };
}
