// Portadas subidas por las personas a Supabase Storage (ver supabase/migrations/0002_covers.sql).
export const COVERS_BUCKET = "covers";

const PUBLIC_PATH = `/storage/v1/object/public/${COVERS_BUCKET}/`;

// Si la URL es de una portada subida a NUESTRO Storage, devuelve su ruta dentro del bucket
// ("<id-de-usuario>/<archivo>"). Para portadas de Google Books, Open Library u otros sitios
// devuelve null: esas no son nuestras y nunca las borramos.
export function coverStoragePath(url: string | null | undefined): string | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!url || !base) return null;

  const prefix = `${base}${PUBLIC_PATH}`;
  if (!url.startsWith(prefix)) return null;

  const path = url.slice(prefix.length).split(/[?#]/)[0];
  if (!path || path.includes("..")) return null;

  try {
    return decodeURIComponent(path);
  } catch {
    return null;
  }
}
