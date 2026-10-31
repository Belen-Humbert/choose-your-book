import Link from "next/link";
import FormularioLibro from "@/components/FormularioLibro";
import SupabaseMissing from "@/components/SupabaseMissing";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export default async function NuevaPage({
  searchParams,
}: PageProps<"/pila/nueva">) {
  if (!hasSupabaseEnv) {
    return <SupabaseMissing />;
  }

  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : null;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-5 py-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-mostaza">
          Agregar
        </p>
        <h1 className="mt-1.5 font-display text-4xl font-extrabold leading-[1.05] text-crema">
          Sumá un libro
          <br />a tu pila
        </h1>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-ladrillo bg-ladrillo/25 px-4 py-3 text-sm text-crema"
        >
          {error}
        </p>
      )}

      <FormularioLibro />

      <Link
        href="/pila/importar"
        className="inline-flex min-h-11 items-center self-start text-sm font-bold text-mostaza underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mostaza"
      >
        ¿Ya tenés una lista en Goodreads? Importala
      </Link>
    </main>
  );
}
