import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { google } from "googleapis";
import { getSupabaseAdminClient } from "@/lib/supabaseServer";

interface DeleteFolderPayload {
  folderId: string;
  teacherId: string;
  password: string;
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message.trim()) {
    return err.message;
  }
  if (err && typeof err === "object") {
    const maybe = err as {
      message?: unknown;
      details?: unknown;
      hint?: unknown;
      code?: unknown;
    };
    const parts = [maybe.message, maybe.details, maybe.hint].filter(
      (value): value is string =>
        typeof value === "string" && value.trim().length > 0
    );
    if (parts.length > 0) {
      return parts.join(" ");
    }
    if (typeof maybe.code === "string" && maybe.code.trim()) {
      return `Error (${maybe.code})`;
    }
  }
  return "Unknown error";
}

async function getDriveAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const keyStr = process.env.GOOGLE_PRIVATE_KEY;
  const sharedDriveId = process.env.GOOGLE_DRIVE_SHARED_DRIVE_ID;

  if (!email || !keyStr || !sharedDriveId) {
    throw new Error("Missing Google Drive configuration");
  }

  const key = keyStr.replace(/\\n/g, "\n");
  const auth = new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/drive"],
  });

  return { auth, sharedDriveId };
}

export async function DELETE(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<DeleteFolderPayload>;
    const folderId = (body.folderId ?? "").trim();
    const teacherId = (body.teacherId ?? "").trim();
    const password = body.password ?? "";

    if (!folderId || !teacherId || !password) {
      return NextResponse.json(
        { error: "folderId, teacherId, and password are required" },
        { status: 400 }
      );
    }

    // Verify teacher password
    const supabase = getSupabaseAdminClient();
    const { data: teacher, error: teacherErr } = await supabase
      .from("teacher_accounts")
      .select("password_hash")
      .eq("id", teacherId)
      .maybeSingle();

    if (teacherErr || !teacher) {
      return NextResponse.json(
        { error: "Teacher not found" },
        { status: 404 }
      );
    }

    const passwordOk = await compare(password, teacher.password_hash);
    if (!passwordOk) {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      );
    }

    // Delete folder from Google Drive
    const { auth, sharedDriveId } = await getDriveAuth();
    const drive = google.drive({ version: "v3", auth });

    // Recursively delete all files and subfolders
    async function deleteFolderContents(folderId: string): Promise<void> {
      const res = await drive.files.list({
        q: `'${folderId}' in parents`,
        spaces: "drive",
        pageSize: 100,
        fields: "files(id, mimeType)",
        supportsAllDrives: true,
      });

      const files = res.data.files ?? [];
      for (const file of files) {
        if (file.id) {
          if (file.mimeType === "application/vnd.google-apps.folder") {
            // Recursively delete subfolder
            await deleteFolderContents(file.id);
          }
          // Delete file or folder
          await drive.files.delete({
            fileId: file.id,
            supportsAllDrives: true,
          });
        }
      }
    }

    // Delete all contents
    await deleteFolderContents(folderId);

    // Delete the folder itself
    await drive.files.delete({
      fileId: folderId,
      supportsAllDrives: true,
    });

    return NextResponse.json(
      { success: true, message: "Folder and all contents deleted successfully" },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("[drive/delete-folder] Error:", err);
    const message = getErrorMessage(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
