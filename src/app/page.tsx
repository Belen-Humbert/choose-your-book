export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-5 py-12">
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
    </main>
  );
}
