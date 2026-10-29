import { signOut } from "@/app/login/actions";
import LeyendoAhora from "@/components/LeyendoAhora";
import Ruleta from "@/components/Ruleta";
import SupabaseMissing from "@/components/SupabaseMissing";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { Book } from "@/lib/types";

export default async function Home() {
  if (!hasSupabaseEnv) {
    return <SupabaseMissing />;
  }

  const supabase = await createClient();
  const [{ data: claimsData }, { data: booksData, error }] = await Promise.all([
    supabase.auth.getClaims(),
    supabase
      .from("books")
      .select("*")
      .in("status", ["pendiente", "leyendo"])
      .order("created_at", { ascending: false }),
  ]);

  const claimEmail = claimsData?.claims?.email;
  const email = typeof claimEmail === "string" ? claimEmail : null;
  const books = (booksData ?? []) as Book[];
  // La ruleta solo sortea entre lo pendiente; lo que ya estás leyendo va aparte.
  const pendientes = books.filter((book) => book.status === "pendiente");
  const leyendo = books.filter((book) => book.status === "leyendo");

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-5 py-6">
      <header className="flex min-h-11 items-center justify-between gap-3">
        <p className="min-w-0 truncate text-sm text-crema-suave">{email}</p>
        <form action={signOut}>
          <button
            type="submit"
            className="h-11 cursor-pointer rounded-full border-[1.5px] border-borde px-4 text-sm font-medium text-crema focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mostaza"
          >
            Salir
          </button>
        </form>
      </header>

      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-mostaza">
          Mi próxima lectura
        </p>
        <h1 className="mt-1.5 font-display text-4xl font-extrabold leading-[1.02] text-crema">
          ¿Qué leo ahora?
        </h1>
      </div>

      <LeyendoAhora books={leyendo} />

      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-ladrillo bg-ladrillo/25 px-4 py-3 text-sm text-crema"
        >
          No pudimos cargar tu pila. Probá de nuevo en un rato.
        </p>
      ) : (
        <Ruleta books={pendientes} />
      )}
    </main>
  );
}
