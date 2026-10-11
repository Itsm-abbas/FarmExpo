"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { deleteCookie } from "cookies-next";
import { useQueryClient } from "@tanstack/react-query";
import {
  LuBookOpen,
  LuBoxes,
  LuBuilding2,
  LuChevronsUpDown,
  LuHandshake,
  LuLandmark,
  LuLayoutDashboard,
  LuLogOut,
  LuMenu,
  LuPackage,
  LuPlane,
  LuSettings,
  LuSprout,
  LuStamp,
  LuUser,
  LuUserCog,
  LuWarehouse,
  LuX,
} from "react-icons/lu";
import useSession from "@hooks/useSession";
import { AppearancePicker } from "@components/Theme";

const NAV = [
  {
    items: [
      { label: "Dashboard", href: "/", icon: LuLayoutDashboard, exact: true },
      {
        label: "Consignments",
        href: "/consignment/all-consignments",
        icon: LuPackage,
        match: ["/consignment/all-consignments", "/startconsignment", "/items-selection", "/invoice"],
      },
      {
        label: "Ledgers",
        href: "/vendors/transactions",
        icon: LuBookOpen,
        match: ["/vendors", "/vendor/"],
      },
    ],
  },
  {
    title: "Partners",
    items: [
      { label: "Consignees", href: "/consignment/consignee/view-consignee", icon: LuBuilding2, match: ["/consignment/consignee/"] },
      { label: "Traders", href: "/consignment/trader/view-trader", icon: LuHandshake, match: ["/consignment/trader/"] },
      { label: "Packers", href: "/consignment/packer/view-packer", icon: LuWarehouse, match: ["/consignment/packer/"] },
      { label: "IATA agents", href: "/consignment/iata-agent/view-iataAgent", icon: LuPlane, match: ["/consignment/iata-agent/"] },
      { label: "Custom agents", href: "/consignment/custom-agent/view-customAgent", icon: LuStamp, match: ["/consignment/custom-agent/"] },
    ],
  },
  {
    title: "Catalog",
    items: [
      { label: "Commodities", href: "/consignment/commodity/view-commodity", icon: LuSprout, match: ["/consignment/commodity/"] },
      { label: "Packaging", href: "/consignment/packaging/view-packaging", icon: LuBoxes, match: ["/consignment/packaging/"] },
    ],
  },
  {
    title: "Finance",
    items: [
      {
        label: "Financial instruments",
        href: "/consignment/view-financial-instrument",
        icon: LuLandmark,
        match: ["/consignment/view-financial-instrument", "/consignment/add-financialinstrument"],
      },
    ],
  },
  {
    title: "Organization",
    adminOnly: true,
    items: [
      { label: "Team", href: "/admin/manage-users", icon: LuUserCog, match: ["/admin/"] },
      { label: "Organization settings", href: "/settings/organization", icon: LuSettings, match: ["/settings/"] },
    ],
  },
];

const isActive = (item, pathname) =>
  item.exact
    ? pathname === item.href
    : (item.match || [item.href]).some((prefix) => pathname.startsWith(prefix));

const initials = (text = "") =>
  text
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("") || "F";

// The organization's logo, or its initials on the brand color.
export function OrgMark({ organization, className = "h-9 w-9" }) {
  if (organization?.logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={organization.logoUrl}
        alt=""
        className={`${className} shrink-0 rounded-lg bg-surface object-contain`}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={`${className} grid shrink-0 place-items-center rounded-lg bg-primary font-display text-sm font-bold text-white`}
    >
      {initials(organization?.name || "FarmExpo")}
    </span>
  );
}

