import { BugReport, BugReportStatus, RequestStatus, StudyFile, Subject, SubjectRequest } from "@/lib/types";

async function parseJson<T>(res: Response): Promise<T> {
  const payload = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    const error = payload && typeof payload === "object" && "error" in payload
      ? String((payload as { error?: unknown }).error ?? "Request failed")
      : `Request failed (${res.status})`;
    throw new Error(error);
  }
  return payload;
}

function makeQuery(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value && value.trim()) {
      search.set(key, value);
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export async function apiListRequests(params?: {
  teacherId?: string;
  status?: RequestStatus;
  courseCode?: string;
}): Promise<SubjectRequest[]> {
  const qs = makeQuery({
    teacherId: params?.teacherId,
    status: params?.status,
    courseCode: params?.courseCode,
  });
  const res = await fetch(`/api/data/requests${qs}`, { cache: "no-store" });
  const data = await parseJson<{ requests: SubjectRequest[] }>(res);
  return data.requests ?? [];
}

export async function apiCreateRequest(payload: {
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
  department: string;
  subjectName: string;
  courseCode: string;
  message?: string;
}): Promise<SubjectRequest> {
  const res = await fetch("/api/data/requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await parseJson<{ request: SubjectRequest }>(res);
  return data.request;
}

export async function apiUpdateRequest(payload: {
  id?: string;
  courseCode?: string;
  status?: RequestStatus;
  driveFolderId?: string | null;
}): Promise<SubjectRequest | SubjectRequest[] | null> {
  const res = await fetch("/api/data/requests", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await parseJson<{ request?: SubjectRequest; requests?: SubjectRequest[] }>(res);
  if (data.request) return data.request;
  if (data.requests) return data.requests;
  return null;
}

export async function apiListFiles(courseCode?: string): Promise<StudyFile[]> {
  const qs = makeQuery({ courseCode });
  const res = await fetch(`/api/data/files${qs}`, { cache: "no-store" });
  const data = await parseJson<{ files: StudyFile[] }>(res);
  return data.files ?? [];
}

export async function apiCreateFile(file: StudyFile): Promise<StudyFile> {
  const res = await fetch("/api/data/files", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(file),
  });
  const data = await parseJson<{ file: StudyFile }>(res);
  return data.file;
}

export async function apiDeleteFile(fileId: string): Promise<number> {
  const qs = makeQuery({ fileId });
  const res = await fetch(`/api/data/files${qs}`, { method: "DELETE" });
  const data = await parseJson<{ deleted: number }>(res);
  return data.deleted ?? 0;
}

export async function apiDeleteFilesByCourse(courseCode: string): Promise<number> {
  const qs = makeQuery({ courseCode });
  const res = await fetch(`/api/data/files${qs}`, { method: "DELETE" });
  const data = await parseJson<{ deleted: number }>(res);
  return data.deleted ?? 0;
}

export async function apiListSubjects(): Promise<Subject[]> {
  const res = await fetch("/api/data/subjects", { cache: "no-store" });
  const data = await parseJson<{ subjects: Subject[] }>(res);
  return data.subjects ?? [];
}

export async function apiGetCourseSharing(courseCode: string): Promise<string[]> {
  const qs = makeQuery({ courseCode });
  const res = await fetch(`/api/data/sharing${qs}`, { cache: "no-store" });
  const data = await parseJson<{ teacherIds: string[] }>(res);
  return data.teacherIds ?? [];
}

export async function apiGetTeacherSharedCourses(teacherId: string): Promise<string[]> {
  const qs = makeQuery({ teacherId });
  const res = await fetch(`/api/data/sharing${qs}`, { cache: "no-store" });
  const data = await parseJson<{ courseCodes: string[] }>(res);
  return data.courseCodes ?? [];
}

export async function apiSetCourseSharing(
  courseCode: string,
  teacherIds: string[]
): Promise<string[]> {
  const res = await fetch("/api/data/sharing", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ courseCode, teacherIds }),
  });
  const data = await parseJson<{ sharing?: { teacherIds?: string[] }; teacherIds?: string[] }>(res);
  return data.sharing?.teacherIds ?? data.teacherIds ?? [];
}

export async function apiListBugReports(status?: BugReportStatus): Promise<BugReport[]> {
  const qs = makeQuery({ status });
  const res = await fetch(`/api/data/bugs${qs}`, { cache: "no-store" });
  const data = await parseJson<{ reports: BugReport[] }>(res);
  return data.reports ?? [];
}

export async function apiCreateBugReport(payload: {
  reporterName: string;
  reporterEmail: string;
  reporterRole: BugReport["reporterRole"];
  pagePath?: string;
  message: string;
}): Promise<BugReport> {
  const res = await fetch("/api/data/bugs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await parseJson<{ report: BugReport }>(res);
  return data.report;
}

export async function apiUpdateBugReport(
  id: string,
  status: BugReportStatus,
  adminNote?: string
): Promise<BugReport> {
  const res = await fetch("/api/data/bugs", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, status, adminNote }),
  });
  const data = await parseJson<{ report: BugReport }>(res);
  return data.report;
}
