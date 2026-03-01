/**
 * Redimensionne une image cote client via Canvas API.
 * Retourne un Blob (WebP si supporte, sinon JPEG).
 */
export async function resizeImage(
  file: File,
  maxWidth: number,
  quality = 0.85,
): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const { width, height } = bitmap

  let targetWidth = width
  let targetHeight = height

  if (width > maxWidth) {
    targetWidth = maxWidth
    targetHeight = Math.round((height / width) * maxWidth)
  }

  const canvas = new OffscreenCanvas(targetWidth, targetHeight)
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight)
  bitmap.close()

  // WebP si supporté, sinon JPEG
  try {
    return await canvas.convertToBlob({ type: 'image/webp', quality })
  } catch {
    return await canvas.convertToBlob({ type: 'image/jpeg', quality })
  }
}

/**
 * Genere les variantes thumb (400px) et full (1200px) d'une image.
 */
export async function createImageVariants(file: File): Promise<{
  thumb: Blob
  full: Blob
  original: File
}> {
  const [thumb, full] = await Promise.all([
    resizeImage(file, 400, 0.8),
    resizeImage(file, 1200, 0.85),
  ])

  return { thumb, full, original: file }
}
