// Porcentaje leído (0 a 100). Devuelve null si no se puede calcular (no se sabe el total de páginas).
export function progressPercent(
  currentPage: number,
  pages: number | null,
): number | null {
  if (!pages || pages <= 0) return null;
  const ratio = Math.max(0, currentPage) / pages;
  return Math.min(100, Math.round(ratio * 100));
}
