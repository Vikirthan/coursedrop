// ============================================================
// API: GET /api/drive/download?fileId=XXX — Single file download
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getFileDownloadStream } from "@/lib/drive";

export async function GET(req: NextRequest) {
  try {
    const fileId = req.nextUrl.searchParams.get("fileId");

    if (!fileId) {
      return NextResponse.json(
        { error: "fileId query param is required" },
        { status: 400 }
      );
    }

    const { stream, name, mimeType } = await getFileDownloadStream(fileId);

    // Collect stream into buffer (Next.js needs a Response, not a piped stream)
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const body = Buffer.concat(chunks);

    return new NextResponse(body, {
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(name)}"`,
        "Content-Length": String(body.length),
      },
    });
  } catch (err: unknown) {
    console.error("[drive/download] Error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
