"use client";

import { useEffect, useState } from "react";
import { getCookie, deleteCookie } from "cookies-next";
import jwt from "jsonwebtoken";
import { useRouter } from "next/navigation";

export default function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = getCookie("token");
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const decoded = jwt.decode(token);
      const now = Date.now() / 1000;

      if (decoded.exp < now) {
        // Token expired
        deleteCookie("token");
        setUser(null);
        router.replace("/auth/login");
      } else {
        setUser(decoded);
      }
    } catch (err) {
      deleteCookie("token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  return { user, loading };
}
