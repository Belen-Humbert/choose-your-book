import Link from "next/link";
import SupabaseMissing from "@/components/SupabaseMissing";
import { importGoodreads } from "@/app/(app)/pila/actions";
import { hasSupabaseEnv } from "@/lib/supabase/env";

const field =
  "min-h-11 w-full rounded-xl border-0 bg-crema px-3 py-2 text-base text-tinta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mostaza";

export default async function ImportarPage({
  searchParams,
}: PageProps<"/pila/importar">) {
  if (!hasSupabaseEnv) return <SupabaseMissing />;

  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : null;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-5 py-6">
      <Link
        href="/pila/nueva"
        className="inline-flex min-h-11 items-center self-start text-sm font-bold text-mostaza focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mostaza"
      >
        ← Volver
      </Link>
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-mostaza">
          Importar
        </p>
        <h1 className="mt-1.5 font-display text-4xl font-extrabold leading-[1.05] text-crema">
          Traé tu lista
          <br />
          de Goodreads
        </h1>
      </div>

      <ol className="list-decimal space-y-1 pl-5 text-sm text-crema-suave">
        <li>En Goodreads entrá a “Mis libros” → “Importar y exportar”.</li>
        <li>Tocá “Biblioteca de exportación” y, cuando esté listo, descargá el archivo CSV (trae todos tus libros juntos: la app los separa sola).</li>
        <li>Subilo acá. Los libros que ya tenés se saltean.</li>
      </ol>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-ladrillo bg-ladrillo/25 px-4 py-3 text-sm text-crema"
        >
          {error}
        </p>
      )}

      <form action={importGoodreads} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="archivo" className="text-sm font-medium text-crema-suave">
            Archivo CSV
          </label>
          <input
            id="archivo"
            name="archivo"
            type="file"
            accept=".csv,text/csv"
            required
            className={`${field} file:mr-3 file:rounded-full file:border-0 file:bg-tinta file:px-4 file:py-2 file:font-bold file:text-crema`}
          />
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium text-crema-suave">
            Qué importar
          </legend>
          <label className="flex min-h-11 items-center gap-3 text-crema">
            <input type="radio" name="que" value="por-leer" defaultChecked className="size-5 accent-mostaza" />
            Solo los que quiero leer
          </label>
          <label className="flex min-h-11 items-center gap-3 text-crema">
            <input type="radio" name="que" value="todo" className="size-5 accent-mostaza" />
            Todo (también leyendo y leídos)
          </label>
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium text-crema-suave">
            Formato cuando Goodreads no lo dice
          </legend>
          <label className="flex min-h-11 items-center gap-3 text-crema">
            <input type="radio" name="formato" value="fisico" defaultChecked className="size-5 accent-mostaza" />
            Físico
          </label>
          <label className="flex min-h-11 items-center gap-3 text-crema">
            <input type="radio" name="formato" value="digital" className="size-5 accent-mostaza" />
            Digital
          </label>
          <p className="text-xs text-crema-suave">
            Los “Kindle Edition” se cargan como digital. Después podés cambiarlo.
          </p>
        </fieldset>

        <button
          type="submit"
          className="h-12 cursor-pointer rounded-2xl bg-mostaza px-5 text-base font-bold text-tinta shadow-[0_4px_0_#9a6f10] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-crema"
        >
          Importar libros
        </button>
      </form>
    </main>
  );
}
