"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import fonts from "@utils/fonts";

export default function VendorsTransactionsPage() {
  const {
    data: vendors = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["vendors-list"],
    queryFn: async () => {
      const res = await fetch("/api/vendors/transactions");
      if (!res.ok) throw new Error("Failed to load vendors");
      return res.json();
    },
    staleTime: 1000 * 60 * 2,
  });

  if (isError) {
    return <div className="p-8 text-red-600">Failed to load vendors.</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <header className="flex items-center justify-between mb-12">
        <h1 className={`${fonts.montserrat.className} text-3xl`}>
          Vendors & Balances
        </h1>
        <p className="text-sm text-gray-500">
          Click a vendor to view transactions
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {vendors.map((v) => (
          <Link
            key={v.id}
            href={`/vendor/transaction/${v.id}`}
            className="block p-4 rounded-lg border shadow-sm hover:bg-gray-200  transition bg-white dark:bg-gray-800"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg ">{v.name}</h2>
                <p className="text-sm text-gray-500">
                  {v._count?.transactions ?? 0} transactions
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Balance</div>
                <div className=" number-font">
                  {v.currency} {Number(v.balance || 0).toLocaleString()}
                </div>
              </div>
            </div>
            <div className="mt-3 text-sm text-gray-600">View full ledger →</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
