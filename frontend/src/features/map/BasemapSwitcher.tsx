import { useState } from "react";
import { BASEMAPS, type BasemapId } from "./basemaps";
import { useIsMobile } from "../../hooks/use-mobile";
import { Icon } from "../../components/Icon";

interface BasemapSwitcherProps {
  value: BasemapId;
  onChange: (id: BasemapId) => void;
}

/** Floating basemap picker for the map page (themed via --map-* variables).
 *  On mobile: icon-only button that expands to a dropdown on click.
 *  On desktop: always shows the full dropdown. */
export function BasemapSwitcher({ value, onChange }: BasemapSwitcherProps) {
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);

  const currentLabel = BASEMAPS.find((b) => b.id === value)?.label ?? value;

  if (isMobile) {
    return (
      <div className="absolute bottom-16 left-4 z-35">
        {mobileOpen ? (
          <div className="bg-[var(--map-panel)] border border-[var(--map-border)] rounded-xl shadow-2xl backdrop-blur overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--map-border)]">
              <Icon name="layers" className="text-[18px] text-primary" />
              <button
                onClick={() => setMobileOpen(false)}
                className="text-[var(--map-text-dim)] hover:text-[var(--map-text)]"
              >
                <Icon name="close" className="text-[18px]" />
              </button>
            </div>
            {BASEMAPS.map((b) => (
              <button
                key={b.id}
                onClick={() => {
                  onChange(b.id);
                  setMobileOpen(false);
                }}
                className={`w-full text-left px-3 py-2.5 text-sm hover:bg-[var(--map-hover)] transition-colors ${
                  b.id === value ? "text-primary font-medium bg-[var(--map-hover)]" : "text-[var(--map-text)]"
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        ) : (
          <button
            onClick={() => setMobileOpen(true)}
            className="w-8 h-8 bg-[var(--map-panel)] hover:bg-[var(--map-border)] border border-[var(--map-border)] rounded-lg flex items-center justify-center text-[var(--map-text-dim)] shadow-lg"
            title="Basemap"
          >
            <Icon name="layers" className="text-[18px]" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="absolute bottom-16 left-4 z-35 flex items-center gap-2 rounded-xl border border-[var(--map-border)] bg-[var(--map-panel)] px-3 py-2 shadow-2xl backdrop-blur">
      <Icon name="layers" className="text-[18px] text-primary" />
      <label className="sr-only" htmlFor="basemap-select">
        Basemap
      </label>
      <select
        id="basemap-select"
        value={value}
        onChange={(e) => onChange(e.target.value as BasemapId)}
        className="rounded-lg border border-[var(--map-border)] bg-[var(--map-sunken)] px-2 py-1 text-sm text-[var(--map-text)] outline-none hover:border-primary/50 hover:bg-[var(--map-hover)] focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors cursor-pointer"
      >
        {BASEMAPS.map((b) => (
          <option key={b.id} value={b.id}>
            {b.label}
          </option>
        ))}
      </select>
    </div>
  );
}
