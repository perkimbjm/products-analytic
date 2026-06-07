import type { StyleSpecification } from "maplibre-gl";
import type { Theme } from "../../lib/theme";

export type BasemapId = "carto" | "voyager" | "osm" | "esri-sat" | "esri-streets" | "topo";

export const BASEMAPS: { id: BasemapId; label: string }[] = [
  { id: "carto", label: "Carto (Theme)" },
  { id: "voyager", label: "Carto Voyager" },
  { id: "osm", label: "OpenStreetMap" },
  { id: "esri-sat", label: "Esri Satellite" },
  { id: "esri-streets", label: "Esri Streets" },
  { id: "topo", label: "OpenTopoMap" },
];

const GLYPHS = "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf";

/** A single raster basemap layer (id `basemap`); product layers are added on top. */
function rasterStyle(tiles: string[], attribution: string, maxzoom = 19): StyleSpecification {
  return {
    version: 8,
    glyphs: GLYPHS,
    sources: {
      basemap: { type: "raster", tiles, tileSize: 256, attribution, maxzoom },
    },
    layers: [{ id: "basemap", type: "raster", source: "basemap" }],
  };
}

// Attribution strings required by each provider's terms of use. Rendered as HTML
// by MapLibre's AttributionControl, so the required source links are clickable.
const A = (href: string, text: string) =>
  `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`;

const OSM_LINK = A("https://www.openstreetmap.org/copyright", "OpenStreetMap");

/** © OpenStreetMap contributors — https://www.openstreetmap.org/copyright */
const OSM_ATTR = `© ${OSM_LINK} contributors`;

/** CARTO basemaps require OSM + CARTO credit — https://carto.com/attributions */
const CARTO_ATTR = `© ${OSM_LINK} contributors © ${A("https://carto.com/attributions", "CARTO")}`;

/** Esri World Imagery service credit — https://www.esri.com */
const ESRI_SAT_ATTR = `Powered by ${A("https://www.esri.com", "Esri")} — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community`;

/** Esri World Street Map service credit. */
const ESRI_STREETS_ATTR = `Powered by ${A("https://www.esri.com", "Esri")} — Source: Esri, HERE, Garmin, USGS, NGA, EPA, USDA`;

/** OpenTopoMap requires data + style credit under CC-BY-SA — https://opentopomap.org */
const TOPO_ATTR = `Map data: © ${OSM_LINK} contributors, SRTM | Map style: © ${A("https://opentopomap.org", "OpenTopoMap")} (${A("https://creativecommons.org/licenses/by-sa/3.0/", "CC-BY-SA")})`;

/** Build a MapLibre style for the chosen basemap. `carto` follows the app theme. */
export function buildMapStyle(id: BasemapId, theme: Theme): StyleSpecification {
  switch (id) {
    case "voyager":
      return rasterStyle(
        ["a", "b", "c", "d"].map(
          (s) => `https://${s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png`,
        ),
        CARTO_ATTR,
        20,
      );
    case "osm":
      return rasterStyle(["https://tile.openstreetmap.org/{z}/{x}/{y}.png"], OSM_ATTR, 19);
    case "esri-sat":
      return rasterStyle(
        [
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        ],
        ESRI_SAT_ATTR,
        19,
      );
    case "esri-streets":
      return rasterStyle(
        [
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
        ],
        ESRI_STREETS_ATTR,
        19,
      );
    case "topo":
      return rasterStyle(
        ["a", "b", "c"].map((s) => `https://${s}.tile.opentopomap.org/{z}/{x}/{y}.png`),
        TOPO_ATTR,
        17,
      );
    case "carto":
    default: {
      const variant = theme === "dark" ? "dark_all" : "light_all";
      return rasterStyle(
        ["a", "b", "c"].map(
          (s) => `https://${s}.basemaps.cartocdn.com/${variant}/{z}/{x}/{y}@2x.png`,
        ),
        CARTO_ATTR,
        20,
      );
    }
  }
}
