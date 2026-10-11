"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import useSession, { SESSION_QUERY_KEY } from "@hooks/useSession";
import { Button, Field, PageHeader, Panel, inputClass } from "@components/Page";
import PageLoader from "@components/Loader/PageLoader";

const EMPTY_PASSWORDS = { currentPassword: "", newPassword: "", confirmPassword: "" };

function Message({ message }) {
  if (!message) return null;
  return (
    <p
      role={message.tone === "error" ? "alert" : "status"}
      className={`mr-auto text-sm ${message.tone === "error" ? "text-red-600" : "text-primary"}`}
    >
      {message.text}
    </p>
  );
}

async function updateProfile(data) {
  const res = await fetch("/api/profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || "Couldn't save the changes.");
  return body;
}

export default function ProfileSettings() {
  const queryClient = useQueryClient();
  const { user, organization, isAdmin, isLoading } = useSession();
  const [details, setDetails] = useState({ name: "", email: "" });
  const [detailsFor, setDetailsFor] = useState(null);
  const [passwords, setPasswords] = useState(EMPTY_PASSWORDS);
  const [saving, setSaving] = useState(null);
  const [detailsMessage, setDetailsMessage] = useState(null);
  const [passwordMessage, setPasswordMessage] = useState(null);

  // Filled in during render (not in an effect), so the form never shows
  // empty for a moment; refilled when the saved profile changes.
  if (user && detailsFor !== user) {
    setDetailsFor(user);
    setDetails({ name: user.name || "", email: user.email || "" });
  }

  const saveDetails = async (e) => {
    e.preventDefault();
    setDetailsMessage(null);
    if (!/\S+@\S+\.\S+/.test(details.email)) {
      return setDetailsMessage({ tone: "error", text: "Enter a valid email." });
    }
    setSaving("details");
    try {
      await updateProfile(details);
      await queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
      setDetailsMessage({ tone: "success", text: "Profile saved." });
    } catch (err) {
      setDetailsMessage({ tone: "error", text: err.message });
    } finally {
      setSaving(null);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setPasswordMessage(null);
    if (passwords.newPassword.length < 6) {
      return setPasswordMessage({ tone: "error", text: "Use at least 6 characters." });
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      return setPasswordMessage({ tone: "error", text: "The new passwords don't match." });
    }
    setSaving("password");
    try {
      await updateProfile({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      setPasswords(EMPTY_PASSWORDS);
      setPasswordMessage({
        tone: "success",
        text: "Password changed. Other devices have been signed out.",
      });
    } catch (err) {
      setPasswordMessage({ tone: "error", text: err.message });
    } finally {
      setSaving(null);
    }
  };

  if (isLoading) return <PageLoader label="Loading your profile…" />;

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-8 sm:py-10">
      <PageHeader
        title="Your profile"
        description={
          user
            ? `${isAdmin ? "Admin" : "Staff"} at ${organization?.name || "your organization"}`
            : undefined
        }
      />

      <form onSubmit={saveDetails}>
        <Panel
          title="Details"
          footer={
            <>
              <Message message={detailsMessage} />
              <Button type="submit" loading={saving === "details"}>Save profile</Button>
            </>
          }
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Name" htmlFor="name">
              <input id="name" value={details.name} onChange={(e) => setDetails({ ...details, name: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Email" htmlFor="email" hint="You sign in with this.">
              <input id="email" type="email" value={details.email} onChange={(e) => setDetails({ ...details, email: e.target.value })} className={inputClass} />
            </Field>
          </div>
        </Panel>
      </form>

      <form onSubmit={savePassword}>
        <Panel
          title="Password"
          description="Changing it signs you out on your other devices."
          footer={
            <>
              <Message message={passwordMessage} />
              <Button type="submit" loading={saving === "password"}>Change password</Button>
            </>
          }
        >
          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="Current password" htmlFor="currentPassword">
              <input id="currentPassword" type="password" autoComplete="current-password" value={passwords.currentPassword} onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} className={inputClass} />
            </Field>
            <Field label="New password" htmlFor="newPassword">
              <input id="newPassword" type="password" autoComplete="new-password" value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Confirm new password" htmlFor="confirmPassword">
              <input id="confirmPassword" type="password" autoComplete="new-password" value={passwords.confirmPassword} onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })} className={inputClass} />
            </Field>
          </div>
        </Panel>
      </form>
    </div>
  );
}
