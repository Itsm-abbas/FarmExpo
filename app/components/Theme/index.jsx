"use client";

import { useCallback, useEffect, useState } from "react";
import useSession from "@hooks/useSession";
import {
  APPEARANCE_KEY,
  PALETTES,
  applyTheme,
  brandColors,
  resolveTheme,
} from "@utils/theme";

const CHANGE_EVENT = "farmexpo:appearance";

function readAppearance() {
  try {
    return JSON.parse(localStorage.getItem(APPEARANCE_KEY)) || {};
  } catch {
    return {};
  }
}

// The person's own choice: mode "light" | "dark" | "system" and a palette id
// ("brand" or a PALETTES id). Unset means: system mode, organization colors.
export function useAppearance() {
  const [appearance, setAppearanceState] = useState({});

  useEffect(() => {
    const sync = () => setAppearanceState(readAppearance());
    sync();
    window.addEventListener(CHANGE_EVENT, sync);
    return () => window.removeEventListener(CHANGE_EVENT, sync);
  }, []);

  const setAppearance = useCallback((patch) => {
    const next = { ...readAppearance(), ...patch };
    try {
      localStorage.setItem(APPEARANCE_KEY, JSON.stringify(next));
    } catch {}
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return [appearance, setAppearance];
}

// Applies the theme whenever the choice, the system mode or the
// organization's brand color changes. Renders nothing.
export function ThemeController() {
  const { organization } = useSession();
  const [appearance] = useAppearance();
  const brandColor = organization?.brandColor;

  useEffect(() => {
    const apply = () => applyTheme(resolveTheme(appearance, brandColor));
    apply();
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [appearance, brandColor]);

  return null;
}

const MODES = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
  { id: "system", label: "System" },
];

// Mode and palette picker, shown in the account menu.
export function AppearancePicker() {
  const { organization } = useSession();
  const [appearance, setAppearance] = useAppearance();
  const brandColor = organization?.brandColor;
  const mode = appearance.mode || "system";
  const palette = appearance.palette || (brandColor ? "brand" : "orchard");

  const options = [
    ...(brandColor
      ? [
          {
            id: "brand",
            name: organization?.name || "Organization",
            swatch: `rgb(${brandColors(brandColor, "light").primary})`,
          },
        ]
      : []),
    ...PALETTES.map((p) => ({
      id: p.id,
      name: p.name,
      swatch: `rgb(${p.light.primary})`,
    })),
  ];

  return (
    <div className="space-y-3">
      <div
        role="radiogroup"
        aria-label="Color mode"
        className="grid grid-cols-3 gap-1 rounded-lg bg-text/5 p-1"
      >
        {MODES.map((m) => (
          <button
            key={m.id}
            role="radio"
            aria-checked={mode === m.id}
            onClick={() => setAppearance({ mode: m.id })}
            className={`rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
              mode === m.id
                ? "bg-surface text-text shadow-sm"
                : "text-text/60 hover:text-text"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
      <div role="radiogroup" aria-label="Colors" className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.id}
            role="radio"
            aria-checked={palette === o.id}
            title={o.name}
            onClick={() => setAppearance({ palette: o.id })}
            className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ${
              palette === o.id ? "border-text" : "border-transparent"
            }`}
            style={{ backgroundColor: o.swatch }}
          >
            <span className="sr-only">{o.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
