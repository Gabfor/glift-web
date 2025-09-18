// Utilitaire de conversion client-side vers un format web safe (JPEG/WebP/PNG/AVIF)
// - HEIC/HEIF via heic2any (si installé)
// - Redimensionnement optionnel via Canvas
// - Sortie: File prêt pour upload

export type WebSafeType = "image/jpeg" | "image/png" | "image/webp" | "image/avif";

type ConvertOpts = {
  /** Type cible préféré (fallback automatique si non dispo) */
  preferredType?: WebSafeType;
  /** Qualité (0..1) pour JPEG/WebP/AVIF */
  quality?: number;
  /** Dimension max (largeur/hauteur). 0 = pas de resize */
  maxDim?: number;
  /** Nom de base du fichier de sortie (sans extension) */
  fileNameBase?: string;
};

const EXT_BY_MIME: Record<WebSafeType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

const HEIC_TYPES = new Set([
  "image/heic",
  "image/heif",
  "image/x-heic",
  "image/x-heif",
]);

function isHeicLike(file: File): boolean {
  const name = file.name?.toLowerCase() || "";
  const byExt = name.endsWith(".heic") || name.endsWith(".heif");
  return HEIC_TYPES.has(file.type) || byExt;
}

function getTargetSize(w: number, h: number, maxDim: number) {
  if (!maxDim || maxDim <= 0) return { w, h };
  const scale = Math.min(1, maxDim / Math.max(w, h));
  return { w: Math.round(w * scale), h: Math.round(h * scale) };
}

async function fileToImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.decoding = "async";
  img.src = url;
  try {
    await img.decode();
  } finally {
    // Donne le temps au decode; révoque un peu après si tu veux
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
  return img;
}

export async function toWebSafeImage(
  file: File,
  opts: ConvertOpts = {}
): Promise<File> {
  const {
    preferredType = "image/jpeg",
    quality = 0.9,
    maxDim = 1200,
    fileNameBase = "avatar",
  } = opts;

  let blobOut: Blob | null = null;
  let outMime: WebSafeType = preferredType;

  // 1) HEIC/HEIF : conversion via heic2any si possible
  if (isHeicLike(file)) {
    try {
      // Import dynamique (nécessite npm i heic2any + stub de types)
      const heic2any = (await import("heic2any")).default as any;
      const converted = await heic2any({
        blob: file,
        toType: "image/jpeg",
        quality, // 0..1
      });
      const b = Array.isArray(converted) ? (converted[0] as Blob) : (converted as Blob);
      if (b && b.size > 0) {
        blobOut = b;
        outMime = "image/jpeg";
      }
    } catch (e) {
      // Si heic2any n'est pas installé ou échoue, on tombera dans le chemin Canvas
      console.warn("Conversion HEIC via heic2any indisponible, tentative via Canvas (peut échouer)", e);
    }
  }

  // 2) Formats décodables par le navigateur -> Canvas
  if (!blobOut) {
    const img = await fileToImage(file); // peut throw si format non décodable nativement
    const { w, h } = getTargetSize(
      img.naturalWidth || img.width,
      img.naturalHeight || img.height,
      maxDim
    );

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D non disponible");
    ctx.drawImage(img, 0, 0, w, h);

    // Chaîne de candidates strictement typée
    const chain: WebSafeType[] = [preferredType, "image/webp", "image/jpeg", "image/png"];

    for (const candidate of chain) {
      const b: Blob | null = await new Promise((resolve) =>
        canvas.toBlob(resolve, candidate, quality)
      );
      if (b && b.size > 0) {
        blobOut = b;
        outMime = candidate;
        break;
      }
    }

    if (!blobOut) {
      // Dernier fallback PNG (typé)
      const b: Blob | null = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/png")
      );
      if (!b) throw new Error("Conversion image impossible (toBlob)");
      blobOut = b;
      outMime = "image/png";
    }
  }

  const ext = EXT_BY_MIME[outMime];
  const safeName = `${fileNameBase}.${ext}`;
  return new File([blobOut!], safeName, { type: outMime });
}
