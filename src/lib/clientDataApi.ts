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

function normalizeTeacherKeys(keys: Array<string | undefined>): string[] {
  return Array.from(
    new Set(keys.map((key) => (key ?? "").trim()).filter((key) => key.length > 0))
  );
}

function withCacheBuster(url: string): string {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}_ts=${Date.now()}`;
}

function mergeNoStoreHeaders(existing?: HeadersInit): Headers {
  const headers = new Headers(existing);
  if (!headers.has("Cache-Control")) {
    headers.set("Cache-Control", "no-cache");
  }
  if (!headers.has("Pragma")) {
    headers.set("Pragma", "no-cache");
  }
  return headers;
}

async function fetchNoStore(url: string, init: RequestInit = {}): Promise<Response> {
  return fetch(withCacheBuster(url), {
    ...init,
    cache: "no-store",
    headers: mergeNoStoreHeaders(init.headers),
  });
}

export async function apiListRequests(params?: {
  teacherId?: string;
  teacherIds?: string[];
  teacherEmail?: string;
  teacherEmails?: string[];
  status?: RequestStatus;
  courseCode?: string;
}): Promise<SubjectRequest[]> {
  const teacherIds = normalizeTeacherKeys([
    ...(params?.teacherIds ?? []),
    params?.teacherId,
  ]);
  const teacherEmails = normalizeTeacherKeys([
    ...(params?.teacherEmails ?? []),
    params?.teacherEmail,
  ]).map((email) => email.toLowerCase());

  const qs = makeQuery({
    teacherId: teacherIds.length > 0 ? teacherIds.join(",") : undefined,
    teacherEmail: teacherEmails.length > 0 ? teacherEmails.join(",") : undefined,
    status: params?.status,
    courseCode: params?.courseCode,
  });
  const res = await fetchNoStore(`/api/data/requests${qs}`);
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
  const res = await fetchNoStore(`/api/data/files${qs}`);
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
  const res = await fetchNoStore("/api/data/subjects");
  const data = await parseJson<{ subjects: Subject[] }>(res);
  return data.subjects ?? [];
}

export async function apiGetCourseSharing(courseCode: string): Promise<string[]> {
  const qs = makeQuery({ courseCode });
  const res = await fetchNoStore(`/api/data/sharing${qs}`);
  const data = await parseJson<{ teacherIds: string[] }>(res);
  return data.teacherIds ?? [];
}

export async function apiGetTeacherSharedCourses(
  teacherId: string,
  fallbackTeacherId?: string,
  fallbackTeacherEmail?: string
): Promise<string[]> {
  const teacherIds = normalizeTeacherKeys([
    teacherId,
    fallbackTeacherId,
    fallbackTeacherEmail?.toLowerCase(),
  ]);
  const qs = makeQuery({
    teacherId: teacherIds.length > 0 ? teacherIds.join(",") : undefined,
  });
  const res = await fetchNoStore(`/api/data/sharing${qs}`);
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
  const res = await fetchNoStore(`/api/data/bugs${qs}`);
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
