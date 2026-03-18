// ============================================================
// CourseDrop — Google Drive Service Layer (server-only)
// ============================================================

import { google, drive_v3 } from "googleapis";
import { Readable } from "stream";

// ---- Auth ----

const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive";
const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ?? "";
const SERVICE_ACCOUNT_KEY = (process.env.GOOGLE_PRIVATE_KEY ?? "").replace(
  /\\n/g,
  "\n"
);
const OAUTH_CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID ?? "";
const OAUTH_CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET ?? "";
const OAUTH_REFRESH_TOKEN = process.env.GOOGLE_OAUTH_REFRESH_TOKEN ?? "";
const MASTER_FOLDER_ID = process.env.GOOGLE_DRIVE_MASTER_FOLDER_ID ?? "";
const SHARED_DRIVE_ID = process.env.GOOGLE_DRIVE_SHARED_DRIVE_ID ?? "";
const DELEGATED_USER_EMAIL = process.env.GOOGLE_DRIVE_DELEGATED_USER_EMAIL ?? "";

function getDriveClient(): drive_v3.Drive {
  // Personal Google accounts should use OAuth refresh tokens.
  if (OAUTH_CLIENT_ID && OAUTH_CLIENT_SECRET && OAUTH_REFRESH_TOKEN) {
    const auth = new google.auth.OAuth2(OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET);
    auth.setCredentials({ refresh_token: OAUTH_REFRESH_TOKEN });
    return google.drive({ version: "v3", auth });
  }

  if (!SERVICE_ACCOUNT_EMAIL || !SERVICE_ACCOUNT_KEY) {
    throw new Error(
      "Missing Drive auth configuration. Set GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, and GOOGLE_OAUTH_REFRESH_TOKEN for personal accounts, or GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY for service-account mode."
    );
  }

  const auth = new google.auth.JWT({
    email: SERVICE_ACCOUNT_EMAIL,
    key: SERVICE_ACCOUNT_KEY,
    scopes: [DRIVE_SCOPE],
    ...(DELEGATED_USER_EMAIL ? { subject: DELEGATED_USER_EMAIL } : {}),
  });
  return google.drive({ version: "v3", auth });
}

function getMasterParentId(): string {
  const parentId = MASTER_FOLDER_ID || SHARED_DRIVE_ID;

  if (!parentId) {
    throw new Error(
      "Missing GOOGLE_DRIVE_MASTER_FOLDER_ID. Point it to a folder in a Shared Drive, or set GOOGLE_DRIVE_SHARED_DRIVE_ID to use the Shared Drive root."
    );
  }

  return parentId;
}

function mapDriveError(err: unknown): Error {
  const message = err instanceof Error ? err.message : "Unknown Google Drive error";

  if (/unauthorized_client/i.test(message)) {
    return new Error(
      "unauthorized_client: Domain-wide delegation works only on Google Workspace. For personal Gmail, clear GOOGLE_DRIVE_DELEGATED_USER_EMAIL and use OAuth env vars (GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_OAUTH_REFRESH_TOKEN)."
    );
  }

  if (
    /DECODER routines::unsupported|PEM|private key|secretOrPrivateKey/i.test(
      message
    )
  ) {
    return new Error(
      "GOOGLE_PRIVATE_KEY is invalid. Use the full private_key value from the downloaded service-account JSON (including BEGIN/END PRIVATE KEY), and store newlines as \\n."
    );
  }

  if (/Service Accounts do not have storage quota/i.test(message)) {
    return new Error(
      "Google Drive rejected the upload because service accounts cannot store files in My Drive. Use a Shared Drive folder (GOOGLE_DRIVE_MASTER_FOLDER_ID or GOOGLE_DRIVE_SHARED_DRIVE_ID), or switch to OAuth env vars for personal Gmail accounts."
    );
  }

  return err instanceof Error ? err : new Error(message);
}

// ---- Folder Operations ----

/** Create a sub-folder inside the master folder. Returns the new folder ID. */
export async function createSubjectFolder(
  subjectName: string,
  courseCode: string
): Promise<string> {
  const drive = getDriveClient();
  const folderName = `${courseCode} — ${subjectName}`;
  const parentId = getMasterParentId();
  const escapedFolderName = folderName
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'");

  try {
    const existing = await drive.files.list({
      q: `'${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false and name = '${escapedFolderName}'`,
      fields: "files(id)",
      pageSize: 1,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    const existingId = existing.data.files?.[0]?.id;
    if (existingId) {
      return existingId;
    }

    const res = await drive.files.create({
      requestBody: {
        name: folderName,
        mimeType: "application/vnd.google-apps.folder",
        parents: [parentId],
      },
      fields: "id",
      supportsAllDrives: true,
    });

    return res.data.id ?? "";
  } catch (err: unknown) {
    throw mapDriveError(err);
  }
}

// ---- Upload ----

export interface UploadResult {
  fileId: string;
  webViewLink: string;
  downloadUrl: string;
}

/** Upload a file buffer into a specific Drive folder. */
export async function uploadFileToDrive(
  folderId: string,
  fileName: string,
  mimeType: string,
  buffer: Buffer
): Promise<UploadResult> {
  const drive = getDriveClient();

  try {
    const res = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [folderId],
      },
      media: {
        mimeType,
        body: Readable.from(buffer),
      },
      fields: "id,webViewLink",
      supportsAllDrives: true,
    });

    const fileId = res.data.id ?? "";
    const webViewLink = res.data.webViewLink ?? "";
    const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

    return { fileId, webViewLink, downloadUrl };
  } catch (err: unknown) {
    throw mapDriveError(err);
  }
}

// ---- List ----

export interface DriveFileInfo {
  id: string;
  name: string;
  mimeType: string;
  size: string;
}

/** List all files inside a folder (non-trashed). */
export async function listFilesInFolder(
  folderId: string
): Promise<DriveFileInfo[]> {
  const drive = getDriveClient();

  try {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: "files(id,name,mimeType,size)",
      pageSize: 1000,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    return (res.data.files ?? []).map((f) => ({
      id: f.id ?? "",
      name: f.name ?? "",
      mimeType: f.mimeType ?? "",
      size: f.size ?? "0",
    }));
  } catch (err: unknown) {
    throw mapDriveError(err);
  }
}

// ---- Download ----

/** Get a readable stream for a file's content. */
export async function getFileDownloadStream(
  fileId: string
): Promise<{ stream: Readable; name: string; mimeType: string }> {
  const drive = getDriveClient();

  try {
    // Get metadata first
    const meta = await drive.files.get({
      fileId,
      fields: "name,mimeType",
      supportsAllDrives: true,
    });

    const res = await drive.files.get(
      { fileId, alt: "media", supportsAllDrives: true },
      { responseType: "stream" }
    );

    return {
      stream: res.data as unknown as Readable,
      name: meta.data.name ?? "download",
      mimeType: meta.data.mimeType ?? "application/octet-stream",
    };
  } catch (err: unknown) {
    throw mapDriveError(err);
  }
}

// ---- Delete ----

/** Permanently delete a file from Drive. */
export async function deleteFileFromDrive(fileId: string): Promise<void> {
  const drive = getDriveClient();

  try {
    await drive.files.delete({ fileId, supportsAllDrives: true });
  } catch (err: unknown) {
    throw mapDriveError(err);
  }
}
