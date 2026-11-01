// Color de tapa generado a partir de un texto (id o título), así cada libro
// siempre tiene el mismo color hasta que tengamos portadas reales.
const PALETTE = [
  { bg: "#a84a28", ink: "#fff6e3" },
  { bg: "#e0a526", ink: "#2b1d14" },
  { bg: "#2f4a3a", ink: "#fff6e3" },
  { bg: "#1f6f8b", ink: "#fff6e3" },
  { bg: "#8e3b46", ink: "#fff6e3" },
  { bg: "#c97b3a", ink: "#2b1d14" },
];

export function coverColors(seed: string) {
  let hash = 0;
  for (const char of seed) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}
