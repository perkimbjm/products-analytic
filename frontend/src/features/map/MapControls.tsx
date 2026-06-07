import { Icon } from "../../components/Icon";

interface MapBtnProps {
  icon: string;
  onClick?: () => void;
  title?: string;
}

/** Square icon button used for the map's zoom / reset / fullscreen controls. */
export function MapBtn({ icon, onClick, title }: MapBtnProps) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title ?? icon}
      className="w-8 h-8 bg-[var(--map-panel)] hover:bg-[var(--map-border)] border border-[var(--map-border)] rounded-lg flex items-center justify-center text-[var(--map-text-dim)] shadow-lg"
    >
      <Icon name={icon} className="text-[18px]" />
    </button>
  );
}
