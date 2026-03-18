import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { rename, rm } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const apiRouteDir = path.join(root, "src", "app", "api");
const backupDir = path.join(root, "src", "__api_backup_for_gh_pages__");
const nextBuildDir = path.join(root, ".next");

function runBuild() {
  return new Promise((resolve, reject) => {
    const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");
    const child = spawn(process.execPath, [nextBin, "build"], {
      cwd: root,
      env: {
        ...process.env,
        GITHUB_PAGES: "true",
      },
      stdio: "inherit",
      shell: false,
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`GitHub Pages build failed with exit code ${code}`));
      }
    });
  });
}

let moved = false;

try {
  if (existsSync(apiRouteDir)) {
    if (existsSync(backupDir)) {
      await rm(backupDir, { recursive: true, force: true });
    }
    await rename(apiRouteDir, backupDir);
    moved = true;
    console.log("[gh-pages] Temporarily moved src/app/api for static export");
  }

  if (existsSync(nextBuildDir)) {
    await rm(nextBuildDir, { recursive: true, force: true });
  }

  await runBuild();
} catch (error) {
  console.error("[gh-pages] Build error:", error);
  process.exitCode = 1;
} finally {
  if (moved && existsSync(backupDir)) {
    await rename(backupDir, apiRouteDir);
    console.log("[gh-pages] Restored src/app/api after static export");
  }
}
