"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { completeBookData } from "@/app/(app)/pila/actions";

const BATCH = 6;

// Busca el género, las páginas y la portada de los libros que no los tienen (por ejemplo los
// importados de Goodreads), de a pocos, mostrando el avance. Se puede cancelar.
export default function CompletarDatos({ ids }: { ids: string[] }) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(0);
  const [updated, setUpdated] = useState(0);
  const [finished, setFinished] = useState(false);
  const cancel = useRef(false);

  if (ids.length === 0 && !finished) return null;

  async function start() {
    cancel.current = false;
    setRunning(true);
    setFinished(false);
    setDone(0);
    setUpdated(0);
    const queue = [...ids];
    let processed = 0;
    let changed = 0;
    try {
      while (queue.length > 0 && !cancel.current) {
        const batch = queue.splice(0, BATCH);
        const result = await completeBookData(batch);
        processed += batch.length;
        changed += result.updated;
        setDone(processed);
        setUpdated(changed);
      }
    } catch {
      // si se corta la conexión, dejamos lo que se alcanzó a completar
    }
    setRunning(false);
    setFinished(true);
    router.refresh();
  }

  return (
    <section
      aria-label="Completar datos de los libros"
      className="flex flex-col gap-2 rounded-[14px] border border-borde bg-panel p-3.5"
    >
      {finished ? (
        <p role="status" className="text-sm text-crema">
          Listo: completamos {updated} de {done} libros. Los que no encontramos quedan como
          estaban.
        </p>
      ) : (
        <p className="text-sm text-crema-suave">
          {ids.length} libros no tienen género o portada. Podemos buscarlos por vos (el género
          sirve para filtrar en la ruleta).
        </p>
      )}
      {running && (
        <p role="status" className="text-xs text-crema-suave">
          Buscando… {done} de {ids.length}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={running ? () => (cancel.current = true) : start}
          className="h-11 cursor-pointer rounded-full border-[1.5px] border-mostaza px-4 text-sm font-bold text-mostaza focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mostaza"
        >
          {running ? "Detener" : finished ? "Buscar de nuevo" : "Completar datos"}
        </button>
      </div>
    </section>
  );
}
