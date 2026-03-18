// ============================================================
// API: POST /api/drive/download-zip — Batch / selective ZIP download
// Body: { fileIds: string[], zipName?: string }
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getFileDownloadStream } from "@/lib/drive";
import archiver from "archiver";

export async function POST(req: NextRequest) {
  try {
    const { fileIds, zipName } = (await req.json()) as {
      fileIds: string[];
      zipName?: string;
    };

    if (!fileIds || fileIds.length === 0) {
      return NextResponse.json(
        { error: "fileIds array is required" },
        { status: 400 }
      );
    }

    // Create ZIP archive in memory
    const archive = archiver("zip", { zlib: { level: 5 } });

    // We collect the archive output into buffers
    const chunks: Buffer[] = [];
    archive.on("data", (chunk: Buffer) => chunks.push(chunk));

    // Add each file to the archive
    const nameCount = new Map<string, number>();
    for (const id of fileIds) {
      try {
        const { stream, name } = await getFileDownloadStream(id);

        // Handle duplicate filenames
        const count = nameCount.get(name) ?? 0;
        nameCount.set(name, count + 1);
        const finalName = count > 0
          ? `${name.replace(/(\.[^.]+)$/, ` (${count})$1`)}`
          : name;

        // Collect stream into buffer and append
        const fileChunks: Buffer[] = [];
        for await (const chunk of stream) {
          fileChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        archive.append(Buffer.concat(fileChunks), { name: finalName });
      } catch (fileErr) {
        console.warn(`[download-zip] Skipping file ${id}:`, fileErr);
      }
    }

    await archive.finalize();

    // Wait for all data events to fire
    await new Promise<void>((resolve) => archive.on("end", resolve));

    const body = Buffer.concat(chunks);
    const fileName = zipName ?? "CourseDrop-Materials";

    return new NextResponse(body, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(fileName)}.zip"`,
        "Content-Length": String(body.length),
      },
    });
  } catch (err: unknown) {
    console.error("[drive/download-zip] Error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
