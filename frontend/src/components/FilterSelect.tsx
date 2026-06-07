interface FilterOption {
  id: string | number;
  name: string;
}

interface FilterSelectProps {
  /** Currently selected value (the option `name`), or empty for "all". */
  value: string;
  /** Called with the new value, or `undefined` when "all" is chosen. */
  onChange: (value: string | undefined) => void;
  options: FilterOption[];
  /** Label for the "all" option, e.g. "All Categories". */
  allLabel: string;
  /** Per-page styling for the native <select>. */
  className?: string;
}

/**
 * Native <select> for a category/segment filter. Owns the option-mapping and
 * empty-value handling shared by the Map and Dashboard pages; visual styling is
 * supplied per page via `className`.
 */
const BASEClasses =
  "hover:border-primary/50 hover:bg-[var(--map-hover)] focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors cursor-pointer";

export function FilterSelect({
  value,
  onChange,
  options,
  allLabel,
  className = "",
}: FilterSelectProps) {
  return (
    <select
      className={`${BASEClasses} ${className}`}
      value={value}
      onChange={(e) => onChange(e.target.value || undefined)}
    >
      <option value="">{allLabel}</option>
      {options.map((o) => (
        <option key={o.id} value={o.name}>
          {o.name}
        </option>
      ))}
    </select>
  );
}
