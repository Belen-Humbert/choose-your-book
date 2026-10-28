import Link from "next/link";
import SupabaseMissing from "@/components/SupabaseMissing";
import { GENRES } from "@/lib/genres";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { addBook } from "../actions";

const fieldClass =
  "h-12 w-full rounded-xl border-0 bg-crema px-4 text-base text-tinta placeholder:text-tinta/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mostaza";

const labelClass = "flex flex-col gap-1.5 text-sm font-medium text-crema-suave";

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

      <form action={addBook} className="flex flex-col gap-4">
        <label className={labelClass}>
          Título
          <input
            name="title"
            type="text"
            required
            maxLength={200}
            className={fieldClass}
          />
        </label>

        <label className={labelClass}>
          Autor
          <input name="author" type="text" maxLength={200} className={fieldClass} />
        </label>

        <label className={labelClass}>
          Género
          <select name="genre" defaultValue="" className={fieldClass}>
            <option value="">Elegí un género</option>
            {GENRES.map((genre) => (
              <option key={genre} value={genre}>
                {genre}
              </option>
            ))}
          </select>
        </label>

        <label className={labelClass}>
          Páginas
          <input
            name="pages"
            type="number"
            inputMode="numeric"
            min={1}
            max={10000}
            className={fieldClass}
          />
        </label>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium text-crema-suave">
            ¿Dónde lo tenés?
          </legend>
          <div className="flex gap-2">
            <label className="cursor-pointer">
              <input type="checkbox" name="digital" className="peer sr-only" />
              <span className="inline-flex h-11 items-center rounded-full border-[1.5px] border-borde px-4 text-sm font-medium text-crema peer-checked:border-petroleo peer-checked:bg-petroleo peer-checked:font-bold peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-mostaza">
                Digital
              </span>
            </label>
            <label className="cursor-pointer">
              <input type="checkbox" name="fisico" className="peer sr-only" />
              <span className="inline-flex h-11 items-center rounded-full border-[1.5px] border-borde px-4 text-sm font-medium text-crema peer-checked:border-mostaza peer-checked:bg-mostaza peer-checked:font-bold peer-checked:text-tinta peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-mostaza">
                Físico
              </span>
            </label>
          </div>
        </fieldset>

        <button
          type="submit"
          className="mt-1 h-[60px] cursor-pointer rounded-2xl bg-mostaza text-lg font-bold text-tinta shadow-[0_4px_0_#9a6f10] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-crema"
        >
          Agregar a mi pila
        </button>

        <Link
          href="/pila"
          className="text-center text-sm font-medium text-crema-suave underline"
        >
          Cancelar
        </Link>
      </form>
    </main>
  );
}
