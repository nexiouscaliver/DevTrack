import express from "express";
import { exec } from "child_process";
import { promisify } from "util";
import { basename, isAbsolute } from "path";

const run = promisify(exec);
const app = express();
const PORT = 9001;

app.use(express.json());

// --- Helper: shell-escape a single argument ---
function shEscape(str) {
  return "'" + String(str).replace(/'/g, "'\\''") + "'";
}

// --- Helper: run a git command safely in a given directory ---
async function git(args, cwd) {
  const cmd = ["git", ...args].map(shEscape).join(" ");
  const { stdout } = await run(cmd, {
    cwd: cwd || undefined,
    maxBuffer: 10 * 1024 * 1024,
  });
  return stdout;
}

// --- Helper: validate request body has an absolute path ---
function validatePath(req, res) {
  const { path: folderPath } = req.body || {};
  if (!folderPath || typeof folderPath !== "string") {
    res.status(400).json({ error: "Missing 'path' in request body" });
    return null;
  }
  const trimmed = folderPath.trim();
  if (!isAbsolute(trimmed)) {
    res.status(400).json({ error: "Path must be absolute" });
    return null;
  }
  if (trimmed.includes("..")) {
    res.status(400).json({ error: "Path must not contain '..'" });
    return null;
  }
  return trimmed;
}

// =====================================================
// GET /api/git/health — is git available?
// =====================================================
app.get("/api/git/health", async (_req, res) => {
  try {
    const stdout = await git(["--version"]);
    const version = stdout.trim();
    res.json({ status: "ok", git: true, version });
  } catch {
    res.json({ status: "ok", git: false, version: null });
  }
});

// =====================================================
// POST /api/git/validate — check if folder is a git repo
// =====================================================
app.post("/api/git/validate", async (req, res) => {
  const folderPath = validatePath(req, res);
  if (!folderPath) return;

  try {
    await git(["rev-parse", "--is-inside-work-tree"], folderPath);
    const branch = (await git(["rev-parse", "--abbrev-ref", "HEAD"], folderPath)).trim();
    res.json({
      valid: true,
      isRepo: true,
      branch,
      name: basename(folderPath),
    });
  } catch (err) {
    const stderr = err.stderr || "";
    if (stderr.includes("not a git repository")) {
      res.json({ valid: true, isRepo: false, error: "Not a git repository" });
    } else if (stderr.includes("No such file") || err.code === "ENOENT") {
      res.json({ valid: false, error: "Path does not exist" });
    } else {
      res.json({ valid: true, isRepo: false, error: stderr.trim() || "Validation failed" });
    }
  }
});

// =====================================================
// POST /api/git/log — fetch commits from a local repo
// =====================================================
app.post("/api/git/log", async (req, res) => {
  const folderPath = validatePath(req, res);
  if (!folderPath) return;

  const {
    branch,
    count = 200,
    since,
    author,
  } = req.body || {};

  const logArgs = ["log"];
  if (branch) logArgs.push(branch);
  if (author) logArgs.push(`--author=${author}`);
  if (since) logArgs.push(`--since=${since}`);
  logArgs.push(
    "-n",
    String(Math.min(count, 500)),
    "--pretty=format:COMMIT_START%n%H%n%s%n%an%n%ae%n%at%n%D",
    "--numstat",
  );

  try {
    const raw = await git(logArgs, folderPath);

    if (!raw.trim()) {
      return res.json({ commits: [], repo: basename(folderPath) });
    }

    const commits = [];
    const blocks = raw.split("COMMIT_START\n").filter(Boolean);

    for (const block of blocks) {
      const lines = block.split("\n");
      if (lines.length < 5) continue;

      const sha = lines[0].trim();
      const message = lines[1].trim();
      const authorName = lines[2].trim();
      const authorEmail = lines[3].trim();
      const timestampSec = parseInt(lines[4].trim(), 10);
      const refLine = lines[5] || "";

      let filesChanged = 0;
      let insertions = 0;
      let deletions = 0;
      for (let i = 6; i < lines.length; i++) {
        const statLine = lines[i].trim();
        if (!statLine) continue;
        const parts = statLine.split("\t");
        if (parts.length === 3) {
          filesChanged++;
          const add = parts[0] === "-" ? 0 : parseInt(parts[0], 10) || 0;
          const del = parts[1] === "-" ? 0 : parseInt(parts[1], 10) || 0;
          insertions += add;
          deletions += del;
        }
      }

      let branchName = "";
      const headMatch = refLine.match(/HEAD -> ([^,]+)/);
      if (headMatch) {
        branchName = headMatch[1].trim();
      }

      commits.push({
        sha: sha.substring(0, 7),
        message,
        author: authorName,
        authorEmail,
        timestamp: timestampSec * 1000,
        repo: basename(folderPath),
        repoPath: folderPath,
        branch: branchName,
        filesChanged,
        insertions,
        deletions,
      });
    }

    res.json({ commits, repo: basename(folderPath) });
  } catch (err) {
    const stderr = typeof err.stderr === "string" ? err.stderr.trim() : "";
    if (err.code === "ENOENT" || stderr.includes("No such file")) {
      return res.status(400).json({ error: "Path does not exist" });
    }
    res.status(400).json({ error: stderr || "Failed to read git log" });
  }
});

// =====================================================
// POST /api/git/branches — list branches in a repo
// =====================================================
app.post("/api/git/branches", async (req, res) => {
  const folderPath = validatePath(req, res);
  if (!folderPath) return;

  try {
    const [branchOutput, currentOutput] = await Promise.all([
      git(["branch", "--list", "--format=%(refname:short)"], folderPath),
      git(["rev-parse", "--abbrev-ref", "HEAD"], folderPath),
    ]);

    const branches = branchOutput
      .split("\n")
      .map((b) => b.trim())
      .filter(Boolean);
    const current = currentOutput.trim();

    res.json({ branches, current });
  } catch (err) {
    res.status(400).json({
      error: (typeof err.stderr === "string" ? err.stderr.trim() : "") || "Failed to list branches",
    });
  }
});

// --- Start server ---
app.listen(PORT, () => {
  console.log(`DevTrack git server running on http://localhost:${PORT}`);
}).on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Is the git server already running?`);
    process.exit(1);
  }
  throw err;
});
