"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

// Ej.: "30 oct 2026 · 16:37" (hora de 24 h, sin "de" entre medio).
function format(iso: string) {
  const date = new Date(iso);
  const day = date
    .toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })
    .replace(/ de /g, " ")
    .replace(/\./g, "");
  const time = date.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  return `${day} · ${time}`;
}

// Muestra la fecha y la hora en la zona horaria de quien mira la app. El servidor no sabe cuál es,
// así que el texto se arma en el navegador (en el servidor queda vacío un instante).
export default function FechaHora({ iso }: { iso: string }) {
  const text = useSyncExternalStore(
    subscribe,
    () => format(iso),
    () => "",
  );
  return <time dateTime={iso}>{text}</time>;
}
