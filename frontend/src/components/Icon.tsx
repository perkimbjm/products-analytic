import {
  AlignJustify,
  ArrowRight,
  Banknote,
  BarChart2,
  Bike,
  Boxes,
  Brain,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  ChevronUp,
  CloudOff,
  Compass,
  DollarSign,
  Filter,
  Info,
  LayoutGrid,
  Layers,
  Map,
  MapPin,
  Maximize,
  Menu,
  Minimize,
  Minus,
  Moon,
  Package,
  Plus,
  RefreshCw,
  Search,
  SearchX,
  Shirt,
  ShoppingBag,
  ShoppingCart,
  SlidersHorizontal,
  Sun,
  SunMoon,
  Tag,
  TrendingUp,
  X,
} from "lucide-react";

const ICONS = {
  // filter / controls
  tune: SlidersHorizontal,
  filter_alt: Filter,
  unfold_more: ChevronsUpDown,
  // navigation / arrows
  close: X,
  menu: Menu,
  expand_more: ChevronDown,
  expand_less: ChevronUp,
  chevron_left: ChevronLeft,
  chevron_right: ChevronRight,
  arrow_forward: ArrowRight,
  // search
  search: Search,
  search_off: SearchX,
  // map / location
  location_on: MapPin,
  map: Map,
  layers: Layers,
  explore: Compass,
  // products / commerce
  inventory: Boxes,
  inventory_2: Package,
  shopping_cart: ShoppingCart,
  sell: Tag,
  paid: DollarSign,
  payments: Banknote,
  // analytics / charts
  insights: TrendingUp,
  bar_chart: BarChart2,
  bar_chart_off: BarChart2,
  // categories
  category: LayoutGrid,
  segment: AlignJustify,
  directions_bike: Bike,
  checkroom: Shirt,
  sports_motorsports: ShoppingBag,
  // misc / state
  cloud_off: CloudOff,
  calendar_month: CalendarDays,
  refresh: RefreshCw,
  sync: RefreshCw,
  add: Plus,
  remove: Minus,
  info: Info,
  psychology: Brain,
  // fullscreen
  fullscreen: Maximize,
  fullscreen_exit: Minimize,
  // theme
  contrast: SunMoon,
  light_mode: Sun,
  dark_mode: Moon,
} as const;

type IconName = keyof typeof ICONS;

interface IconProps {
  /** Material Symbols ligature name — mapped to the equivalent lucide-react icon. */
  name: string;
  /** Tailwind classes for color, sizing (text-[Npx] → 1em sizing), animation, etc. */
  className?: string;
}

/**
 * Icon wrapper backed by lucide-react. Accepts the same `name` strings used with
 * Material Symbols so call sites need no changes. Sizing via `text-[Npx]` works
 * because the SVG uses `width="1em" height="1em"`, inheriting the current font-size.
 */
export function Icon({ name, className = "" }: IconProps) {
  const Comp = ICONS[name as IconName];
  if (!Comp) return null;
  return <Comp width="1em" height="1em" className={className} />;
}