function NavLinks({ isAdmin, pathname, onNavigate }) {
  return (
    <nav aria-label="Main" className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
      {NAV.filter((section) => !section.adminOnly || isAdmin).map((section, i) => (
        <div key={section.title || i}>
          {section.title && (
            <p className="mb-1.5 px-3 text-xs font-medium text-text/50">
              {section.title}
            </p>
          )}
          <ul className="space-y-0.5">
            {section.items.map((item) => {
              const active = isActive(item, pathname);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                      active
                        ? "bg-primary/10 font-semibold text-primary"
                        : "text-text/75 hover:bg-text/5 hover:text-text"
                    }`}
                  >
                    <Icon
                      className={`h-[18px] w-[18px] shrink-0 ${
                        active ? "text-primary" : "text-text/45 group-hover:text-text/70"
                      }`}
                    />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function AccountMenu({ user, isAdmin }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const signOut = async () => {
    setOpen(false);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    deleteCookie("token");
    queryClient.clear();
    router.replace("/auth/login");
  };

  return (
    <div ref={ref} className="relative border-t border-text/10 p-3">
      {open && (
        <div
          role="menu"
          className="absolute bottom-full left-3 right-3 mb-2 rounded-xl border border-text/10 bg-surface p-2 shadow-xl"
        >
          <div className="px-2 pb-2 pt-1">
            <p className="truncate text-sm font-semibold text-text">
              {user?.name || "Your account"}
            </p>
            <p className="truncate text-xs text-text/60">{user?.email}</p>
          </div>
          <Link
            href="/profile"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-text/80 hover:bg-text/5 hover:text-text"
          >
            <LuUser className="h-4 w-4" /> Your profile
          </Link>
          {isAdmin && (
            <Link
              href="/settings/organization"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-text/80 hover:bg-text/5 hover:text-text"
            >
              <LuSettings className="h-4 w-4" /> Organization settings
            </Link>
          )}
          <div className="my-2 border-t border-text/10 px-2 pt-3">
            <p className="mb-2 text-xs font-medium text-text/50">Appearance</p>
            <AppearancePicker />
          </div>
          <button
            role="menuitem"
            onClick={signOut}
            className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-red-600 hover:bg-red-500/10"
          >
            <LuLogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-text/5"
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-text/10 text-xs font-semibold text-text">
          {initials(user?.name || user?.email)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-text">
            {user?.name || user?.email || "…"}
          </span>
          <span className="block text-xs text-text/55">
            {isAdmin ? "Admin" : "Staff"}
          </span>
        </span>
        <LuChevronsUpDown className="h-4 w-4 text-text/40" />
      </button>
    </div>
  );
}

function SidebarContent({ onNavigate, onClose }) {
  const pathname = usePathname();
  const { user, organization, isAdmin } = useSession();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-5 pb-2 pt-5">
        <Link href="/" onClick={onNavigate} className="flex min-w-0 flex-1 items-center gap-3">
          <OrgMark organization={organization} />
          <span className="min-w-0">
            <span className="block truncate font-display text-[15px] font-bold leading-tight text-text">
              {organization?.name || "FarmExpo"}
            </span>
            <span className="block text-xs text-text/50">Export desk</span>
          </span>
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="grid h-8 w-8 place-items-center rounded-lg text-text/60 hover:bg-text/5"
          >
            <LuX className="h-5 w-5" />
          </button>
        )}
      </div>
      <NavLinks isAdmin={isAdmin} pathname={pathname} onNavigate={onNavigate} />
      <AccountMenu user={user} isAdmin={isAdmin} />
    </div>
  );
}

export default function AppShell({ children }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();
  const { organization } = useSession();

  useEffect(() => setDrawerOpen(false), [pathname]);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-text/10 bg-surface lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-text/10 bg-surface/95 px-4 py-3 backdrop-blur lg:hidden">
        <button
          onClick={() => setDrawerOpen(true)}
          aria-label="Open menu"
          className="grid h-9 w-9 place-items-center rounded-lg text-text hover:bg-text/5"
        >
          <LuMenu className="h-5 w-5" />
        </button>
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <OrgMark organization={organization} className="h-8 w-8" />
          <span className="truncate font-display font-bold text-text">
            {organization?.name || "FarmExpo"}
          </span>
        </Link>
      </header>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-surface shadow-2xl">
            <SidebarContent
              onNavigate={() => setDrawerOpen(false)}
              onClose={() => setDrawerOpen(false)}
            />
          </aside>
        </div>
      )}

      <main className="lg:pl-64">{children}</main>
    </div>
  );
}
