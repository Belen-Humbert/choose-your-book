import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Supabase vuelve acá después de Google o del link de confirmación por email.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}/`);
    }
  }

  const message = encodeURIComponent("No pudimos iniciar sesión. Probá de nuevo.");
  return NextResponse.redirect(`${origin}/login?error=${message}`);
}
