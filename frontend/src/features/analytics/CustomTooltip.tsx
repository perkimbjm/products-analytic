import { useTheme } from "../../lib/theme";

/**
 * Custom Recharts tooltip with proper contrast in dark mode.
 * SVG tooltips need explicit text color since they don't inherit CSS.
 */
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: string | number }>;
  label?: string;
}

export function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  const { theme } = useTheme();

  if (!active || !payload || payload.length === 0) return null;

  // Dark mode: light text on dark background; light mode: dark text on light background.
  const bg = theme === "dark" ? "#0f172a" : "#ffffff";
  const textColor = theme === "dark" ? "#e6e9f5" : "#131b2e";
  const labelColor = theme === "dark" ? "#9aa3b8" : "#737686";

  return (
    <div
      style={{
        backgroundColor: bg,
        border: `1px solid ${theme === "dark" ? "#25304a" : "#c3c6d7"}`,
        borderRadius: "6px",
        padding: "8px 12px",
        boxShadow:
          theme === "dark" ? "0 4px 12px rgba(0, 0, 0, 0.4)" : "0 2px 8px rgba(0, 0, 0, 0.1)",
      }}
    >
      {label && (
        <p
          style={{
            margin: "0 0 4px 0",
            fontSize: "12px",
            color: labelColor,
            fontWeight: 500,
          }}
        >
          {label}
        </p>
      )}
      {payload.map((entry, i) => (
        <p
          key={`item-${i}`}
          style={{
            margin: "2px 0",
            fontSize: "12px",
            color: textColor,
            fontWeight: 500,
          }}
        >
          <span style={{ color: labelColor }}>{entry.name}:</span> {entry.value}
        </p>
      ))}
    </div>
  );
}
