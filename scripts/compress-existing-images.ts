import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

// Charger les variables d'environnement
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Erreur: NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant dans .env.local");
  process.exit(1);
}

// Initialiser le client Supabase avec la clé service_role pour outrepasser les règles RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Liste des buckets à traiter
const BUCKETS = [
  "program-images",
  "blog-images",
  "offer-images",
  "page-images",
  "slider-images",
  "brand-assets"
];

// Mode dry-run (simulation) par défaut, peut être désactivé avec l'argument --write
const isDryRun = !process.argv.includes("--write");

async function listAllFiles(bucket: string, prefix: string = ""): Promise<string[]> {
  const { data, error } = await supabase.storage.from(bucket).list(prefix, {
    limit: 100,
    sortBy: { column: "name", order: "asc" }
  });

  if (error) {
    console.error(`Erreur lors du listage du dossier "${prefix}" du bucket "${bucket}":`, error);
    return [];
  }

  let files: string[] = [];
  for (const item of data || []) {
    const itemPath = prefix ? `${prefix}/${item.name}` : item.name;
    // Si l'élément n'a pas de métadonnées, c'est un sous-dossier
    if (!item.id || !item.metadata) {
      const subFiles = await listAllFiles(bucket, itemPath);
      files = files.concat(subFiles);
    } else {
      files.push(itemPath);
    }
  }
  return files;
}

async function processImage(bucket: string, filePath: string) {
  const ext = filePath.split(".").pop()?.toLowerCase();
  
  // N'optimiser que les JPEG et PNG
  if (!ext || !["jpg", "jpeg", "png"].includes(ext)) {
    console.log(`[Skip] ${bucket}/${filePath} (format non supporté ou ignoré : ${ext})`);
    return;
  }

  try {
    // 1. Télécharger l'image depuis Supabase
    const { data: fileBlob, error: downloadError } = await supabase.storage
      .from(bucket)
      .download(filePath);

    if (downloadError || !fileBlob) {
      console.error(`[Erreur] Impossible de télécharger ${bucket}/${filePath}:`, downloadError);
      return;
    }

    // Convertir le Blob en Buffer Node.js
    const arrayBuffer = await fileBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 2. Traiter l'image avec Sharp
    let image = sharp(buffer);
    const metadata = await image.metadata();

    let width = metadata.width;
    let height = metadata.height;
    const maxDimension = 1920;
    let shouldResize = false;

    if (width && height && (width > maxDimension || height > maxDimension)) {
      shouldResize = true;
      if (width > height) {
        height = Math.round((height * maxDimension) / width);
        width = maxDimension;
      } else {
        width = Math.round((width * maxDimension) / height);
        height = maxDimension;
      }
    }

    if (shouldResize) {
      image = image.resize(width, height);
    }

    // Appliquer la compression selon le format d'origine
    let compressedBuffer: Buffer;
    if (ext === "png") {
      compressedBuffer = await image.png({ compressionLevel: 9, quality: 80 }).toBuffer();
    } else {
      compressedBuffer = await image.jpeg({ quality: 80, mozjpeg: true }).toBuffer();
    }

    // 3. Comparer les tailles et ré-uploader si plus léger
    if (compressedBuffer.length < buffer.length) {
      const gainPercent = Math.round((1 - compressedBuffer.length / buffer.length) * 100);
      const oldSizeKo = (buffer.length / 1024).toFixed(1);
      const newSizeKo = (compressedBuffer.length / 1024).toFixed(1);

      if (isDryRun) {
        console.log(
          `[Simulation] Compresserait ${bucket}/${filePath} : ${oldSizeKo} Ko -> ${newSizeKo} Ko (-${gainPercent}%)`
        );
      } else {
        // Uploader et écraser l'original
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, compressedBuffer, {
            upsert: true,
            contentType: fileBlob.type
          });

        if (uploadError) {
          console.error(`[Erreur] Échec de l'upload de ${bucket}/${filePath} :`, uploadError);
        } else {
          console.log(
            `[Succès] Compressé ${bucket}/${filePath} : ${oldSizeKo} Ko -> ${newSizeKo} Ko (-${gainPercent}%)`
          );
        }
      }
    } else {
      console.log(`[Skip] ${bucket}/${filePath} (déjà optimisé, aucune réduction de taille)`);
    }
  } catch (err) {
    console.error(`[Erreur] Lors du traitement de ${bucket}/${filePath} :`, err);
  }
}

async function main() {
  console.log(`=== Script de compression des images existantes ===`);
  console.log(`Mode : ${isDryRun ? "SIMULATION (Dry Run)" : "RÉEL (Production)"}`);
  console.log(`---------------------------------------------------\n`);

  for (const bucket of BUCKETS) {
    console.log(`Recherche d'images dans le bucket "${bucket}"...`);
    const files = await listAllFiles(bucket);
    console.log(`Trouvé ${files.length} fichiers dans "${bucket}".`);

    for (const file of files) {
      await processImage(bucket, file);
    }
    console.log("");
  }

  console.log("---------------------------------------------------");
  console.log("Traitement terminé.");
  if (isDryRun) {
    console.log("Rappel : Relancez le script avec l'option --write pour appliquer réellement les modifications.");
  }
}

main().catch((err) => {
  console.error("Erreur globale :", err);
  process.exit(1);
});
