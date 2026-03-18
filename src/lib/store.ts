// ============================================================
// CourseDrop — In-memory Store (simulates a DB with localStorage)
// ============================================================

import { SubjectRequest, StudyFile, RequestStatus, Subject } from "./types";
import { SEED_REQUESTS, SEED_FILES } from "./mockData";

const REQUESTS_KEY = "coursedrop_requests";
const FILES_KEY = "coursedrop_files";

// ---- helpers ----
function isBrowser() {
  return typeof window !== "undefined";
}

function loadJSON<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON<T>(key: string, data: T) {
  if (!isBrowser()) return;
  localStorage.setItem(key, JSON.stringify(data));
}

// ---- Subject Requests ----

export function getRequests(): SubjectRequest[] {
  return loadJSON<SubjectRequest[]>(REQUESTS_KEY, SEED_REQUESTS);
}

export function addRequest(req: SubjectRequest) {
  const all = getRequests();
  all.push(req);
  saveJSON(REQUESTS_KEY, all);
}

export function updateRequestStatus(
  id: string,
  status: RequestStatus,
  driveFolderId?: string
) {
  const all = getRequests().map((r) =>
    r.id === id
      ? { ...r, status, updatedAt: new Date().toISOString(), ...(driveFolderId ? { driveFolderId } : {}) }
      : r
  );
  saveJSON(REQUESTS_KEY, all);
}

export function getRequestsByTeacher(teacherId: string): SubjectRequest[] {
  return getRequests().filter((r) => r.teacherId === teacherId);
}

export function getApprovedCourses(teacherId: string): string[] {
  return getRequests()
    .filter((r) => r.teacherId === teacherId && r.status === "approved")
    .map((r) => r.courseCode);
}

/** Returns full approved SubjectRequest objects for a teacher */
export function getApprovedSubjects(teacherId: string): SubjectRequest[] {
  return getRequests().filter(
    (r) => r.teacherId === teacherId && r.status === "approved"
  );
}

/** Get the Drive folder ID for a specific course code */
export function getDriveFolderId(courseCode: string): string | undefined {
  return getRequests().find(
    (r) => r.courseCode === courseCode && r.status === "approved"
  )?.driveFolderId;
}

/** Save/refresh the Drive folder ID for an approved course. */
export function setDriveFolderIdForCourse(
  courseCode: string,
  driveFolderId: string
) {
  const all = getRequests().map((r) =>
    r.courseCode === courseCode && r.status === "approved"
      ? { ...r, driveFolderId, updatedAt: new Date().toISOString() }
      : r
  );
  saveJSON(REQUESTS_KEY, all);
}

// ---- Files ----

export function getFiles(): StudyFile[] {
  return loadJSON<StudyFile[]>(FILES_KEY, SEED_FILES);
}

export function getFilesByCourse(courseCode: string): StudyFile[] {
  return getFiles().filter((f) => f.courseCode === courseCode);
}

export function addFile(file: StudyFile) {
  const all = getFiles();
  all.push(file);
  saveJSON(FILES_KEY, all);
}

export function deleteFile(fileId: string) {
  const all = getFiles().filter((f) => f.id !== fileId);
  saveJSON(FILES_KEY, all);
}

export function getAllSubjects(): Subject[] {
  const files = getFiles();
  const requests = getRequests().filter((r) => r.status === "approved");
  const map = new Map<string, { subjectName: string; department: string; fileCount: number }>();

  // from approved requests (might have 0 files)
  for (const r of requests) {
    if (!map.has(r.courseCode)) {
      map.set(r.courseCode, { subjectName: r.subjectName, department: r.department, fileCount: 0 });
    }
  }

  // count files
  for (const f of files) {
    const entry = map.get(f.courseCode);
    if (entry) {
      entry.fileCount++;
    } else {
      map.set(f.courseCode, { subjectName: f.subjectName, department: "", fileCount: 1 });
    }
  }

  return Array.from(map.entries()).map(([courseCode, v]) => ({
    courseCode,
    ...v,
  }));
}

// ---- Reset (useful for dev) ----

export function resetStore() {
  if (!isBrowser()) return;
  localStorage.removeItem(REQUESTS_KEY);
  localStorage.removeItem(FILES_KEY);
}
