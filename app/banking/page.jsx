"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LuArrowLeftRight, LuLandmark, LuPlus } from "react-icons/lu";
import axiosInstance from "@utils/axiosConfig";
import useSession from "@hooks/useSession";
import { listQueries, queryKeys } from "@hooks/queries";
import { formatMoney } from "@utils/money";
import { Button, PageHeader, Panel } from "@components/Page";
import PageLoader from "@components/Loader/PageLoader";
import BankAccountFields, { emptyBankAccount } from "@components/Forms/BankAccount";


function AccountCard({ account }) {
  return (
    <Link
      href={`/banking/${account.id}`}
      className={`block rounded-xl border border-text/10 bg-surface p-5 transition-colors hover:border-primary/40 hover:bg-primary/[0.03] ${
        account.active ? "" : "opacity-70"
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <LuLandmark className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-text">{account.bankName}</p>
          <p className="truncate text-sm text-text/60">{account.accountTitle}</p>
          <p className="truncate text-sm tabular text-text/60">{account.accountNumber}</p>
        </div>
        {!account.active && (
          <span className="rounded-full bg-text/10 px-2 py-0.5 text-xs font-medium text-text/60">Closed</span>
        )}
      </div>
      <p className="mt-4 text-xs text-text/55">Balance</p>
      <p className={`font-display text-2xl font-semibold tabular ${account.balance < 0 ? "text-red-600" : "text-text"}`}>
        {formatMoney(account.balance, account.currency, { decimals: 2 })}
      </p>
      <div className="mt-2 flex flex-wrap gap-x-4 text-xs tabular text-text/60">
        <span>In {formatMoney(account.moneyIn, account.currency)}</span>
        <span>Out {formatMoney(account.moneyOut, account.currency)}</span>
        <span>
          {account._count?.transactions || 0} entr{account._count?.transactions === 1 ? "y" : "ies"}
        </span>
      </div>
    </Link>
  );
}

export default function BankingPage() {
  const queryClient = useQueryClient();
  const { currency } = useSession();
  const { data: accounts = [], isLoading } = useQuery(listQueries.bankAccounts);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(() => emptyBankAccount());
  const [error, setError] = useState("");

  const create = useMutation({
    mutationFn: async (payload) => (await axiosInstance.post("/bank-accounts", payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bankAccounts });
      setAdding(false);
      setForm(emptyBankAccount(currency));
    },
    onError: (err) => setError(err.message),
  });

  const startAdding = () => {
    setError("");
    setForm((f) => ({ ...f, currency: f.currency || currency }));
    setAdding(true);
  };

  const submit = (e) => {
    e.preventDefault();
    setError("");
    create.mutate(form);
  };

  if (isLoading) return <PageLoader label="Loading bank accounts…" variant="cards" />;

  // Totals per currency: accounts in different currencies don't add up.
  const byCurrency = accounts
    .filter((a) => a.active)
    .reduce((totals, a) => ({ ...totals, [a.currency]: (totals[a.currency] || 0) + a.balance }), {});

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-8 sm:py-10">
      <PageHeader
        title="Banking"
        description="Your bank accounts, kept by hand. Choose an account when you record a payment, and its balance and statement follow."
        actions={
          <>
            <Link
              href="/transactions"
              className="inline-flex items-center gap-2 rounded-lg border border-text/15 bg-surface px-4 py-2 text-sm font-semibold text-text hover:bg-text/5"
            >
              <LuArrowLeftRight className="h-4 w-4" /> Transactions
            </Link>
            {!adding && (
              <Button onClick={startAdding}>
                <LuPlus className="h-4 w-4" /> Add bank account
              </Button>
            )}
          </>
        }
      />

      {adding && (
        <form onSubmit={submit}>
          <Panel
            title="New bank account"
            footer={
              <>
                {error && <p role="alert" className="mr-auto text-sm text-red-600">{error}</p>}
                <Button variant="secondary" onClick={() => setAdding(false)} disabled={create.isPending}>
                  Cancel
                </Button>
                <Button type="submit" loading={create.isPending}>Save account</Button>
              </>
            }
          >
            <BankAccountFields form={form} setForm={setForm} idPrefix="new-bank" />
          </Panel>
        </form>
      )}

      {Object.keys(byCurrency).length > 0 && (
        <div className="flex flex-wrap gap-3">
          {Object.entries(byCurrency).map(([code, total]) => (
            <div key={code} className="rounded-xl border border-text/10 bg-surface px-4 py-3">
              <p className="text-xs text-text/55">In all {code} accounts</p>
              <p className="font-display text-xl font-semibold tabular text-text">
                {formatMoney(total, code, { decimals: 2 })}
              </p>
            </div>
          ))}
        </div>
      )}

      {accounts.length === 0 ? (
        !adding && (
          <div className="rounded-xl border border-dashed border-text/20 px-6 py-14 text-center">
            <LuLandmark className="mx-auto h-8 w-8 text-text/35" />
            <p className="mt-3 font-semibold text-text">No bank accounts yet</p>
            <p className="mt-1 text-sm text-text/60">
              Add the accounts payments go through, then pick one when you record a transaction.
            </p>
            <Button className="mt-5" onClick={startAdding}>
              <LuPlus className="h-4 w-4" /> Add bank account
            </Button>
          </div>
        )
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
        </div>
      )}
    </div>
  );
}
