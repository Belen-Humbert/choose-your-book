"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function goToLogin(params: Record<string, string>): never {
  const query = new URLSearchParams(params).toString();
  redirect(`/login?${query}`);
}

async function getOrigin() {
  const requestHeaders = await headers();
  return (
    requestHeaders.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000"
  );
}

function readCredentials(formData: FormData) {
  return {
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  };
}

export async function signInWithEmail(formData: FormData) {
  const { email, password } = readCredentials(formData);
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    goToLogin({ error: "Email o contraseña incorrectos." });
  }

  redirect("/");
}

export async function signUpWithEmail(formData: FormData) {
  const { email, password } = readCredentials(formData);
  const origin = await getOrigin();
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });
  if (error) {
    goToLogin({
      modo: "crear",
      error:
        "No pudimos crear la cuenta. Revisá el email y que la contraseña tenga al menos 6 caracteres.",
    });
  }

  // Si Supabase no pide confirmar el email, la sesión ya está activa.
  if (data.session) {
    redirect("/");
  }

  goToLogin({ mensaje: "Revisá tu email para confirmar la cuenta y después entrá." });
}

export async function signInWithGoogle() {
  const origin = await getOrigin();
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback` },
  });
  if (error || !data.url) {
    goToLogin({ error: "No pudimos iniciar sesión con Google. Probá de nuevo." });
  }

  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
