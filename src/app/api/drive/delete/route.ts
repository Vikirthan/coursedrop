// ============================================================
// API: DELETE /api/drive/delete?fileId=XXX — Delete a file from Drive
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { deleteFileFromDrive } from "@/lib/drive";

export async function DELETE(req: NextRequest) {
  try {
    const fileId = req.nextUrl.searchParams.get("fileId");

    if (!fileId) {
      return NextResponse.json(
        { error: "fileId query param is required" },
        { status: 400 }
      );
    }

    await deleteFileFromDrive(fileId);

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("[drive/delete] Error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
