import { signOut } from "@/app/login/actions";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  let email: string | null = null;
  if (hasSupabaseEnv) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    const claimEmail = data?.claims?.email;
    email = typeof claimEmail === "string" ? claimEmail : null;
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-5 py-6">
      <header className="flex min-h-11 items-center justify-between gap-3">
        <p className="min-w-0 truncate text-sm text-crema-suave">{email}</p>
        {hasSupabaseEnv && (
          <form action={signOut}>
            <button
              type="submit"
              className="h-11 cursor-pointer rounded-full border-[1.5px] border-borde px-4 text-sm font-medium text-crema focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mostaza"
            >
              Salir
            </button>
          </form>
        )}
      </header>

      <div className="flex flex-1 flex-col justify-center gap-6 pb-12">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-mostaza">
            Mi próxima lectura
          </p>
          <h1 className="mt-2 font-display text-5xl font-extrabold leading-[1.02] text-crema">
            ¿Qué leo
            <br />
            ahora?
          </h1>
        </div>

        <p className="text-base text-crema-suave">
          Cargá tus pendientes, filtrá por formato, género y páginas, y que la
          ruleta elija por vos.
        </p>

        <div className="flex flex-col gap-3">
          <span className="inline-flex h-[60px] items-center justify-center rounded-2xl bg-mostaza text-lg font-bold text-tinta shadow-[0_4px_0_#9a6f10]">
            Girar la pila
          </span>
          <p className="text-center text-sm text-crema-suave">En construcción</p>
        </div>
      </div>
    </main>
  );
}
