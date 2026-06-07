import express from "express";
import { exec } from "child_process";
import { promisify } from "util";
import { basename, isAbsolute, dirname, join } from "path";
import { fileURLToPath } from "url";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  renameSync,
  unlinkSync,
} from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = join(__dirname, "data");
const DATA_FILE = join(DATA_DIR, "devtrack.json");

// Ensure data directory exists at startup
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

// Clean up stale .tmp file from a previous crashed write
const TMP_FILE = DATA_FILE + ".tmp";
if (existsSync(TMP_FILE)) {
  try { unlinkSync(TMP_FILE); } catch { /* ignore */ }
}

const run = promisify(exec);
const app = express();
const PORT = 9001;

app.use(express.json({ limit: "5mb" }));

// --- Data persistence helpers ---
// Serialize writes to prevent concurrent POST interleaving
let writeQueue = Promise.resolve();

function readDataFile() {
  try {
    if (!existsSync(DATA_FILE)) return null;
    const raw = readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    if (existsSync(DATA_FILE)) {
      console.warn("DevTrack: data file is corrupt or unreadable, renaming to .corrupt:", err.message);
      try { renameSync(DATA_FILE, DATA_FILE + ".corrupt"); } catch { /* best effort */ }
    }
    return null;
  }
}

function writeDataFile(data) {
  const tmp = DATA_FILE + ".tmp";
  try {
    writeFileSync(tmp, JSON.stringify(data, null, 2), "utf-8");
    renameSync(tmp, DATA_FILE);
  } catch (err) {
    try { if (existsSync(tmp)) unlinkSync(tmp); } catch { /* best effort */ }
    throw err;
  }
}

// --- Request logging ---
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} → ${res.statusCode} (${ms}ms)`);
  });
  next();
});

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

// =====================================================
// POST /api/git/user — get git user.name & user.email for a repo
// =====================================================
app.post("/api/git/user", async (req, res) => {
  const folderPath = validatePath(req, res);
  if (!folderPath) return;

  try {
    const [name, email] = await Promise.all([
      git(["config", "user.name"], folderPath),
      git(["config", "user.email"], folderPath),
    ]);
    res.json({ name: name.trim(), email: email.trim() });
  } catch {
    res.json({ name: "", email: "" });
  }
});

// =====================================================
// GET /api/data — load persisted app data
// =====================================================
app.get("/api/data", (_req, res) => {
  const data = readDataFile();
  if (data === null) {
    return res.json({ exists: false });
  }
  res.json({ exists: true, data });
});

// =====================================================
// POST /api/data — save app data to file
// =====================================================
app.post("/api/data", (req, res) => {
  try {
    const { data } = req.body;
    if (!data || typeof data !== "object") {
      return res.status(400).json({ error: "Missing 'data' in request body" });
    }
    if (
      !Array.isArray(data.sessions) ||
      !Array.isArray(data.commits) ||
      !data.settings ||
      typeof data.settings !== "object" ||
      Array.isArray(data.settings)
    ) {
      return res.status(400).json({ error: "Invalid data shape" });
    }
    if (data.sessions.length > 10000 || data.commits.length > 10000) {
      return res.status(400).json({ error: "Data arrays exceed maximum length" });
    }
    writeQueue = writeQueue.then(() => writeDataFile(data));
    res.json({ ok: true });
  } catch (err) {
    console.error("DevTrack: failed to write data file:", err.message);
    res.status(500).json({ error: "Failed to save data" });
  }
});

// =====================================================
// DELETE /api/data — clear persisted app data
// =====================================================
app.delete("/api/data", (_req, res) => {
  try {
    if (existsSync(DATA_FILE)) unlinkSync(DATA_FILE);
    if (existsSync(TMP_FILE)) unlinkSync(TMP_FILE);
    res.json({ ok: true });
  } catch (err) {
    console.error("DevTrack: failed to delete data file:", err.message);
    res.status(500).json({ error: "Failed to clear data" });
  }
});

// --- Start server ---
app.listen(PORT, "127.0.0.1", () => {
  console.log(`DevTrack git server running on http://127.0.0.1:${PORT}`);
}).on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Is the git server already running?`);
    process.exit(1);
  }
  throw err;
});
