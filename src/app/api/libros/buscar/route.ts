import { NextResponse, type NextRequest } from "next/server";
import { searchBooks } from "@/lib/bookSearch";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

// Busca libros en Google Books. Solo para personas con sesión iniciada.
export async function GET(request: NextRequest) {
  if (!hasSupabaseEnv) {
    return NextResponse.json({ error: "Falta configurar Supabase." }, { status: 503 });
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const query = (request.nextUrl.searchParams.get("q") ?? "").trim();
  if (query.length < 2 || query.length > 100) {
    return NextResponse.json({ results: [] });
  }

  try {
    const { results, source } = await searchBooks(query);
    return NextResponse.json({ results, source });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "error desconocido";
    // Queda en la terminal donde corre `npm run dev` para poder diagnosticarlo.
    console.error("[buscar libros]", detail);
    return NextResponse.json(
      { error: "No pudimos buscar libros ahora.", detail },
      { status: 502 },
    );
  }
}
