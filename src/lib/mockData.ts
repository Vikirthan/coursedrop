// ============================================================
// CourseDrop — Mock / Demo Data
// ============================================================
import { SubjectRequest, StudyFile, User } from "./types";

// ---- Dummy Users ----
export const DUMMY_USERS: User[] = [
  {
    id: "admin-1",
    username: "admin",
    name: "Dr. Admin",
    role: "admin",
    email: "admin@coursedrop.edu",
  },
  {
    id: "teacher-1",
    username: "teacher",
    name: "Prof. Sharma",
    role: "teacher",
    email: "sharma@coursedrop.edu",
    department: "Computer Science",
  },
];

// Dummy credentials (admin / admin123, teacher / teacher123)
export const CREDENTIALS: Record<string, { password: string; userId: string }> = {
  admin: { password: "admin123", userId: "admin-1" },
  teacher: { password: "teacher123", userId: "teacher-1" },
};

// ---- Seed Subject Requests ----
export const SEED_REQUESTS: SubjectRequest[] = [
  {
    id: "req-1",
    teacherId: "teacher-1",
    teacherName: "Prof. Sharma",
    teacherEmail: "sharma@coursedrop.edu",
    department: "Computer Science",
    subjectName: "Programming in C",
    courseCode: "CSE101",
    message: "I would like to upload C programming lecture slides and lab manuals.",
    status: "approved",
    createdAt: "2026-03-10T10:00:00Z",
    updatedAt: "2026-03-11T09:00:00Z",
  },
  {
    id: "req-2",
    teacherId: "teacher-1",
    teacherName: "Prof. Sharma",
    teacherEmail: "sharma@coursedrop.edu",
    department: "Computer Science",
    subjectName: "Signals and Systems",
    courseCode: "ECE201",
    message: "Planning to share solved examples and previous year papers.",
    status: "pending",
    createdAt: "2026-03-15T14:30:00Z",
    updatedAt: "2026-03-15T14:30:00Z",
  },
  {
    id: "req-3",
    teacherId: "teacher-1",
    teacherName: "Prof. Sharma",
    teacherEmail: "sharma@coursedrop.edu",
    department: "Mathematics",
    subjectName: "Engineering Mathematics",
    courseCode: "MAT110",
    status: "rejected",
    createdAt: "2026-03-12T08:00:00Z",
    updatedAt: "2026-03-13T11:00:00Z",
  },
  {
    id: "req-4",
    teacherId: "teacher-1",
    teacherName: "Prof. Sharma",
    teacherEmail: "sharma@coursedrop.edu",
    department: "Electrical Engineering",
    subjectName: "Power Electronics",
    courseCode: "EEE220",
    message: "I teach the lab section and want to share practical notes.",
    status: "pending",
    createdAt: "2026-03-17T09:15:00Z",
    updatedAt: "2026-03-17T09:15:00Z",
  },
];

// ---- Seed Files ----
export const SEED_FILES: StudyFile[] = [
  {
    id: "file-1",
    name: "Unit 1 Notes.pdf",
    type: "pdf",
    size: 2_400_000,
    courseCode: "CSE101",
    subjectName: "Programming in C",
    uploadedBy: "teacher-1",
    uploadedByName: "Prof. Sharma",
    uploadDate: "2026-03-12T10:00:00Z",
    driveFileId: "mock-drive-id-1",
    driveDownloadUrl: "#",
  },
  {
    id: "file-2",
    name: "Module 2 Slides.pptx",
    type: "pptx",
    size: 5_100_000,
    courseCode: "CSE101",
    subjectName: "Programming in C",
    uploadedBy: "teacher-1",
    uploadedByName: "Prof. Sharma",
    uploadDate: "2026-03-13T14:20:00Z",
    driveFileId: "mock-drive-id-2",
    driveDownloadUrl: "#",
  },
  {
    id: "file-3",
    name: "Lab Manual.txt",
    type: "txt",
    size: 48_000,
    courseCode: "CSE101",
    subjectName: "Programming in C",
    uploadedBy: "teacher-1",
    uploadedByName: "Prof. Sharma",
    uploadDate: "2026-03-14T09:00:00Z",
    driveFileId: "mock-drive-id-3",
    driveDownloadUrl: "#",
  },
  {
    id: "file-4",
    name: "Circuit Diagram.png",
    type: "png",
    size: 1_200_000,
    courseCode: "CSE101",
    subjectName: "Programming in C",
    uploadedBy: "teacher-1",
    uploadedByName: "Prof. Sharma",
    uploadDate: "2026-03-15T16:45:00Z",
    driveFileId: "mock-drive-id-4",
    driveDownloadUrl: "#",
  },
];
