// ============================================================
// CourseDrop — Google Drive Service Layer (Mock)
// ============================================================
//
// This file provides a MOCK implementation of the Google Drive
// integration. Every function has clear documentation showing
// exactly where the real Google Drive API calls should go.
//
// To connect a real Google Drive backend:
//   1. Set up a Google Cloud Project & enable the Drive API.
//   2. Create a service account (or OAuth2 flow).
//   3. Share a root "CourseDrop" folder with the service account.
//   4. Replace every mock function body below with actual
//      googleapis calls (e.g. drive.files.list, drive.files.create).
// ============================================================

import { StudyFile } from "./types";

const ROOT_FOLDER_NAME = "CourseDrop";

/**
 * Ensure a course-code folder exists inside the root.
 *
 * REAL IMPLEMENTATION:
 *   1. List children of the root folder with name === courseCode.
 *   2. If not found, create it with mimeType
 *      'application/vnd.google-apps.folder'.
 *   3. Return the folder's Drive ID.
 */
export async function ensureCourseFolderExists(
  courseCode: string
): Promise<string> {
  console.log(
    `[GoogleDrive MOCK] ensureCourseFolderExists("${ROOT_FOLDER_NAME}/${courseCode}")`
  );
  // Return a fake folder ID
  return `mock-folder-${courseCode}`;
}

/**
 * Upload a file to the course-code folder.
 *
 * REAL IMPLEMENTATION:
 *   1. Call ensureCourseFolderExists to get parent ID.
 *   2. Use drive.files.create with { parents: [folderId] }
 *      and a media body from the File blob.
 *   3. Set the file to "anyone with the link" can *view* so
 *      students can download without auth.
 *   4. Return the new file's metadata (id, webContentLink, etc.).
 */
export async function uploadFileToDrive(
  file: File,
  courseCode: string
): Promise<{ driveFileId: string; driveDownloadUrl: string }> {
  console.log(
    `[GoogleDrive MOCK] uploadFileToDrive("${file.name}", "${courseCode}")`
  );
  // Simulate a 500ms upload delay
  await new Promise((r) => setTimeout(r, 500));
  return {
    driveFileId: `mock-${Date.now()}`,
    driveDownloadUrl: "#",
  };
}

/**
 * List all files inside a course-code folder.
 *
 * REAL IMPLEMENTATION:
 *   1. Resolve the folder ID for the courseCode.
 *   2. drive.files.list with q: `'${folderId}' in parents and trashed=false`
 *   3. Map results to StudyFile objects.
 */
export async function listFilesInCourse(
  _courseCode: string
): Promise<StudyFile[]> {
  console.log(`[GoogleDrive MOCK] listFilesInCourse("${_courseCode}")`);
  return []; // real impl returns mapped results
}

/**
 * Delete a file by its Google Drive file ID.
 *
 * REAL IMPLEMENTATION:
 *   drive.files.delete({ fileId })
 */
export async function deleteFileFromDrive(driveFileId: string): Promise<void> {
  console.log(`[GoogleDrive MOCK] deleteFileFromDrive("${driveFileId}")`);
  await new Promise((r) => setTimeout(r, 300));
}

/**
 * Get a direct download URL for a file.
 *
 * REAL IMPLEMENTATION:
 *   Return `https://drive.google.com/uc?export=download&id=${driveFileId}`
 *   or use drive.files.get with alt=media for server-side proxying.
 */
export function getDownloadUrl(driveFileId: string): string {
  console.log(`[GoogleDrive MOCK] getDownloadUrl("${driveFileId}")`);
  return `#download-${driveFileId}`;
}
