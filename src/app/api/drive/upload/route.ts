// ============================================================
// API: POST /api/drive/upload — Upload file to Drive
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import {
  createSubjectFolder,
  uploadFileToDrive,
  type UploadResult,
} from "@/lib/drive";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const courseCode = formData.get("courseCode") as string | null;
    const folderId = formData.get("folderId") as string | null;
    const uploadedBy = formData.get("uploadedBy") as string | null;
    const uploadedByName = formData.get("uploadedByName") as string | null;
    const subjectName = formData.get("subjectName") as string | null;
    const section = formData.get("section") as string | null;

    if (!file || !courseCode) {
      return NextResponse.json(
        { error: "file and courseCode are required" },
        { status: 400 }
      );
    }

    const resolvedSubjectName = subjectName ?? courseCode;
    let targetFolderId =
      folderId && folderId.trim().length > 0
        ? folderId
        : await createSubjectFolder(resolvedSubjectName, courseCode);

    const buffer = Buffer.from(await file.arrayBuffer());
    const shouldRetryWithSharedFolder = (message: string): boolean =>
      /Service Accounts do not have storage quota|cannot store files in My Drive|File not found|notFound/i.test(
        message
      );

    let result: UploadResult;
    try {
      result = await uploadFileToDrive(
        targetFolderId,
        file.name,
        file.type || "application/octet-stream",
        buffer
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Upload failed";

      // Auto-heal requests that still point to an old/non-shared folder ID.
      if (folderId && shouldRetryWithSharedFolder(message)) {
        targetFolderId = await createSubjectFolder(resolvedSubjectName, courseCode);
        result = await uploadFileToDrive(
          targetFolderId,
          file.name,
          file.type || "application/octet-stream",
          buffer
        );
      } else {
        throw err;
      }
    }

    // Return file metadata so the client can store it
    const fileMeta = {
      name: file.name,
      type: file.name.split(".").pop() ?? "",
      size: file.size,
      section: section?.trim() || undefined,
      courseCode,
      subjectName: resolvedSubjectName,
      uploadedBy: uploadedBy ?? "unknown",
      uploadedByName: uploadedByName ?? "Unknown",
      uploadDate: new Date().toISOString(),
      driveFileId: result.fileId,
      driveDownloadUrl: result.downloadUrl,
    };

    return NextResponse.json({ file: fileMeta, folderIdUsed: targetFolderId });
  } catch (err: unknown) {
    console.error("[drive/upload] Error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
