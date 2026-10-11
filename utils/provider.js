// utils/provider.js
"use client";

import AppShell from "@components/Shell";
import { ThemeController } from "@components/Theme";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

// Data counts as fresh for 30 seconds, so moving between pages reuses it
// instead of fetching it again; saves refresh exactly what they change.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      refetchOnWindowFocus: false,
      // One retry for network or server errors; "not found" or "not allowed"
      // won't change on a second try.
      retry: (failureCount, error) => {
        const status = error?.response?.status ?? error?.status;
        return failureCount < 1 && !(status >= 400 && status < 500);
      },
    },
  },
});

// The mouse wheel changes a focused number field's value, so scrolling a form
// could silently alter a price or weight. Blurring the field first stops it.
function useNoWheelOnNumberInputs() {
  useEffect(() => {
    const onWheel = (e) => {
      const el = document.activeElement;
      if (el?.type === "number" && el === e.target) el.blur();
    };
    document.addEventListener("wheel", onWheel, { passive: true });
    return () => document.removeEventListener("wheel", onWheel);
  }, []);
}

export default function Providers({ children }) {
  useNoWheelOnNumberInputs();
  const pathname = usePathname();
  // Sign-in pages are shown without the app chrome.
  const bare = pathname.startsWith("/auth/");

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeController />
      {bare ? children : <AppShell>{children}</AppShell>}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
