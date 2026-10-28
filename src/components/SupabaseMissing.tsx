// Aviso para cuando todavía no se configuró Supabase en .env.local.
export default function SupabaseMissing() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-3 px-5 py-12">
      <h1 className="font-display text-3xl font-extrabold text-crema">
        Falta configurar Supabase
      </h1>
      <p className="text-crema-suave">
        Copiá <code className="text-crema">.env.example</code> a{" "}
        <code className="text-crema">.env.local</code> y completá la URL y la key
        de tu proyecto. Los pasos están en el README.
      </p>
    </main>
  );
}
