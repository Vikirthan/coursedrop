// ============================================================
// CourseDrop — Utility helpers
// ============================================================

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function getFileExtension(name: string): string {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

export function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const ALLOWED_EXTENSIONS = [
  "pdf",
  "ppt",
  "pptx",
  "txt",
  "png",
  "jpg",
  "jpeg",
];

export function isAllowedFile(name: string): boolean {
  return ALLOWED_EXTENSIONS.includes(getFileExtension(name));
}
