import Link from "next/link";
import { signInWithEmail, signInWithGoogle, signUpWithEmail } from "./actions";

const inputClass =
  "h-12 w-full rounded-xl border-0 bg-crema px-4 text-base text-tinta placeholder:text-tinta/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mostaza";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : null;
  const mensaje = typeof params.mensaje === "string" ? params.mensaje : null;
  const crear = params.modo === "crear";

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-5 py-12">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-mostaza">
          Choose Your Book
        </p>
        <h1 className="mt-2 font-display text-5xl font-extrabold leading-[1.02] text-crema">
          {crear ? (
            <>
              Creá tu
              <br />
              cuenta
            </>
          ) : (
            <>
              Entrá a
              <br />
              tu pila
            </>
          )}
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
      {mensaje && (
        <p
          role="status"
          className="rounded-xl border border-petroleo bg-petroleo/30 px-4 py-3 text-sm text-crema"
        >
          {mensaje}
        </p>
      )}

      <form action={signInWithGoogle}>
        <button
          type="submit"
          className="flex h-12 w-full cursor-pointer items-center justify-center gap-3 rounded-2xl bg-crema text-base font-bold text-tinta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mostaza"
        >
          <span
            aria-hidden="true"
            className="flex size-6 items-center justify-center rounded-full bg-tinta text-sm font-bold text-crema"
          >
            G
          </span>
          Continuar con Google
        </button>
      </form>

      <div className="flex items-center gap-3 text-sm text-crema-suave">
        <span className="h-px flex-1 bg-borde" />
        o con email
        <span className="h-px flex-1 bg-borde" />
      </div>

      <form
        action={crear ? signUpWithEmail : signInWithEmail}
        className="flex flex-col gap-4"
      >
        <label className="flex flex-col gap-1.5 text-sm font-medium text-crema-suave">
          Email
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="vos@ejemplo.com"
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-crema-suave">
          Contraseña
          <input
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete={crear ? "new-password" : "current-password"}
            className={inputClass}
          />
        </label>
        <button
          type="submit"
          className="mt-1 h-[60px] cursor-pointer rounded-2xl bg-mostaza text-lg font-bold text-tinta shadow-[0_4px_0_#9a6f10] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-crema"
        >
          {crear ? "Crear cuenta" : "Entrar"}
        </button>
      </form>

      <p className="text-center text-sm text-crema-suave">
        {crear ? "¿Ya tenés cuenta? " : "¿Todavía no tenés cuenta? "}
        <Link
          href={crear ? "/login" : "/login?modo=crear"}
          className="font-bold text-mostaza underline"
        >
          {crear ? "Entrá" : "Creala"}
        </Link>
      </p>
    </main>
  );
}
