// Prepara una portada elegida desde el dispositivo: la achica y la comprime en el navegador,
// así la subida es rápida y no importa si la foto original pesa varios MB.

const MAX_SIDE = 900;
const MAX_INPUT_BYTES = 15 * 1024 * 1024;

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
}

export async function prepareCover(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) {
    throw new Error("El archivo tiene que ser una imagen.");
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error("La imagen es demasiado grande (máximo 15 MB).");
  }

  let bitmap: ImageBitmap;
  try {
    // "from-image" respeta la orientación de las fotos sacadas con el celu.
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error("No pudimos leer esa imagen. Probá con un JPG o PNG.");
  }

  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("No pudimos procesar la imagen.");
  }
  // Fondo blanco: si el formato final no admite transparencia, no queda negro.
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  // WebP pesa menos; algunos navegadores viejos no lo generan y devuelven PNG, ahí usamos JPEG.
  const webp = await toBlob(canvas, "image/webp", 0.85);
  if (webp && webp.type === "image/webp") return webp;
  const jpeg = await toBlob(canvas, "image/jpeg", 0.85);
  if (jpeg) return jpeg;
  throw new Error("No pudimos procesar la imagen.");
}
