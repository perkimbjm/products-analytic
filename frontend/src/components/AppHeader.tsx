import { memo, useState } from "react";
import { Link } from "@tanstack/react-router";
import type { GlobalFilters } from "../lib/filters";
import { useIsMobile } from "../hooks/use-mobile";
import { ThemeToggle } from "./ThemeToggle";
import { Icon } from "./Icon";

type NavKey = "map" | "dashboard";

const NAV: Record<NavKey, { label: string; to: string }> = {
  map: { label: "Map View", to: "/" },
  dashboard: { label: "Dashboard", to: "/analytics" },
};

interface AppHeaderProps {
  /** Brand title shown on the left. */
  title: string;
  /** When set, the title is a link to this route; otherwise a plain label. */
  titleTo?: string;
  /** Which nav entry is the current page. */
  active: NavKey;
  /** Global filters carried through nav links so the filter survives navigation. */
  filters: GlobalFilters;
  /** Layout mode: `fixed` pins the header (Dashboard); `relative` flows it (Map). */
  position?: "fixed" | "relative";
  /** Shows a "Loading data..." indicator in the header (Map page). */
  loading?: boolean;
}

/**
 * Top navigation shared by the Map and Dashboard pages. Owns its own mobile-menu
 * state and renders the active page first, matching the original per-route markup.
 */
export const AppHeader = memo(function AppHeader({
  title,
  titleTo,
  active,
  filters,
  position = "fixed",
  loading = false,
}: AppHeaderProps) {
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const order: NavKey[] = active === "map" ? ["map", "dashboard"] : ["dashboard", "map"];

  const headerClass = position === "fixed" ? "fixed top-0 left-0 w-full z-50" : "relative z-30";
  const mobileMenuClass =
    position === "fixed" ? "fixed top-header-height left-0 right-0 z-40" : "relative z-40";

  return (
    <>
      <header
        className={`${headerClass} flex items-center justify-between px-4 lg:px-margin-desktop h-header-height bg-surface shadow-md`}
      >
        <div className="flex items-center gap-4 lg:gap-8 min-w-0">
          {titleTo ? (
            <Link to={titleTo} className="md:text-headline-md font-bold text-primary">
              {title}
            </Link>
          ) : (
            <span className="md:text-headline-md font-bold text-primary">{title}</span>
          )}
          <nav className="hidden md:flex items-center gap-6">
            {order.map((key) =>
              key === active ? (
                <a
                  key={key}
                  className="md:text-headline-sm text-primary border-b-2 border-primary pb-1"
                  href="#"
                >
                  {NAV[key].label}
                </a>
              ) : (
                <Link
                  key={key}
                  to={NAV[key].to}
                  search={filters}
                  className="md:text-headline-sm text-on-surface-variant hover:text-primary transition-colors"
                >
                  {NAV[key].label}
                </Link>
              ),
            )}
          </nav>
        </div>

        <div className="flex items-center gap-2 lg:gap-4 shrink-0">
          {loading && (
            <span className="text-xs text-on-surface-variant flex items-center gap-1">
              <Icon name="sync" className="text-[14px] animate-spin" /> Loading data...
            </span>
          )}
          <ThemeToggle className="text-on-surface-variant hover:text-primary hover:bg-surface-container" />
          <div className="hidden sm:flex items-center gap-3 ml-2 pl-4 border-l border-outline-variant">
            <div className="text-right">
              <p className="text-label-md font-bold leading-none">Admin</p>
              <p className="text-label-md text-outline leading-none mt-1">MAPID</p>
            </div>
            <div className="w-10 h-10 rounded-full border-2 border-primary-fixed bg-primary/20 flex items-center justify-center text-primary font-bold">
              M
            </div>
          </div>
          {isMobile && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-surface-container text-on-surface-variant"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              <Icon name={mobileMenuOpen ? "close" : "menu"} className="text-[24px]" />
            </button>
          )}
        </div>
      </header>

      {isMobile && mobileMenuOpen && (
        <div className={`${mobileMenuClass} bg-surface shadow-lg border-b border-outline-variant`}>
          <nav className="flex flex-col p-4 gap-2">
            {order.map((key) =>
              key === active ? (
                <a
                  key={key}
                  className="text-headline-sm text-primary font-medium py-2 px-3 rounded-lg bg-primary/10"
                  href="#"
                >
                  {NAV[key].label}
                </a>
              ) : (
                <Link
                  key={key}
                  to={NAV[key].to}
                  search={filters}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-headline-sm text-on-surface-variant hover:text-primary py-2 px-3 rounded-lg hover:bg-surface-container transition-colors"
                >
                  {NAV[key].label}
                </Link>
              ),
            )}
          </nav>
        </div>
      )}
    </>
  );
});
