"use client";

import Header from "@components/Header";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { usePathname } from "next/navigation";

const queryClient = new QueryClient();

export default function Providers({ children }) {
  const pathname = usePathname();
  const isInvoiceRoute = /^\/invoice\/\d+$/.test(pathname); // Matches /invoice/{id}

  const noHeaderRoutes = ["/auth/login", "/auth/signup"];

  // Header should not show on /auth/login, /auth/signup, or any /invoice/{id} route
  const showHeader = !noHeaderRoutes.includes(pathname) && !isInvoiceRoute;

  return (
    <QueryClientProvider client={queryClient}>
      {showHeader && <Header />}
      <div className="px-5 sm:px-8 md:px-16">{children}</div>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
