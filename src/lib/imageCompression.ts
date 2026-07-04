/**
 * Compresse une image côté client avant l'upload.
 * Redimensionne l'image si ses dimensions dépassent maxDimension (par défaut 1920px)
 * et la convertit au format WebP avec une qualité de 0.8 pour un excellent rapport qualité/taille.
 */
export async function compressImage(
  file: File,
  options: {
    maxDimension?: number;
    quality?: number;
    format?: string;
  } = {}
): Promise<File> {
  const { maxDimension = 1920, quality = 0.8, format = "image/webp" } = options;

  // Ignorer les fichiers non-images, les SVG (vectoriels) et les GIF (animations)
  if (
    !file.type.startsWith("image/") ||
    file.type === "image/svg+xml" ||
    file.type === "image/gif"
  ) {
    return file;
  }

  // Si exécuté côté serveur (SSR), retourner le fichier d'origine
  if (typeof window === "undefined") {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Redimensionner proportionnellement si les dimensions dépassent maxDimension
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }

            // Générer le nouveau nom de fichier avec l'extension appropriée (.webp)
            let newName = file.name;
            const dotIndex = newName.lastIndexOf(".");
            const baseName = dotIndex !== -1 ? newName.substring(0, dotIndex) : newName;
            const extension = format === "image/webp" ? "webp" : "jpg";
            newName = `${baseName}.${extension}`;

            const compressedFile = new File([blob], newName, {
              type: format,
              lastModified: Date.now(),
            });

            // Ne renvoyer le fichier compressé que s'il est effectivement plus léger
            if (compressedFile.size < file.size) {
              console.log(
                `[Image Compression] Compression réussie pour ${file.name} : ${(file.size / 1024).toFixed(1)} Ko -> ${(compressedFile.size / 1024).toFixed(1)} Ko`
              );
              resolve(compressedFile);
            } else {
              console.log(
                `[Image Compression] Image déjà optimisée ou compression inutile pour ${file.name}`
              );
              resolve(file);
            }
          },
          format,
          quality
        );
      };
      img.onerror = () => {
        resolve(file);
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      resolve(file);
    };
    reader.readAsDataURL(file);
  });
}
