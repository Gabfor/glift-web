import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const type = (formData.get("type") as string) || "file";

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const fileExt = file.name.split(".").pop() || "bin";
    const timestamp = Date.now();
    const cleanBaseName = file.name
      .replace(/\.[^/.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_");

    const storagePath = `${type}_${timestamp}_${cleanBaseName}.${fileExt}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await (supabase as any)
      .storage
      .from("ringtones")
      .upload(storagePath, buffer, {
        contentType: file.type || (fileExt === "svg" ? "image/svg+xml" : "application/octet-stream"),
        upsert: true,
      });

    if (uploadError) {
      console.error("[upload-ringtone] Supabase storage error:", uploadError);
      return NextResponse.json(
        { error: uploadError.message || "Erreur lors de l'upload du fichier" },
        { status: 500 }
      );
    }

    const { data: publicUrlData } = (supabase as any)
      .storage
      .from("ringtones")
      .getPublicUrl(storagePath);

    return NextResponse.json({
      success: true,
      publicUrl: publicUrlData.publicUrl,
      fileName: file.name,
      storagePath,
    });
  } catch (error: any) {
    console.error("[upload-ringtone] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Erreur serveur inattendue" },
      { status: 500 }
    );
  }
}

