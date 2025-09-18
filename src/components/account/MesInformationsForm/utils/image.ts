// utils pour préparer une image d'avatar côté client
export type PreprocessOptions = {
  size?: number // bord du carré de sortie
  mimeType?: string // 'image/jpeg' ou 'image/webp' selon ce que tu veux
  quality?: number // 0..1 (JPEG/WebP)
}

export async function preprocessAvatar(
  file: File,
  opts: PreprocessOptions = {}
): Promise<File> {
  const { size = 512, mimeType = 'image/jpeg', quality = 0.9 } = opts
  const img = await readFileAsImage(file)
  const canvas = document.createElement('canvas')

  const { sx, sy, s } = centerSquareCrop(img.width, img.height)
  canvas.width = size
  canvas.height = size

  const ctx = canvas.getContext('2d')
  if (!ctx) return file

  // Dessin + redimensionnement
  ctx.drawImage(img, sx, sy, s, s, 0, 0, size, size)

  const blob: Blob = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b as Blob), mimeType, quality)
  )

  const ext = mimeType === 'image/webp' ? 'webp' : 'jpg'
  const outName = file.name.replace(/\.(\w+)$/, '') + '_avatar.' + ext
  return blobToFile(blob, outName)
}

function readFileAsImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('FileReader error'))
    reader.onload = () => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('Image decode error'))
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}

function centerSquareCrop(w: number, h: number) {
  const s = Math.min(w, h)
  const sx = (w - s) / 2
  const sy = (h - s) / 2
  return { sx, sy, s }
}

function blobToFile(blob: Blob, fileName: string): File {
  return new File([blob], fileName, { type: blob.type, lastModified: Date.now() })
}
