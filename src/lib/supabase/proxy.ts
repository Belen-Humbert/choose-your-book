import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasSupabaseEnv } from "./env";

// Refresca la sesión de Supabase en cada request y decide a dónde va cada persona:
// sin sesión → /login, con sesión en /login → inicio.
export async function updateSession(request: NextRequest) {
  // Sin variables de entorno (todavía no configuraste Supabase) seguimos de largo.
  if (!hasSupabaseEnv) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // No pongas código entre createServerClient y getClaims().
  const { data } = await supabase.auth.getClaims();
  const isLoggedIn = Boolean(data?.claims);

  const path = request.nextUrl.pathname;
  const isLoginPage = path.startsWith("/login");
  const isPublic = isLoginPage || path.startsWith("/auth");

  if (!isLoggedIn && !isPublic) {
    return redirectKeepingCookies(request, response, "/login");
  }
  if (isLoggedIn && isLoginPage) {
    return redirectKeepingCookies(request, response, "/");
  }

  return response;
}

// Las cookies de sesión refrescadas tienen que viajar también en el redirect.
function redirectKeepingCookies(
  request: NextRequest,
  from: NextResponse,
  pathname: string,
) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";

  const redirect = NextResponse.redirect(url);
  from.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}
