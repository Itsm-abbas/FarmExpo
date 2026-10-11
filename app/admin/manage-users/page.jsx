"use client";

import { useState } from "react";
import Swal from "sweetalert2";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LuKeyRound, LuShieldCheck, LuTrash2, LuUser } from "react-icons/lu";
import useSession from "@hooks/useSession";
import { Button, Field, PageHeader, Panel, inputClass } from "@components/Page";
import PageLoader from "@components/Loader/PageLoader";

const swalTheme = {
  background: "rgb(var(--color-surface))",
  color: "rgb(var(--color-text))",
  confirmButtonColor: "rgb(var(--color-primary))",
};

const ROLES = {
  user: {
    label: "Staff",
    description:
      "Creates and edits consignments, partners and ledger entries. Can't delete records, correct posted ledger entries, manage the team or change organization settings.",
  },
  admin: {
    label: "Admin",
    description:
      "Everything staff can do, plus deleting records, correcting the ledger, managing the team and organization settings.",
  },
};

async function api(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof body.error === "string" ? body.error : "Something went wrong");
  }
  return body;
}

const EMPTY_FORM = { name: "", email: "", password: "", role: "user" };

export default function TeamPage() {
  const queryClient = useQueryClient();
  const { user, isAdmin, organization, isLoading: sessionLoading } = useSession();
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => api("/api/users"),
    enabled: isAdmin,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["users"] });
  const notify = (title) =>
    Swal.fire({ ...swalTheme, icon: "success", title, timer: 1400, showConfirmButton: false });
  const fail = (err) => Swal.fire({ ...swalTheme, icon: "error", title: "That didn't work", text: err.message });

  const addMember = useMutation({
    mutationFn: (data) => api("/api/users/create", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      refresh();
      setForm(EMPTY_FORM);
      notify("Team member added");
    },
    onError: (err) => setFormError(err.message),
  });

  const changeRole = useMutation({
    mutationFn: ({ id, role }) => api(`/api/users/${id}?role=${role}`, { method: "PUT" }),
    onSuccess: (res) => {
      refresh();
      notify(res.message);
    },
    onError: fail,
  });

  const removeMember = useMutation({
    mutationFn: (id) => api(`/api/users/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      refresh();
      notify("Removed from the team");
    },
    onError: fail,
  });

  const setPassword = useMutation({
    mutationFn: ({ id, password }) =>
      api(`/api/users/${id}/password`, { method: "POST", body: JSON.stringify({ password }) }),
    onSuccess: () => notify("Password updated"),
    onError: fail,
  });

  const submit = (e) => {
    e.preventDefault();
    setFormError("");
    if (!form.email.trim() || form.password.length < 6) {
      return setFormError("Enter an email and a password of at least 6 characters.");
    }
    addMember.mutate(form);
  };

  const confirmRemove = async (member) => {
    const { isConfirmed } = await Swal.fire({
      ...swalTheme,
      icon: "warning",
      title: `Remove ${member.name || member.email}?`,
      text: "They won't be able to sign in. Everything they recorded stays with the organization.",
      showCancelButton: true,
      confirmButtonText: "Remove",
      confirmButtonColor: "#dc2626",
    });
    if (isConfirmed) removeMember.mutate(member.id);
  };

  const promptPassword = async (member) => {
    const { value: password } = await Swal.fire({
      ...swalTheme,
      title: `New password for ${member.name || member.email}`,
      text: "They'll be signed out and can sign in with this password. Share it with them privately.",
      input: "password",
      inputPlaceholder: "At least 6 characters",
      inputAttributes: { autocomplete: "new-password" },
      showCancelButton: true,
      confirmButtonText: "Set password",
      inputValidator: (v) => (!v || v.length < 6 ? "Use at least 6 characters" : undefined),
    });
    if (password) setPassword.mutate({ id: member.id, password });
  };

  if (sessionLoading) return <PageLoader label="Loading your team…" />;

  if (user && !isAdmin) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-8">
        <PageHeader title="Team" description="Only an admin can manage the team." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-8 sm:py-10">
      <PageHeader
        title="Team"
        description={`People who work in ${organization?.name || "your organization"}. Everyone here shares the same consignments, partners and ledgers.`}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <Panel title="Add a team member">
          <form onSubmit={submit} className="space-y-4" noValidate>
            <Field label="Name" htmlFor="name">
              <input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Email" htmlFor="email">
              <input id="email" type="email" autoComplete="off" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Temporary password" htmlFor="password" hint="Share it with them; they can change it from their profile.">
              <input id="password" type="password" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputClass} />
            </Field>
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-text">Access</legend>
              <div className="space-y-2">
                {Object.entries(ROLES).map(([role, info]) => (
                  <label
                    key={role}
                    className={`flex cursor-pointer gap-3 rounded-lg border p-3 transition-colors ${
                      form.role === role ? "border-primary bg-primary/5" : "border-text/15 hover:border-text/30"
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={role}
                      checked={form.role === role}
                      onChange={() => setForm({ ...form, role })}
                      className="mt-1 accent-[rgb(var(--color-primary))]"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-text">{info.label}</span>
                      <span className="block text-xs leading-relaxed text-text/60">{info.description}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            {formError && (
              <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
                {formError}
              </p>
            )}
            <Button type="submit" loading={addMember.isPending} className="w-full">
              Add to team
            </Button>
          </form>
        </Panel>

        <Panel title={`Members${members.length ? ` (${members.length})` : ""}`}>
          {isLoading ? (
            <p className="text-sm text-text/60">Loading the team…</p>
          ) : (
            <ul className="-my-2 divide-y divide-text/10">
              {members.map((m) => (
                <li key={m.id} className="flex flex-wrap items-center gap-3 py-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-text/10 text-text/70">
                    {m.role === "admin" ? <LuShieldCheck className="h-4 w-4" /> : <LuUser className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-text">
                      {m.name || m.email}
                      {m.isYou && <span className="ml-2 font-normal text-text/50">(you)</span>}
                    </p>
                    <p className="truncate text-xs text-text/55">{m.email}</p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      m.role === "admin" ? "bg-primary/10 text-primary" : "bg-text/10 text-text/70"
                    }`}
                  >
                    {ROLES[m.role]?.label || m.role}
                  </span>
                  {!m.isYou && (
                    <div className="-ml-2.5 flex basis-full flex-wrap items-center gap-1 pl-12">
                      <Button
                        variant="ghost"
                        className="px-2.5 py-1.5 text-xs"
                        onClick={() => changeRole.mutate({ id: m.id, role: m.role === "admin" ? "user" : "admin" })}
                      >
                        {m.role === "admin" ? "Make staff" : "Make admin"}
                      </Button>
                      <Button variant="ghost" className="px-2.5 py-1.5" title="Set a new password" aria-label={`Set a new password for ${m.name || m.email}`} onClick={() => promptPassword(m)}>
                        <LuKeyRound className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" className="px-2.5 py-1.5 text-red-600 hover:bg-red-500/10 hover:text-red-700" title="Remove from team" aria-label={`Remove ${m.name || m.email}`} onClick={() => confirmRemove(m)}>
                        <LuTrash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
