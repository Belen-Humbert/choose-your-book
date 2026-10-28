// Color de tapa generado a partir de un texto (id o título), así cada libro
// siempre tiene el mismo color hasta que tengamos portadas reales.
const PALETTE = [
  { bg: "#c0392b", ink: "#f4e9d3" },
  { bg: "#e0a526", ink: "#2a1a12" },
  { bg: "#1f6f8b", ink: "#f4e9d3" },
  { bg: "#e67e22", ink: "#2a1a12" },
  { bg: "#8e3b46", ink: "#f4e9d3" },
  { bg: "#a0522d", ink: "#f4e9d3" },
];

export function coverColors(seed: string) {
  let hash = 0;
  for (const char of seed) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}
