"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { deleteCookie } from "cookies-next";
import { useQueryClient } from "@tanstack/react-query";
import {
  LuArrowLeftRight,
  LuBookOpen,
  LuBoxes,
  LuBuilding2,
  LuChartLine,
  LuChevronsUpDown,
  LuHandshake,
  LuLandmark,
  LuLayoutDashboard,
  LuLogOut,
  LuMenu,
  LuPackage,
  LuPanelLeftClose,
  LuPanelLeftOpen,
  LuPlane,
  LuSettings,
  LuShoppingBasket,
  LuSprout,
  LuStamp,
  LuUser,
  LuUserCog,
  LuWallet,
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
    title: "Buying",
    items: [
      { label: "Purchases", href: "/purchases", icon: LuShoppingBasket, exact: true },
      { label: "Daily price list", href: "/purchases/daily-prices", icon: LuChartLine },
    ],
  },
  {
    title: "Partners",
    items: [
      { label: "Consignees", href: "/consignment/consignee/view-consignee", icon: LuBuilding2, match: ["/consignment/consignee/"] },
      { label: "Traders & farmers", href: "/consignment/trader/view-trader", icon: LuHandshake, match: ["/consignment/trader/"] },
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
      { label: "Banking", href: "/banking", icon: LuWallet },
      { label: "Transactions", href: "/transactions", icon: LuArrowLeftRight },
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

// `collapsed`: icons only (the label shows as a tooltip).
function NavLinks({ isAdmin, pathname, onNavigate, collapsed = false }) {
  return (
    <nav aria-label="Main" className={`thin-scroll flex-1 overflow-y-auto overflow-x-hidden py-4 ${collapsed ? "space-y-3 px-2" : "space-y-6 px-3"}`}>
      {NAV.filter((section) => !section.adminOnly || isAdmin).map((section, i) => (
        <div key={section.title || i}>
          {section.title &&
            (collapsed ? (
              <div aria-hidden="true" className="mx-2 mb-3 border-t border-text/10" />
            ) : (
              <p className="mb-1.5 px-3 text-xs font-medium text-text/50">
                {section.title}
              </p>
            ))}
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
                    title={collapsed ? item.label : undefined}
                    aria-label={collapsed ? item.label : undefined}
                    className={`group flex items-center gap-3 rounded-lg py-2 text-sm transition-colors ${
                      collapsed ? "justify-center px-0" : "px-3"
                    } ${
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
                    {!collapsed && item.label}
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

function AccountMenu({ user, isAdmin, collapsed = false }) {
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
    <div ref={ref} className={`relative border-t border-text/10 ${collapsed ? "p-2" : "p-3"}`}>
      {open && (
        <div
          role="menu"
          className={`absolute bottom-full mb-2 rounded-xl border border-text/10 bg-surface p-2 shadow-xl ${
            collapsed ? "left-2 w-60" : "left-3 right-3"
          }`}
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
        aria-label={collapsed ? "Account menu" : undefined}
        title={collapsed ? user?.name || user?.email : undefined}
        className={`flex w-full items-center gap-3 rounded-lg py-2 text-left hover:bg-text/5 ${collapsed ? "justify-center px-0" : "px-2"}`}
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-text/10 text-xs font-semibold text-text">
          {initials(user?.name || user?.email)}
        </span>
        {!collapsed && (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-text">
                {user?.name || user?.email || "…"}
              </span>
              <span className="block text-xs text-text/55">
                {isAdmin ? "Admin" : "Staff"}
              </span>
            </span>
            <LuChevronsUpDown className="h-4 w-4 text-text/40" />
          </>
        )}
      </button>
    </div>
  );
}

// `onToggle` (desktop): shows the button that collapses or expands the sidebar.
function SidebarContent({ onNavigate, onClose, collapsed = false, onToggle }) {
  const pathname = usePathname();
  const { user, organization, isAdmin } = useSession();

  if (collapsed) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex flex-col items-center gap-3 px-2 pb-2 pt-5">
          <Link href="/" title={organization?.name || "FarmExpo"} aria-label="Dashboard">
            <OrgMark organization={organization} />
          </Link>
          <button
            onClick={onToggle}
            aria-label="Expand sidebar"
            title="Expand sidebar (Ctrl+B)"
            className="grid h-8 w-8 place-items-center rounded-lg text-text/60 hover:bg-text/5 hover:text-text"
          >
            <LuPanelLeftOpen className="h-[18px] w-[18px]" />
          </button>
        </div>
        <NavLinks isAdmin={isAdmin} pathname={pathname} collapsed />
        <AccountMenu user={user} isAdmin={isAdmin} collapsed />
      </div>
    );
  }

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
        {onToggle && (
          <button
            onClick={onToggle}
            aria-label="Collapse sidebar"
            title="Collapse sidebar (Ctrl+B)"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-text/60 hover:bg-text/5 hover:text-text"
          >
            <LuPanelLeftClose className="h-[18px] w-[18px]" />
          </button>
        )}
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

const COLLAPSED_KEY = "sidebarCollapsed";

export default function AppShell({ children }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  // Desktop sidebar narrowed to icons; remembered on this device.
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { organization } = useSession();

  useEffect(() => setDrawerOpen(false), [pathname]);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSED_KEY) === "1");
    } catch {}
  }, []);
  const toggleCollapsed = () =>
    setCollapsed((value) => {
      try {
        localStorage.setItem(COLLAPSED_KEY, value ? "0" : "1");
      } catch {}
      return !value;
    });

  // Ctrl+B (Cmd+B on Mac) collapses or expands the sidebar.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleCollapsed();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden border-r border-text/10 bg-surface transition-[width] duration-200 lg:block ${
          collapsed ? "w-16" : "w-64"
        }`}
      >
        <SidebarContent collapsed={collapsed} onToggle={toggleCollapsed} />
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

      <main className={`transition-[padding] duration-200 ${collapsed ? "lg:pl-16" : "lg:pl-64"}`}>{children}</main>
    </div>
  );
}
