/**
 * Réduit une photo dans le navigateur avant l'envoi : celles d'un téléphone
 * pèsent plusieurs mégaoctets, bien plus que ce qu'accepte une action serveur
 * et bien plus qu'il n'en faut pour une vignette.
 */
const MAX_SIDE = 1200;

export async function shrinkPhoto(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return file;
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.85),
  );
  return blob ? new File([blob], "photo.jpg", { type: "image/jpeg" }) : file;
}
