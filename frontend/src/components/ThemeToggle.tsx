import { useEffect, useState } from "react";
import { useTheme } from "../lib/theme";
import { Icon } from "./Icon";

interface ThemeToggleProps {
  /** Tailwind classes for the icon/hover treatment so it fits each page's header. */
  className?: string;
}

/**
 * Light/dark theme toggle. Renders a stable placeholder until mounted to avoid a
 * hydration mismatch (server can't know the persisted theme).
 */
export function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const { theme, toggle } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = theme === "dark";
  const icon = !mounted ? "contrast" : isDark ? "light_mode" : "dark_mode";
  const label = !mounted ? "Toggle theme" : isDark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={`p-2 rounded-lg transition-colors ${className}`}
    >
      <Icon name={icon} className="align-middle" />
    </button>
  );
}
