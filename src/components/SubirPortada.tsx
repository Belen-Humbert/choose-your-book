"use client";

import Image from "next/image";
import { useId, useState } from "react";
import { prepareCover } from "@/lib/image";
import { createClient } from "@/lib/supabase/client";
import { COVERS_BUCKET, coverStoragePath } from "@/lib/storage";

const BUCKET = COVERS_BUCKET;

// Si la portada anterior la había subido esta persona, la borramos para no dejar archivos sueltos.
// Las portadas de Google Books u Open Library no se tocan.
function discardUploaded(url: string | null) {
  const path = coverStoragePath(url);
  if (path) void createClient().storage.from(BUCKET).remove([path]);
}

async function uploadCover(file: File): Promise<string> {
  const blob = await prepareCover(file);

  const supabase = createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) throw new Error("Tu sesión venció. Volvé a entrar.");

  const extension = blob.type === "image/webp" ? "webp" : "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: blob.type,
    cacheControl: "31536000",
  });
  if (error) {
    if (/bucket not found/i.test(error.message)) {
      throw new Error(
        "Falta crear el espacio de portadas en Supabase (migración 0002_covers.sql).",
      );
    }
    throw new Error(`No pudimos subir la imagen (${error.message}).`);
  }

  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

const buttonClass =
  "inline-flex h-11 cursor-pointer items-center rounded-full border-[1.5px] px-4 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mostaza";

export default function SubirPortada({
  coverUrl,
  onChange,
  onUploadingChange,
}: {
  coverUrl: string | null;
  onChange: (url: string | null) => void;
  // Avisa al formulario para que no deje guardar mientras la imagen todavía se está subiendo.
  onUploadingChange?: (uploading: boolean) => void;
}) {
  const inputId = useId();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);
    onUploadingChange?.(true);
    try {
      const newUrl = await uploadCover(file);
      discardUploaded(coverUrl);
      onChange(newUrl);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No pudimos subir la imagen.");
    } finally {
      setUploading(false);
      onUploadingChange?.(false);
      // Permite volver a elegir el mismo archivo.
      input.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-crema-suave">Portada</p>
      <div className="flex items-center gap-3">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt="Vista previa de la portada"
            width={52}
            height={76}
            unoptimized
            className="h-[76px] w-[52px] shrink-0 rounded-l-[3px] rounded-r-md object-cover shadow-[inset_3px_0_0_rgba(0,0,0,0.25)]"
          />
        ) : (
          <span
            aria-hidden="true"
            className="flex h-[76px] w-[52px] shrink-0 items-center justify-center rounded-l-[3px] rounded-r-md border border-dashed border-borde text-xs text-crema-suave"
          >
            sin
          </span>
        )}

        <div className="flex flex-wrap gap-2">
          <input
            id={inputId}
            type="file"
            accept="image/*"
            onChange={handleFile}
            disabled={uploading}
            className="peer sr-only"
          />
          <label
            htmlFor={inputId}
            className={`${buttonClass} border-mostaza bg-mostaza font-bold text-tinta peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-crema peer-disabled:cursor-not-allowed peer-disabled:opacity-60`}
          >
            {uploading
              ? "Subiendo…"
              : coverUrl
                ? "Cambiar portada"
                : "Subir desde mi dispositivo"}
          </label>
          {coverUrl && !uploading && (
            <button
              type="button"
              onClick={() => {
                discardUploaded(coverUrl);
                onChange(null);
              }}
              className={`${buttonClass} border-borde font-medium text-crema-suave`}
            >
              Quitar
            </button>
          )}
        </div>
      </div>

      <p aria-live="polite" className="text-xs text-crema-suave">
        {error ? (
          <span role="alert" className="text-crema">
            {error}
          </span>
        ) : (
          !coverUrl && "Opcional. Si no ponés una, se usa una tapa de color."
        )}
      </p>
    </div>
  );
}
