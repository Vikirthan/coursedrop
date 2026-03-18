// ============================================================
// API: POST /api/drive/folder — Create subject folder on Drive
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createSubjectFolder } from "@/lib/drive";

export async function POST(req: NextRequest) {
  try {
    const { subjectName, courseCode } = await req.json();

    if (!subjectName || !courseCode) {
      return NextResponse.json(
        { error: "subjectName and courseCode are required" },
        { status: 400 }
      );
    }

    const folderId = await createSubjectFolder(subjectName, courseCode);

    return NextResponse.json({ folderId });
  } catch (err: unknown) {
    console.error("[drive/folder] Error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
