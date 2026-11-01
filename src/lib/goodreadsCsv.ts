import type { BookStatus } from "./types";

// Lector de CSV (comillas, comas y saltos de línea dentro de un campo).
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const src = text.replace(/^﻿/, "");

  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      quoted = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((value) => value.trim() !== "")) rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  row.push(field);
  if (row.some((value) => value.trim() !== "")) rows.push(row);
  return rows;
}

export type ImportedBook = {
  title: string;
  author: string | null;
  pages: number | null;
  status: BookStatus;
  // Fecha en que lo agregaste a Goodreads (ISO), para ordenar la pila como allá.
  addedAt: string | null;
  // null: el CSV no dice el formato; se usa el que elige la persona.
  format: "digital" | "fisico" | null;
};

const SHELF_STATUS: Record<string, BookStatus> = {
  "to-read": "pendiente",
  "currently-reading": "leyendo",
  read: "leido",
};

function formatFromBinding(binding: string): ImportedBook["format"] {
  const b = binding.toLowerCase();
  if (!b) return null;
  if (/kindle|ebook|e-book|digital|audible|audio/.test(b)) return "digital";
  return "fisico";
}

// "2019/01/28" → "2019-01-28T12:00:00.000Z" (al mediodía para que la zona horaria no cambie el día).
export function goodreadsDate(value: string): string | null {
  const m = /^(\d{4})\/(\d{2})\/(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const date = new Date(`${m[1]}-${m[2]}-${m[3]}T12:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.getTime() > Date.now() + 864e5
    ? null
    : date.toISOString();
}

// Convierte un export de Goodreads (Mis libros → Importar y exportar) en libros.
// Devuelve null si el archivo no parece un export de Goodreads.
export function parseGoodreadsExport(text: string): ImportedBook[] | null {
  const rows = parseCsv(text);
  if (rows.length === 0) return null;
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const col = (name: string) => header.indexOf(name);
  const iTitle = col("title");
  const iShelf = col("exclusive shelf");
  if (iTitle < 0 || iShelf < 0) return null;
  const iAuthor = col("author");
  const iPages = col("number of pages");
  const iBinding = col("binding");
  const iAdded = col("date added");

  const books: ImportedBook[] = [];
  for (const row of rows.slice(1)) {
    const title = (row[iTitle] ?? "").trim();
    if (!title) continue;
    const status = SHELF_STATUS[(row[iShelf] ?? "").trim().toLowerCase()];
    if (!status) continue; // estantes propios: no sabemos qué estado darles
    const pages = Number.parseInt(row[iPages] ?? "", 10);
    books.push({
      title: title.slice(0, 300),
      author: iAuthor >= 0 ? (row[iAuthor] ?? "").trim().slice(0, 200) || null : null,
      pages: Number.isFinite(pages) && pages > 0 && pages < 20000 ? pages : null,
      status,
      addedAt: iAdded >= 0 ? goodreadsDate(row[iAdded] ?? "") : null,
      format: iBinding >= 0 ? formatFromBinding((row[iBinding] ?? "").trim()) : null,
    });
  }
  return books;
}

// Clave para detectar repetidos (mismo título y autor, sin importar mayúsculas ni tildes).
export function bookKey(title: string, author: string | null): string {
  const clean = (s: string) =>
    s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
  return `${clean(title)}|${clean(author ?? "")}`;
}
