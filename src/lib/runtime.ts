export function isGithubPagesRuntime(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return window.location.hostname.endsWith("github.io");
}
