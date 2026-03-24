// ============================================================
// CourseDrop — In-memory Store (simulates a DB with localStorage)
// ============================================================

import {
  SubjectRequest,
  StudyFile,
  RequestStatus,
  Subject,
  CourseShareAccess,
  BugReport,
  BugReportStatus,
} from "./types";

const REQUESTS_KEY = "coursedrop_requests";
const FILES_KEY = "coursedrop_files";
const COURSE_SHARING_KEY = "coursedrop_course_sharing";
const BUG_REPORTS_KEY = "coursedrop_bug_reports";

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

function dedupe(values: string[]): string[] {
  return Array.from(new Set(values));
}

function createLocalId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ---- Subject Requests ----

export function getRequests(): SubjectRequest[] {
  return loadJSON<SubjectRequest[]>(REQUESTS_KEY, []);
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

  // If a course has no approved request left, remove stale sharing config.
  const changed = all.find((r) => r.id === id);
  if (changed && !all.some((r) => r.courseCode === changed.courseCode && r.status === "approved")) {
    setSharedTeacherIdsForCourse(changed.courseCode, []);
  }
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

export function getOwnedApprovedCourseCodes(teacherId: string): string[] {
  return dedupe(getApprovedSubjects(teacherId).map((r) => r.courseCode));
}

export function isCourseOwnedByTeacher(
  courseCode: string,
  teacherId: string
): boolean {
  return getRequests().some(
    (r) =>
      r.courseCode === courseCode &&
      r.teacherId === teacherId &&
      r.status === "approved"
  );
}

export function getOwnerTeacherIdsForCourse(courseCode: string): string[] {
  return dedupe(
    getRequests()
      .filter((r) => r.courseCode === courseCode && r.status === "approved")
      .map((r) => r.teacherId)
  );
}

export function getCourseSharing(): CourseShareAccess[] {
  return loadJSON<CourseShareAccess[]>(COURSE_SHARING_KEY, []);
}

export function getSharedTeacherIdsForCourse(courseCode: string): string[] {
  const entry = getCourseSharing().find((s) => s.courseCode === courseCode);
  return entry ? dedupe(entry.teacherIds) : [];
}

export function setSharedTeacherIdsForCourse(
  courseCode: string,
  teacherIds: string[]
) {
  const ownerIds = new Set(getOwnerTeacherIdsForCourse(courseCode));
  const normalized = dedupe(teacherIds.filter((id) => id && !ownerIds.has(id)));

  const all = getCourseSharing().filter((s) => s.courseCode !== courseCode);
  if (normalized.length > 0) {
    all.push({
      courseCode,
      teacherIds: normalized,
      updatedAt: new Date().toISOString(),
    });
  }

  saveJSON(COURSE_SHARING_KEY, all);
}

export function getSharedCourseCodesForTeacher(teacherId: string): string[] {
  return dedupe(
    getCourseSharing()
      .filter((s) => s.teacherIds.includes(teacherId))
      .map((s) => s.courseCode)
  );
}

export function canTeacherAccessCourse(
  teacherId: string,
  courseCode: string
): boolean {
  if (isCourseOwnedByTeacher(courseCode, teacherId)) {
    return true;
  }
  return getSharedTeacherIdsForCourse(courseCode).includes(teacherId);
}

/**
 * Courses a teacher can access:
 * - own approved requests
 * - admin-shared access on approved courses owned by other teachers
 */
export function getAccessibleSubjects(teacherId: string): SubjectRequest[] {
  const approved = getRequests().filter((r) => r.status === "approved");
  const byCourse = new Map<string, SubjectRequest>();

  for (const own of approved.filter((r) => r.teacherId === teacherId)) {
    byCourse.set(own.courseCode, own);
  }

  const sharedCourseCodes = getSharedCourseCodesForTeacher(teacherId);
  for (const code of sharedCourseCodes) {
    if (byCourse.has(code)) continue;
    const sharedSubject = approved.find((r) => r.courseCode === code);
    if (sharedSubject) {
      byCourse.set(code, sharedSubject);
    }
  }

  return Array.from(byCourse.values());
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

export function clearDriveFolderIdForCourse(courseCode: string) {
  const all = getRequests().map((r) => {
    if (r.courseCode !== courseCode || r.status !== "approved") {
      return r;
    }

    const { driveFolderId: _ignored, ...rest } = r;
    return { ...rest, updatedAt: new Date().toISOString() };
  });

  saveJSON(REQUESTS_KEY, all);
}

// ---- Files ----

export function getFiles(): StudyFile[] {
  return loadJSON<StudyFile[]>(FILES_KEY, []);
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

export function deleteFilesByCourse(courseCode: string) {
  const all = getFiles().filter((f) => f.courseCode !== courseCode);
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

// ---- Bug Reports ----

export function getBugReports(): BugReport[] {
  const all = loadJSON<BugReport[]>(BUG_REPORTS_KEY, []);
  return [...all].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function addBugReport(payload: {
  reporterName: string;
  reporterEmail: string;
  reporterRole: BugReport["reporterRole"];
  pagePath?: string;
  message: string;
}): BugReport {
  const now = new Date().toISOString();
  const report: BugReport = {
    id: createLocalId("bug"),
    reporterName: payload.reporterName.trim() || "Anonymous",
    reporterEmail: payload.reporterEmail.trim(),
    reporterRole: payload.reporterRole,
    pagePath: payload.pagePath?.trim() || undefined,
    message: payload.message.trim(),
    status: "open",
    createdAt: now,
    updatedAt: now,
  };

  const all = getBugReports();
  all.push(report);
  saveJSON(BUG_REPORTS_KEY, all);
  return report;
}

export function updateBugReportStatus(
  id: string,
  status: BugReportStatus,
  adminNote?: string
) {
  const all = getBugReports().map((report) =>
    report.id === id
      ? {
          ...report,
          status,
          adminNote: adminNote?.trim() || report.adminNote,
          updatedAt: new Date().toISOString(),
        }
      : report
  );

  saveJSON(BUG_REPORTS_KEY, all);
}

// ---- Reset (useful for dev) ----

export function resetStore() {
  if (!isBrowser()) return;
  localStorage.removeItem(REQUESTS_KEY);
  localStorage.removeItem(FILES_KEY);
  localStorage.removeItem(COURSE_SHARING_KEY);
  localStorage.removeItem(BUG_REPORTS_KEY);
}
