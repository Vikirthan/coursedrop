// ============================================================
// CourseDrop — Core Type Definitions
// ============================================================

export type UserRole = "admin" | "teacher" | "student";

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  email: string;
  department?: string;
  designation?: string;
}

export type RequestStatus = "pending" | "approved" | "rejected";

export interface SubjectRequest {
  id: string;
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
  department: string;
  subjectName: string;
  courseCode: string;
  message?: string;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
  /** Google Drive folder ID for this subject (set on approval) */
  driveFolderId?: string;
}

export interface StudyFile {
  id: string;
  name: string;
  type: string; // e.g. "pdf", "pptx"
  size: number; // bytes
  section?: string;
  courseCode: string;
  subjectName: string;
  uploadedBy: string; // teacher id
  uploadedByName: string;
  uploadDate: string;
  /** Google Drive file ID */
  driveFileId: string;
  /** Google Drive download link */
  driveDownloadUrl: string;
  /** Thumbnail / preview link */
  driveThumbnailUrl?: string;
}

export interface Subject {
  courseCode: string;
  subjectName: string;
  department: string;
  fileCount: number;
}

export interface CourseShareAccess {
  courseCode: string;
  teacherIds: string[];
  updatedAt: string;
}

export type BugReportStatus = "open" | "triaged" | "resolved";

export interface BugReport {
  id: string;
  reporterName: string;
  reporterEmail: string;
  reporterRole: UserRole | "guest";
  pagePath?: string;
  message: string;
  status: BugReportStatus;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
}
