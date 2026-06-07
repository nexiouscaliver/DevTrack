import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { generateExcelReport, generateCSVReport, getExportPreview } from "./utils/exportEngine";
import { computeDiff, applyPush, applyPull, applyMerge, previewSync } from "./utils/syncEngine";

// Icons as SVG components
const Icon = ({ path, size = 20, className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {path}
  </svg>
);

const ICONS = {
  play: <polygon points="5 3 19 12 5 21 5 3" />,
  pause: (
    <>
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </>
  ),
  stop: <rect x="4" y="4" width="16" height="16" rx="2" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </>
  ),
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </>
  ),
  timer: (
    <>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l2 2" />
      <path d="M5 3 2 6" />
      <path d="m22 6-3-3" />
      <path d="M12 5V3" />
    </>
  ),
  list: (
    <>
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </>
  ),
  git: (
    <>
      <circle cx="12" cy="12" r="4" />
      <line x1="1.05" y1="12" x2="7" y2="12" />
      <line x1="17.01" y1="12" x2="22.96" y2="12" />
    </>
  ),
  gitCommit: (
    <>
      <circle cx="12" cy="12" r="3" />
      <line x1="12" y1="3" x2="12" y2="9" />
      <line x1="12" y1="15" x2="12" y2="21" />
    </>
  ),
  chart: (
    <>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </>
  ),
  download: (
    <>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </>
  ),
  coffee: (
    <path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3" />
  ),
  plus: (
    <>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </>
  ),
  trash: (
    <>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </>
  ),
  edit: (
    <>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </>
  ),
  tag: (
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7h.01" />
  ),
  fire: (
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  ),
  moon: <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />,
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </>
  ),
  code: (
    <>
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </>
  ),
  check: <polyline points="20 6 9 17 4 12" />,
  alert: (
    <>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </>
  ),
  github: (
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  ),
  refresh: (
    <>
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </>
  ),
  zap: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />,
  trending: (
    <>
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </>
  ),
  briefcase: (
    <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
  ),
  wave: (
    <path d="M18.5 12c0-1.5-1-2.5-2.5-2.5S13.5 10.5 13.5 12M13.5 12c0-1.5-1-2.5-2.5-2.5S8.5 10.5 8.5 12M8.5 12c0-1.5-1-2.5-2.5-2.5S3.5 10.5 3.5 12M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2c1.5 0 2.93.332 4.217.932" />
  ),
  fileText: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </>
  ),
  spreadsheet: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="3" y1="15" x2="21" y2="15" />
      <line x1="9" y1="3" x2="9" y2="21" />
      <line x1="15" y1="3" x2="15" y2="21" />
    </>
  ),
  clipboard: (
    <>
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </>
  ),
  menu: (
    <>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </>
  ),
  close: (
    <>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </>
  ),
  eye: (
    <>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  eyeOff: (
    <>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
    </>
  ),
  chevronDown: <polyline points="6 9 12 15 18 9" />,
  chevronRight: <polyline points="9 18 15 12 9 6" />,
  flag: (
    <>
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </>
  ),
};

// Helpers
const formatDuration = (ms) => {
  if (!ms || ms < 0) ms = 0;
  const secs = Math.floor(ms / 1000);
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const formatTime = (ts) =>
  new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const formatDate = (ts) =>
  new Date(ts).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const parseTimeInput = (input) => {
  const match = input.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
  if (!match) return null;
  let h = parseInt(match[1]); let m = parseInt(match[2]); const period = match[3];
  if (m >= 60 || h < 1 || h > 12) return null;
  const periodLower = period.toLowerCase();
  if (h === 12) h = 0;
  if (periodLower === 'pm') h += 12;
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.getTime();
};

const formatTimeForInput = (ts) => {
  const d = new Date(ts);
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const period = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${period}`;
};

const isToday = (ts) => {
  const d = new Date(ts),
    n = new Date();
  return d.toDateString() === n.toDateString();
};
const dayName = (ts) =>
  new Date(ts).toLocaleDateString("en", { weekday: "short" });
const startOfDay = (ts) => {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

/**
 * Estimate work hours from git commit timestamps.
 * Groups consecutive commits into "work sessions" using gap-based detection,
 * applies smart padding (ramp-up + cool-down), density adjustments for
 * burst commits, and assigns confidence scores.
 */
const estimateWorkHours = (commits, config = {}) => {
  const {
    maxGap = 7200000,       // 2h — max gap between commits in same session
    minSessionDuration = 900000, // 15min — floor for single-commit sessions
    prePadding = 900000,    // 15min — ramp-up before first commit
    postPadding = 600000,   // 10min — cool-down after last commit
  } = config;

  // Step 1: Filter merge commits & sort by timestamp
  const filtered = commits
    .filter((c) => !c.message?.startsWith("Merge "))
    .sort((a, b) => a.timestamp - b.timestamp);

  if (filtered.length === 0) return [];

  // Step 2: Group consecutive commits into sessions by gap
  const groups = [];
  let current = [filtered[0]];

  for (let i = 1; i < filtered.length; i++) {
    const gap = filtered[i].timestamp - current[current.length - 1].timestamp;
    if (gap <= maxGap) {
      current.push(filtered[i]);
    } else {
      groups.push(current);
      current = [filtered[i]];
    }
  }
  groups.push(current);

  // Step 3: Estimate duration per session
  return groups.map((group) => {
    const first = group[0];
    const last = group[group.length - 1];
    const rawStart = first.timestamp;
    const rawEnd = last.timestamp;
    const rawSpan = rawEnd - rawStart;

    // Smart padding
    let paddedStart = rawStart - prePadding;
    let paddedEnd = rawEnd + postPadding;

    // Density signals
    const totalFiles = group.reduce((a, c) => a + (c.filesChanged || 0), 0);
    const totalLines = group.reduce(
      (a, c) => a + (c.insertions || 0) + (c.deletions || 0), 0,
    );
    const commitCount = group.length;

    // Burst of activity in short time → extend
    if (rawSpan < 1800000 && (totalFiles > 5 || commitCount >= 3)) {
      paddedEnd = Math.max(paddedEnd, rawStart + 2700000); // extend to 45min
    }
    // Heavy changes crammed into short span → extend
    if (totalLines > 500 && rawSpan < 3600000) {
      paddedEnd = Math.max(paddedEnd, rawStart + 3600000); // extend to 60min
    }

    let estimatedDuration = paddedEnd - paddedStart;
    // Floor: even single isolated commits represent at least minSessionDuration
    estimatedDuration = Math.max(estimatedDuration, minSessionDuration);

    // Confidence scoring
    let confidence;
    if (commitCount >= 3 && rawSpan >= 1800000) {
      confidence = "high";
    } else if (commitCount >= 2) {
      confidence = "medium";
    } else {
      confidence = "low";
    }

    // Determine repo name — "multi-repo" if commits span multiple repos
    const repos = [...new Set(group.map((c) => c.repo).filter(Boolean))];
    const repoName = repos.length === 1 ? repos[0] : repos.length > 1 ? "multi-repo" : "";

    return {
      id: `est_${rawStart}_${commitCount}`,
      start: paddedStart,
      end: paddedEnd,
      duration: estimatedDuration,
      confidence,
      commitCount,
      repoName,
      totalFiles,
      totalLines,
      notes: `${commitCount} commit${commitCount !== 1 ? "s" : ""}${repoName ? ` in ${repoName}` : ""}`,
    };
  });
};

/**
 * Filter commits by author identity.
 * Always filters by gitAuthors.identities when available, regardless of mode.
 * Mode exists for future extensibility (me vs us distinction).
 */
const filterByAuthor = (commits, gitAuthors) => {
  const identities = gitAuthors?.identities || [];
  if (identities.length === 0) return commits;
  return commits.filter((c) =>
    identities.some(
      (id) =>
        (id.email && c.authorEmail?.toLowerCase() === id.email.toLowerCase()) ||
        (id.name && c.author?.toLowerCase() === id.name.toLowerCase()),
    ),
  );
};

const STORAGE_KEY = "devtrack_data_v1";

const DEFAULT_DATA = {
  sessions: [],
  commits: [],
  workLog: [],
  settings: {
    dailyGoal: 8,
    trackedRepos: [],
    gitAuthors: {
      identities: [],
      autoDetected: null,
    },
  },
  ui: {
    view: "dashboard",
    sessionsFilter: "all",
    gitRepoFilter: "all",
    analyticsRange: "week",
    exportPeriod: "week",
    exportFormat: "xlsx",
    exportIncludeCheckpoints: true,
    exportIncludeWorkLog: true,
  },
};

// --- Shared data helpers ---
function validateDataShape(parsed) {
  return (
    parsed &&
    Array.isArray(parsed.sessions) &&
    Array.isArray(parsed.commits) &&
    parsed.settings &&
    typeof parsed.settings === "object" &&
    !Array.isArray(parsed.settings)
  );
}

// Deep-sanitize every session/commit object so missing or invalid fields get safe defaults.
// Defence-in-depth: run after load(), server sync, and version restore.
function sanitizeData(data) {
  if (!data || typeof data !== "object") return null;
  const validStatuses = ["running", "paused", "completed"];
  return {
    sessions: (Array.isArray(data.sessions) ? data.sessions : []).map((s) => ({
      id: s.id || `s_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      type: s.type || "work",
      start: typeof s.start === "number" ? s.start : Date.now(),
      end: s.end ?? null,
      duration: typeof s.duration === "number" ? s.duration : 0,
      tags: Array.isArray(s.tags) ? s.tags : [],
      notes: typeof s.notes === "string" ? s.notes : "",
      status: validStatuses.includes(s.status) ? s.status : "completed",
      pauses: Array.isArray(s.pauses) ? s.pauses : [],
      ...(s.totalWorkTime != null ? { totalWorkTime: s.totalWorkTime } : {}),
      ...(s.totalBreakTime != null ? { totalBreakTime: s.totalBreakTime } : {}),
      ...(s.commitIds ? { commitIds: s.commitIds } : {}),
      checkpoints: Array.isArray(s.checkpoints)
        ? s.checkpoints.map((cp) => ({
            id: cp.id || `cp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            text: typeof cp.text === "string" ? cp.text : "",
            ts: typeof cp.ts === "number" ? cp.ts : Date.now(),
            private: cp.private === true,
          }))
        : [],
    })),
    commits: (Array.isArray(data.commits) ? data.commits : []).map((c) => ({
      sha: c.sha || "unknown",
      message: c.message || "",
      repo: c.repo || "",
      repoPath: c.repoPath || "",
      timestamp: typeof c.timestamp === "number" ? c.timestamp : Date.now(),
      author: c.author || "",
      authorEmail: c.authorEmail || "",
      branch: c.branch || "",
      source: c.source || "manual",
      filesChanged: typeof c.filesChanged === "number" ? c.filesChanged : 0,
      insertions: typeof c.insertions === "number" ? c.insertions : 0,
      deletions: typeof c.deletions === "number" ? c.deletions : 0,
    })),
    settings: {
      dailyGoal: data.settings?.dailyGoal ?? 8,
      trackedRepos: Array.isArray(data.settings?.trackedRepos)
        ? data.settings.trackedRepos
        : [],
      gitAuthors: data.settings?.gitAuthors ?? {
        identities: [],
        autoDetected: null,
      },
    },
    ui: { ...DEFAULT_DATA.ui, ...(data.ui || {}) },
    workLog: (Array.isArray(data.workLog) ? data.workLog : []).map((e) => ({
      id: e.id || `wl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      text: typeof e.text === "string" ? e.text : "",
      ts: typeof e.ts === "number" ? e.ts : Date.now(),
      private: e.private === true,
    })),
  };
}

function migrate(parsed) {
  if ("githubToken" in parsed.settings || "githubUser" in parsed.settings) {
    delete parsed.settings.githubToken;
    delete parsed.settings.githubUser;
    if (!parsed.settings.trackedRepos) {
      parsed.settings.trackedRepos = [];
    }
  }
  if (!parsed.settings.trackedRepos) {
    parsed.settings.trackedRepos = [];
  }
  if (!parsed.settings.gitAuthors) {
    parsed.settings.gitAuthors = { identities: [], autoDetected: null };
  }
  if ("idleMinutes" in parsed.settings) {
    delete parsed.settings.idleMinutes;
  }
  parsed.sessions = parsed.sessions.map((s) => ({
    ...s,
    pauses: s.pauses || [],
  }));
  parsed.commits = parsed.commits.map((c) => ({
    ...c,
    source: c.source || "manual",
    repoPath: c.repoPath || "",
  }));
  // Add UI preferences (spread merge ensures forward compatibility with new fields)
  parsed.ui = { ...DEFAULT_DATA.ui, ...(parsed.ui || {}) };

  // Migrate session checkpoints — backfill from notes
  parsed.sessions = parsed.sessions.map((s) => ({
    ...s,
    checkpoints: s.checkpoints || (
      s.notes && s.notes.trim() && s.start && !isNaN(s.start)
        ? [{ id: `cp_${s.start}_migrated`, text: s.notes.trim(), ts: s.start, private: false }]
        : []
    ),
  }));

  // Add workLog array if missing
  if (!parsed.workLog) {
    parsed.workLog = [];
  }

  return parsed;
}

const load = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!validateDataShape(parsed)) return null;
    return sanitizeData(migrate(parsed));
  } catch {
    return null;
  }
};

const loadFromServer = async () => {
  try {
    const res = await fetch("/api/data");
    if (!res.ok) return null;
    const result = await res.json();
    if (!result.exists || !result.data) return null;
    const parsed = result.data;
    if (!validateDataShape(parsed)) return null;
    return sanitizeData(migrate(parsed));
  } catch {
    return null;
  }
};

// Module-level refs for server retry coordination (set inside App())
const _serverSaveFn = { current: null }; // will be assigned in App()
const _onQuotaExceeded = { current: null };

const save = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    if (_onQuotaExceeded.current) _onQuotaExceeded.current(false);
  } catch (e) {
    if (
      e instanceof DOMException &&
      (e.name === "QuotaExceededError" || e.code === 22)
    ) {
      if (_onQuotaExceeded.current) _onQuotaExceeded.current(true);
    } else {
      throw e;
    }
  }
  // Server save (with retry logic via _serverSaveFn)
  if (_serverSaveFn.current) {
    _serverSaveFn.current(data);
  } else {
    // Fallback: fire-and-forget (before App mounts)
    fetch("/api/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data }),
    }).catch(() => {});
  }
};

// --- Active session protection during server sync ---
// When the server sync runs on mount, it can overwrite the client's running session
// with stale server data (e.g., a previous session that never got its "completed" save
// through because the server was restarting). This function preserves the client's
// active session when there's a conflict.
// Assumes at most one running/paused session per side (enforced by the timer UI).
function protectActiveSession(localData, serverData) {
  if (!serverData) return localData;
  const localActive = (localData?.sessions || []).find(
    (s) => s.status === "running" || s.status === "paused",
  );
  // No local active session — server data is fine as-is
  if (!localActive) return serverData;

  const serverSessions = serverData.sessions || [];
  const serverActive = serverSessions.find(
    (s) => s.status === "running" || s.status === "paused",
  );
  // Server has no running session — inject the client's active session
  if (!serverActive) {
    const hasLocal = serverSessions.some((s) => s.id === localActive.id);
    return {
      ...serverData,
      sessions: hasLocal
        ? serverSessions.map((s) => (s.id === localActive.id ? localActive : s))
        : [...serverSessions, localActive],
    };
  }

  // Same session on both sides — keep client version (it's never stale)
  if (serverActive.id === localActive.id) {
    // Full comparison: only shortcut if truly identical, otherwise client wins
    if (JSON.stringify(serverActive) === JSON.stringify(localActive)) return serverData;
    return {
      ...serverData,
      sessions: serverSessions.map((s) =>
        s.id === localActive.id ? localActive : s,
      ),
    };
  }

  // Different sessions — server has a stale running session from a failed save.
  // Mark the server's stale session as completed, then ensure the client's session is present.
  const now = Date.now();
  const patched = serverSessions.map((s) => {
    if (s.id !== serverActive.id) return s;
    return {
      ...s,
      status: "completed",
      end: s.end || now,
      duration: s.duration || (s.end ? s.end - s.start : now - s.start),
    };
  });
  const hasLocal = patched.some((s) => s.id === localActive.id);
  return {
    ...serverData,
    sessions: hasLocal
      ? patched.map((s) => (s.id === localActive.id ? localActive : s))
      : [...patched, localActive],
  };
}

// Compute elapsed time for a session in milliseconds.
// For running sessions: wall-clock time minus all completed pauses.
// For paused sessions: total break time (completed pauses + current pause) — matches timer tick semantics.
function computeElapsed(session) {
  if (!session || typeof session.start !== "number") return 0;
  if (session.status === "paused") {
    const completedPauses = (session.pauses || [])
      .filter((p) => p.end !== null)
      .reduce((s, p) => s + (p.end - p.start), 0);
    const currentPauseStart = (session.pauses || []).find((p) => p.end === null)?.start || Date.now();
    return Math.max(0, completedPauses + (Date.now() - currentPauseStart));
  }
  const paused = (session.pauses || []).reduce((s, p) => s + ((p.end || 0) - p.start), 0);
  return Math.max(0, Date.now() - session.start - paused);
}

// --- Smart localStorage cache eviction ---
// localStorage is a buffer, not the primary store. The server disk is source of truth.
// This function trims completed sessions and commits older than 2 months from the data
// object, but ONLY when the caller confirms the server has the full data.
// Returns the same data object if nothing to trim (identity check for callers).
const CACHE_WINDOW_MS = 60 * 24 * 60 * 60 * 1000; // 60 days

function trimLocalStorage(data, serverConfirmed) {
  if (!serverConfirmed || !data) return data;
  const threshold = Date.now() - CACHE_WINDOW_MS;

  const trimmedSessions = data.sessions.filter(
    (s) => s.start >= threshold || s.status === "running" || s.status === "paused",
  );
  const trimmedCommits = data.commits.filter((c) => c.timestamp >= threshold);

  const sessionsRemoved = data.sessions.length - trimmedSessions.length;
  const commitsRemoved = data.commits.length - trimmedCommits.length;
  if (sessionsRemoved + commitsRemoved === 0) return data; // nothing trimmed — return same ref

  return {
    ...data,
    sessions: trimmedSessions,
    commits: trimmedCommits,
    _lastTrim: Date.now(), // metadata for debugging
  };
}

/**
 * Re-link commits to ALL work sessions based on timestamp overlap.
 * For each work session, finds commits whose timestamps fall within [start, end].
 * For running/paused sessions, uses Date.now() as the upper bound.
 * Merges (union) with existing commitIds to preserve manually linked commits.
 */
function linkCommitsToSessions(sessions, commits) {
  if (!Array.isArray(sessions) || !Array.isArray(commits)) return sessions;
  const now = Date.now();
  return sessions.map((s) => {
    if (s.type !== "work") return s;
    const sessionEnd = s.end ?? now;
    const matchingShas = new Set(
      commits
        .filter((c) => c.timestamp >= s.start && c.timestamp <= sessionEnd)
        .map((c) => c.sha),
    );
    if (matchingShas.size === 0 && !s.commitIds?.length) return s;
    const existing = new Set(s.commitIds || []);
    for (const sha of matchingShas) existing.add(sha);
    const merged = [...existing];
    return merged.length > 0 ? { ...s, commitIds: merged } : s;
  });
}

export default function App() {
  // Load once and derive all initial state from it
  const [initialData] = useState(() => load());
  const [data, setData] = useState(() => initialData || DEFAULT_DATA);
  const [now, setNow] = useState(() => Date.now());
  const [view, setView] = useState(() => initialData?.ui?.view || "dashboard");
  const [activeSession, setActiveSession] = useState(() => {
    const running = (initialData?.sessions || []).find((s) => s.status === "running" || s.status === "paused");
    return running || null;
  });
  const [elapsed, setElapsed] = useState(() => {
    const active = (initialData?.sessions || []).find((s) => s.status === "running" || s.status === "paused");
    return computeElapsed(active);
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [syncOpen, setSyncOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [quotaWarning, setQuotaWarning] = useState(false);
  const [serverStatus, setServerStatus] = useState("connected"); // connected | disconnected
  const serverStatusRef = useRef("connected");
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef(null);
  const pendingSaveRef = useRef(false);
  const saveTimer = useRef(null);

  // Wire module-level save hooks
  // eslint-disable-next-line react-hooks/immutability
  _onQuotaExceeded.current = setQuotaWarning;

  // Server save with exponential-backoff retry (max 3 attempts)
  const saveToServer = useCallback((data, attempt = 1) => {
    if (retryTimerRef.current && attempt === 1) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    fetch("/api/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data }),
    }).then(() => {
      retryCountRef.current = 0;
      if (serverStatusRef.current !== "connected") {
        serverStatusRef.current = "connected";
        setServerStatus("connected");
      }
      // Server confirmed write — trim old data from localStorage cache
      const trimmed = trimLocalStorage(data, true);
      if (trimmed !== data) {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed)); } catch { /* non-critical */ }
        setData(trimmed);
      }
    }).catch(() => {
      if (attempt < 3) {
        retryTimerRef.current = setTimeout(
          // eslint-disable-next-line react-hooks/immutability
          () => saveToServer(data, attempt + 1),
          1000 * Math.pow(2, attempt - 1),
        );
      } else {
        retryCountRef.current = 0;
        if (serverStatusRef.current !== "disconnected") {
          serverStatusRef.current = "disconnected";
          setServerStatus("disconnected");
        }
      }
    });
  }, []);
  // eslint-disable-next-line react-hooks/immutability
  _serverSaveFn.current = saveToServer;

  // Debounced save — tracks whether a save is pending for lifecycle handlers
  useEffect(() => {
    if (syncOpen) return; // skip auto-save during sync (SyncView manages its own saves)
    if (saveTimer.current) clearTimeout(saveTimer.current);
    pendingSaveRef.current = true;
    saveTimer.current = setTimeout(() => {
      save(data);
      pendingSaveRef.current = false;
    }, 300);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [data, syncOpen]);

  // Force-save on page close / tab switch — single shared handler for both events.
  // visibilitychange fires first (hidden), beforeunload fires next on actual close.
  // We save localStorage synchronously + fire a keepalive fetch for the server backup.
  // The handler is idempotent: after the first call, pendingSaveRef is cleared.
  const forceSaveIfNeeded = useCallback(() => {
    if (!pendingSaveRef.current) return;
    clearTimeout(saveTimer.current);
    const d = dataRef.current;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch { /* non-critical */ }
    // fetch with keepalive survives page teardown (up to 256 KB) and Express parses it correctly
    try {
      fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: d }),
        keepalive: true,
      }).catch(() => {});
    } catch { /* non-critical */ }
    pendingSaveRef.current = false;
  }, []);

  useEffect(() => {
    window.addEventListener("beforeunload", forceSaveIfNeeded);
    return () => window.removeEventListener("beforeunload", forceSaveIfNeeded);
  }, [forceSaveIfNeeded]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") forceSaveIfNeeded();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [forceSaveIfNeeded]);

  // Persist UI preferences alongside data (piggybacks on existing debounce + server save)
  const updateUi = (updates) => {
    setData((d) => ({ ...d, ui: { ...d.ui, ...updates } }));
  };

  // Wrapper that updates both local view state and persisted ui.view
  const changeView = (v) => {
    setView(v);
    setData((d) => ({ ...d, ui: { ...d.ui, view: v } }));
  };

  // Sync from server on mount — only apply if user hasn't changed data during the async gap.
  // The ref guards against React 18 Strict Mode's double-mount in development.
  // Also performs: health check, corruption recovery from server.
  const serverSynced = useRef(false);
  const dataRef = useRef(data);
  // eslint-disable-next-line react-hooks/immutability
  useEffect(() => { dataRef.current = data; }, [data]);
  useEffect(() => {
    if (serverSynced.current) return;
    serverSynced.current = true;

    // Health check — sets initial server status, then trims stale cache data
    fetch("/api/health")
      .then((r) => {
        if (!r.ok) throw new Error();
        serverStatusRef.current = "connected";
        setServerStatus("connected");
        // Server is up — trim old data from localStorage cache
        const trimmed = trimLocalStorage(dataRef.current, true);
        if (trimmed !== dataRef.current) {
          const sRemoved = dataRef.current.sessions.length - trimmed.sessions.length;
          const cRemoved = dataRef.current.commits.length - trimmed.commits.length;
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed)); } catch { /* non-critical */ }
          setData(trimmed);
          if (sRemoved + cRemoved > 0) {
            // eslint-disable-next-line react-hooks/immutability
            showToast(`Cleaned up ${sRemoved} old session${sRemoved !== 1 ? "s" : ""} and ${cRemoved} commit${cRemoved !== 1 ? "s" : ""} from local cache`, "success");
          }
        }
      })
      .catch(() => {
        serverStatusRef.current = "disconnected";
        setServerStatus("disconnected");
      });

    const mountHash = JSON.stringify(data);
    // initialData was captured during first useState — reuse it to avoid redundant load()
    const localWasNull = !initialData;

    loadFromServer().then((serverData) => {
      // Corruption recovery: if localStorage was empty/corrupt but server has data, restore from server
      if (localWasNull && serverData) {
        const sanitized = sanitizeData(serverData);
        const restored = sanitized
          ? { ...sanitized, sessions: linkCommitsToSessions(sanitized.sessions, sanitized.commits) }
          : null;
        if (restored) {
          // Defensive: protect any in-memory active session from stale server data
          const safe = protectActiveSession(dataRef.current, restored);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
          setData(safe);
          setView(safe.ui?.view || "dashboard");
          const running = safe.sessions.find((s) => s.status === "running" || s.status === "paused") || null;
          if (running) {
            setActiveSession(running);
            setElapsed(computeElapsed(running));
          } else {
            setActiveSession(null);
            setElapsed(0);
          }
          showToast("Local data was corrupted — recovered from server backup", "warning");
          return;
        }
      }

      // Normal server sync path
      if (!serverData) return;
      if (JSON.stringify(dataRef.current) !== mountHash) return;

      const linked = {
        ...serverData,
        sessions: linkCommitsToSessions(serverData.sessions, serverData.commits),
      };
      // Protect the client's active session from being overwritten by stale server data
      const merged = protectActiveSession(dataRef.current, linked);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      setData(merged);
      setView(merged.ui?.view || "dashboard");
      const running = merged.sessions.find((s) => s.status === "running" || s.status === "paused") || null;
      if (running) {
        setActiveSession(running);
        setElapsed(computeElapsed(running));
      } else {
        setActiveSession(null);
        setElapsed(0);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch full data from server (for views that need historical data beyond the 2-month cache).
  // Returns the server data if available, falls back to localStorage cache.
  const fetchFullData = useCallback(async () => {
    const serverData = await loadFromServer();
    if (serverData) return serverData;
    return dataRef.current;
  }, []);

  // Cross-tab conflict detection — listen for localStorage writes from other tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return;
      // Only warn if the debounced save timer is still ticking (genuine unsaved change)
      if (saveTimer.current) {
        showToast("Another tab modified your data — your unsaved changes may conflict.", "warning");
      } else {
        // No pending local changes — safely adopt the other tab's data
        try {
          const parsed = JSON.parse(e.newValue);
          if (validateDataShape(parsed)) {
            setData(sanitizeData(migrate(parsed)));
          }
        } catch { /* ignore malformed */ }
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Timer tick — update every second while session is active (running or paused)
  useEffect(() => {
    if (!activeSession || activeSession.status === "completed") return;
    const tick = () => setElapsed(computeElapsed(activeSession));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [activeSession]);

  // Keep `now` fresh so dashboard stats, streak, and weekly chart stay accurate
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  // Session checkpoint — every 30 s while a session is active, persist a checkpoint
  // so that on crash/reload the pause state is at most 30 s inaccurate.
  const checkpointTimerRef = useRef(null);
  useEffect(() => {
    if (!activeSession || activeSession.status === "completed") {
      if (checkpointTimerRef.current) {
        clearInterval(checkpointTimerRef.current);
        checkpointTimerRef.current = null;
      }
      return;
    }
    if (checkpointTimerRef.current) return; // already running
    checkpointTimerRef.current = setInterval(() => {
      const sid = activeSession?.id;
      if (!sid) return;
      setData((d) => ({
        ...d,
        sessions: d.sessions.map((s) =>
          s.id === sid ? { ...s, _checkpoint: Date.now() } : s
        ),
      }));
    }, 30000);
    return () => {
      if (checkpointTimerRef.current) {
        clearInterval(checkpointTimerRef.current);
        checkpointTimerRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSession?.id, activeSession?.status]);

  const toastTimer = useRef(null);

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const showToast = useCallback((msg, type = "success") => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, type });
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  const startSession = (type = "work", tags = [], notes = "") => {
    // Auto-close any existing running/paused session before starting a new one
    const existing = (dataRef.current.sessions || []).find(
      (s) => s.status === "running" || s.status === "paused",
    );
    if (existing) {
      const now = Date.now();
      let pauses = existing.pauses || [];
      // Close any open pause
      if (existing.status === "paused" && pauses.length > 0) {
        pauses = pauses.map((p, i) =>
          i === pauses.length - 1 && p.end === null ? { ...p, end: now } : p,
        );
      }
      const totalDuration = now - existing.start;
      const totalBreakTime = pauses.reduce((s, p) => s + ((p.end || now) - p.start), 0);
      const totalWorkTime = totalDuration - totalBreakTime;
      setData((d) => ({
        ...d,
        sessions: d.sessions.map((s) =>
          s.id === existing.id
            ? { ...s, end: now, duration: totalDuration, totalWorkTime, totalBreakTime, pauses, status: "completed" }
            : s,
        ),
      }));
      showToast("Previous session auto-completed", "warning");
    }

    const session = {
      id: `s_${Date.now()}`,
      type,
      start: Date.now(),
      end: null,
      duration: 0,
      tags,
      notes,
      status: "running",
      pauses: [],
      checkpoints: [],
    };
    if (notes && notes.trim()) {
      session.checkpoints = [{
        id: `cp_${session.start}_initial`,
        text: notes.trim(),
        ts: session.start,
        private: false,
      }];
    }
    setActiveSession(session);
    setElapsed(0);
    setData((d) => ({ ...d, sessions: [...d.sessions, session] }));
    showToast("Work session started");
  };

  const pauseSession = useCallback(() => {
    setActiveSession((current) => {
      if (!current || current.status !== "running") return current;
      const updated = {
        ...current,
        status: "paused",
        pauses: [...current.pauses, { start: Date.now(), end: null }],
      };
      setData((d) => ({
        ...d,
        sessions: d.sessions.map((s) => (s.id === current.id ? updated : s)),
      }));
      showToast("Session paused — take a break!");
      return updated;
    });
  }, [showToast]);

  const resumeSession = useCallback(() => {
    setActiveSession((current) => {
      if (!current || current.status !== "paused") return current;
      const now = Date.now();
      const pauses = current.pauses.map((p, i) =>
        i === current.pauses.length - 1 && p.end === null
          ? { ...p, end: now }
          : p,
      );
      const updated = { ...current, status: "running", pauses };
      setData((d) => ({
        ...d,
        sessions: d.sessions.map((s) => (s.id === current.id ? updated : s)),
      }));
      showToast("Session resumed — back to work!");
      return updated;
    });
  }, [showToast]);


  const stopSession = useCallback(() => {
    setActiveSession((current) => {
      if (!current) return null;
      const now = Date.now();

      // Auto-sync all tracked repos so commits made during the session are captured
      const repos = current && current.start ? (dataRef.current.settings.trackedRepos || []) : [];
      if (repos.length > 0) {
        (async () => {
          for (const repo of repos) {
            try {
              const res = await fetch("/api/git/log", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ path: repo.path, count: 200 }),
              });
              if (!res.ok) continue;
              const result = await res.json();
              setData((d) => {
                const others = d.commits.filter(
                  (c) => c.source !== "local" || c.repoPath !== repo.path,
                );
                const newCommits = result.commits.map((c) => ({
                  ...c,
                  source: "local",
                }));
                return {
                  ...d,
                  commits: [...newCommits, ...others],
                  settings: {
                    ...d.settings,
                    trackedRepos: (d.settings.trackedRepos || []).map((r) =>
                      r.id === repo.id ? { ...r, lastSync: Date.now() } : r,
                    ),
                  },
                };
              });
            } catch { /* non-critical: skip repo if git server unavailable */ }
          }
          // After all repos are synced, update session commitIds with fresh data
          setData((d) => {
            const sessionCommits = d.commits.filter(
              (c) => c.timestamp >= current.start && c.timestamp <= now,
            );
            return {
              ...d,
              sessions: d.sessions.map((s) =>
                s.id === current.id ? { ...s, commitIds: sessionCommits.map((c) => c.sha) } : s,
              ),
            };
          });
        })();
      }

      // Close any open pause
      let pauses = current.pauses;
      if (current.status === "paused" && pauses.length > 0) {
        pauses = pauses.map((p, i) =>
          i === pauses.length - 1 && p.end === null ? { ...p, end: now } : p,
        );
      }
      const totalDuration = now - current.start;
      const totalBreakTime = pauses.reduce((s, p) => s + ((p.end || now) - p.start), 0);
      const totalWorkTime = totalDuration - totalBreakTime;
      const ended = {
        ...current,
        end: now,
        duration: totalDuration,
        totalWorkTime,
        totalBreakTime,
        pauses,
        status: "completed",
      };
      setData((d) => {
        // Pre-populate commitIds from whatever commits we already have;
        // the async sync above will refresh them with fresh data shortly after
        const sessionCommits = d.commits.filter(
          (c) =>
            c.timestamp >= current.start &&
            c.timestamp <= now,
        );
        ended.commitIds = sessionCommits.map((c) => c.sha);
        // Read latest checkpoints from data to prevent data loss
        // if addCheckpoint fired in the same tick
        const latestSession = d.sessions.find((s) => s.id === current.id);
        const checkpoints = latestSession?.checkpoints || current.checkpoints || [];
        ended.checkpoints = checkpoints;
        return {
          ...d,
          sessions: d.sessions.map((s) => (s.id === current.id ? ended : s)),
        };
      });
      setElapsed(0);
      showToast("Session completed ✓");
      return null;
    });
  }, [showToast]);

  const deleteSession = (id) => {
    setData((d) => ({ ...d, sessions: d.sessions.filter((s) => s.id !== id) }));
    showToast("Session deleted");
  };

  const updateSession = useCallback((id, updates) => {
    setData((d) => ({
      ...d,
      sessions: d.sessions.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    }));
    // Keep activeSession in sync so stopSession doesn't overwrite saved notes/tags
    setActiveSession((prev) =>
      prev && prev.id === id ? { ...prev, ...updates } : prev,
    );
  }, []);

  // ── Checkpoint & Work Log mutation helpers ──

  const addCheckpoint = useCallback((sessionId, text, ts = Date.now()) => {
    const checkpoint = {
      id: `cp_${ts}_${Math.random().toString(36).slice(2, 6)}`,
      text: text.trim(),
      ts,
      private: false,
    };
    setData((d) => ({
      ...d,
      sessions: d.sessions.map((s) =>
        s.id === sessionId
          ? { ...s, checkpoints: [...(s.checkpoints || []), checkpoint].sort((a, b) => a.ts - b.ts) }
          : s
      ),
    }));
    setActiveSession((prev) =>
      prev && prev.id === sessionId
        ? { ...prev, checkpoints: [...(prev.checkpoints || []), checkpoint].sort((a, b) => a.ts - b.ts) }
        : prev
    );
  }, []);

  const updateCheckpoint = useCallback((sessionId, checkpointId, updates) => {
    setData((d) => ({
      ...d,
      sessions: d.sessions.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              checkpoints: (s.checkpoints || [])
                .map((cp) => cp.id === checkpointId ? { ...cp, ...updates } : cp)
                .sort((a, b) => a.ts - b.ts),
            }
          : s
      ),
    }));
    setActiveSession((prev) =>
      prev && prev.id === sessionId
        ? {
            ...prev,
            checkpoints: (prev.checkpoints || [])
              .map((cp) => cp.id === checkpointId ? { ...cp, ...updates } : cp)
              .sort((a, b) => a.ts - b.ts),
          }
        : prev
    );
  }, []);

  const deleteCheckpoint = useCallback((sessionId, checkpointId) => {
    setData((d) => ({
      ...d,
      sessions: d.sessions.map((s) =>
        s.id === sessionId
          ? { ...s, checkpoints: (s.checkpoints || []).filter((cp) => cp.id !== checkpointId) }
          : s
      ),
    }));
    setActiveSession((prev) =>
      prev && prev.id === sessionId
        ? { ...prev, checkpoints: (prev.checkpoints || []).filter((cp) => cp.id !== checkpointId) }
        : prev
    );
  }, []);

  const addWorkLogEntry = useCallback((text, ts = Date.now()) => {
    const entry = {
      id: `wl_${ts}_${Math.random().toString(36).slice(2, 6)}`,
      text: text.trim(),
      ts,
      private: false,
    };
    setData((d) => ({ ...d, workLog: [...(d.workLog || []), entry] }));
  }, []);

  const updateWorkLogEntry = useCallback((entryId, updates) => {
    setData((d) => ({
      ...d,
      workLog: (d.workLog || []).map((e) =>
        e.id === entryId ? { ...e, ...updates } : e
      ),
    }));
  }, []);

  const deleteWorkLogEntry = useCallback((entryId) => {
    setData((d) => ({
      ...d,
      workLog: (d.workLog || []).filter((e) => e.id !== entryId),
    }));
  }, []);

  const updateSettings = (updates) => {
    setData((d) => ({ ...d, settings: { ...d.settings, ...updates } }));
  };

  const addCommit = (commit) => {
    setData((d) => ({ ...d, commits: [commit, ...d.commits] }));
  };

  const handleReset = () => {
    localStorage.removeItem(STORAGE_KEY);
    setData(DEFAULT_DATA);
    setView("dashboard");
    setActiveSession(null);
    setElapsed(0);
    fetch("/api/data", { method: "DELETE" }).catch(() => {});
  };

  // Apply a sync result and re-derive running session state
  const applySyncResult = (newData) => {
    setData(newData);
    const running = (newData.sessions || []).find(
      (s) => s.status === "running" || s.status === "paused"
    );
    if (running) {
      setActiveSession(running);
      setElapsed(computeElapsed(running));
    } else {
      setActiveSession(null);
      setElapsed(0);
    }
    setView(newData.ui?.view || "dashboard");
  };

  // Git-estimated session import
  const importEstimatedSession = (est) => {
    const session = {
      id: `s_${Date.now()}`,
      type: "work",
      start: est.start,
      end: est.end,
      duration: est.duration,
      tags: ["git-estimated", est.repoName].filter(Boolean),
      notes: est.notes,
      status: "completed",
      _estimatedId: est.id,
      checkpoints: [],
    };
    setData((d) => ({ ...d, sessions: [...d.sessions, session] }));
    showToast(`Imported git session: ${formatDuration(est.duration)}`);
  };

  const importAllEstimated = (sessions) => {
    const newSessions = sessions.map((est) => ({
      id: `s_${Date.now()}_${est.id}`,
      type: "work",
      start: est.start,
      end: est.end,
      duration: est.duration,
      tags: ["git-estimated", est.repoName].filter(Boolean),
      notes: est.notes,
      status: "completed",
      _estimatedId: est.id,
      checkpoints: [],
    }));
    setData((d) => ({ ...d, sessions: [...d.sessions, ...newSessions] }));
    showToast(`Imported ${newSessions.length} git-estimated session${newSessions.length !== 1 ? "s" : ""}`);
  };

  const isImported = (estimatedId) =>
    data.sessions.some((s) => s._estimatedId === estimatedId);

  // Stats
  const stats = useMemo(() => {
    const todaySessions = data.sessions.filter(
      (s) => s.status === "completed" && isToday(s.start),
    );
    const workToday = todaySessions.filter((s) => s.type === "work");
    const totalToday = workToday.reduce((a, s) => a + (s.totalWorkTime || s.duration), 0);
    // Compute break time from pauses within work sessions + legacy break sessions
    const breaksFromPauses = workToday.reduce((a, s) => {
      const breakMs = (s.pauses || []).reduce((sum, p) => sum + ((p.end || 0) - p.start), 0);
      return a + breakMs;
    }, 0);
    const legacyBreaks = todaySessions.filter((s) => s.type === "break");
    const legacyBreakTime = legacyBreaks.reduce((a, s) => a + s.duration, 0);
    const totalBreaks = breaksFromPauses + legacyBreakTime;

    // Weekly
    const weekAgo = now - 7 * 86400000;
    const weekSessions = data.sessions.filter(
      (s) => s.status === "completed" && s.start > weekAgo && s.type === "work",
    );
    const totalWeek = weekSessions.reduce((a, s) => a + (s.totalWorkTime || s.duration), 0);

    // Streaks - consecutive days with >= goal hours
    const goalMs = (data.settings.dailyGoal || 8) * 3600000;
    let currentStreak = 0;
    let bestStreak = 0;
    for (let d = 0; d < 365; d++) {
      const dayStart = startOfDay(now) - d * 86400000;
      const dayEnd = dayStart + 86400000;
      const dayWork = data.sessions
        .filter(
          (s) =>
            s.status === "completed" &&
            s.type === "work" &&
            s.start >= dayStart &&
            s.start < dayEnd,
        )
        .reduce((a, s) => a + (s.totalWorkTime || s.duration), 0);
      if (dayWork >= goalMs || (d === 0 && dayWork > 0)) {
        currentStreak++;
      } else if (currentStreak > 0) {
        if (currentStreak > bestStreak) bestStreak = currentStreak;
        currentStreak = 0;
      }
    }
    if (currentStreak > bestStreak) bestStreak = currentStreak;

    return {
      totalToday,
      totalBreaks,
      sessionsToday: workToday.length,
      totalWeek,
      goalProgress: Math.min(100, (totalToday / goalMs) * 100),
      streak: currentStreak,
      bestStreak,
      sessions: data.sessions,
    };
  }, [data.sessions, data.settings.dailyGoal, now]);

  // Weekly chart data
  const weeklyData = useMemo(() => {
    const arr = [];
    for (let d = 6; d >= 0; d--) {
      const dayStart = startOfDay(now) - d * 86400000;
      const dayEnd = dayStart + 86400000;
      const work = data.sessions
        .filter(
          (s) =>
            s.status === "completed" &&
            s.type === "work" &&
            s.start >= dayStart &&
            s.start < dayEnd,
        )
        .reduce((a, s) => a + (s.totalWorkTime || s.duration), 0);
      const breaks = data.sessions
        .filter(
          (s) =>
            s.status === "completed" &&
            s.type === "work" &&
            s.start >= dayStart &&
            s.start < dayEnd,
        )
        .reduce((a, s) => {
          const breakMs = (s.pauses || []).reduce((sum, p) => sum + ((p.end || 0) - p.start), 0);
          return a + breakMs;
        }, 0);
      // Also count legacy break sessions
      const legacyBreaks = data.sessions
        .filter(
          (s) =>
            s.status === "completed" &&
            s.type === "break" &&
            s.start >= dayStart &&
            s.start < dayEnd,
        )
        .reduce((a, s) => a + s.duration, 0);
      arr.push({
        day: dayName(dayStart),
        work: +(work / 3600000).toFixed(2),
        breaks: +((breaks + legacyBreaks) / 3600000).toFixed(2),
        date: dayStart,
      });
    }
    return arr;
  }, [data.sessions, now]);

  // Git-estimated work hours
  const gitEstimatedSessions = useMemo(() => {
    if (!data.commits || data.commits.length === 0) return [];
    const filtered = filterByAuthor(data.commits, data.settings.gitAuthors);
    return estimateWorkHours(filtered);
  }, [data.commits, data.settings.gitAuthors]);

  const gitEstimatedToday = useMemo(() => {
    const todayStart = startOfDay(now);
    return gitEstimatedSessions
      .filter((s) => s.start >= todayStart)
      .reduce((acc, s) => acc + s.duration, 0);
  }, [gitEstimatedSessions, now]);

  const nav = [
    { id: "dashboard", label: "Dashboard", icon: ICONS.dashboard },
    { id: "timer", label: "Timer", icon: ICONS.timer },
    { id: "sessions", label: "Sessions", icon: ICONS.list },
    { id: "git", label: "Git Tracking", icon: ICONS.github },
    { id: "analytics", label: "Analytics", icon: ICONS.chart },
    { id: "worklog", label: "Work Log", icon: ICONS.flag },
    { id: "export", label: "Export Report", icon: ICONS.download },
  ];

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 font-sans">
      {/* App content — inerted during sync to prevent edits underneath the modal */}
      <div className="min-h-screen flex" inert={syncOpen || undefined}>
      {/* Warm ambient gradient */}
      <div className="fixed inset-0 pointer-events-none bg-gradient-to-br from-amber-950/20 via-transparent to-orange-950/10" />
      {/* Mobile header bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-stone-900/95 backdrop-blur border-b border-stone-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <Icon path={ICONS.zap} size={16} className="text-white" />
          </div>
          <span className="font-bold">DevTrack</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 rounded-lg hover:bg-stone-800 text-stone-400"
          aria-label="Open menu"
        >
          <Icon path={ICONS.menu} size={22} />
        </button>
      </div>

      {/* Mobile overlay sidebar */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-64 bg-stone-900 border-r border-stone-800 p-5 flex flex-col z-50 md:hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                    <Icon path={ICONS.zap} size={20} className="text-white" />
                  </div>
                  <div>
                    <h1 className="font-bold text-lg leading-none">DevTrack</h1>
                    <p className="text-xs text-stone-400">Smart Work Tracker</p>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-stone-800 text-stone-400"
                  aria-label="Close menu"
                >
                  <Icon path={ICONS.close} size={20} />
                </button>
              </div>
              <nav className="flex-1 space-y-1">
                {nav.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      changeView(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                      view === item.id
                        ? "bg-gradient-to-r from-amber-500/20 to-orange-500/10 text-white border border-amber-500/30"
                        : "text-stone-400 hover:bg-stone-800/50 hover:text-white"
                    }`}
                  >
                    <Icon path={item.icon} size={18} />
                    {item.label}
                  </button>
                ))}
              </nav>
              {activeSession && (
                <div className={`p-3 rounded-xl border ${activeSession.status === "paused" ? "bg-gradient-to-br from-sky-500/20 to-blue-500/10 border-sky-500/30" : "bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border-emerald-500/30"}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full ${activeSession.status === "paused" ? "bg-sky-400" : "bg-emerald-400 animate-pulse"}`} />
                    <span className={`text-xs font-medium uppercase ${activeSession.status === "paused" ? "text-sky-300" : "text-emerald-300"}`}>
                      {activeSession.status === "paused" ? "On Break" : "Working"}
                    </span>
                  </div>
                  <div className="font-mono text-xl font-bold">
                    {formatDuration(elapsed)}
                  </div>
                </div>
              )}
              <button
                onClick={() => {
                  setSettingsOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="mt-4 flex items-center gap-2 px-3 py-2 text-sm text-stone-400 hover:text-white rounded-lg hover:bg-stone-800/50"
              >
                <Icon path={ICONS.settings} size={16} />
                Settings
              </button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className="hidden md:flex w-64 bg-stone-900/50 backdrop-blur border-r border-stone-800 p-5 flex-col sticky top-0 h-screen">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
            <Icon path={ICONS.zap} size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-none">DevTrack</h1>
            <p className="text-xs text-stone-400">Smart Work Tracker</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {nav.map((item) => (
            <button
              key={item.id}
              onClick={() => changeView(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                view === item.id
                  ? "bg-gradient-to-r from-amber-500/20 to-orange-500/10 text-white border border-amber-500/30"
                  : "text-stone-400 hover:bg-stone-800/50 hover:text-white"
              }`}
            >
              <Icon path={item.icon} size={18} />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Mini timer */}
        {activeSession && (
          <div className={`p-3 rounded-xl border ${activeSession.status === "paused" ? "bg-gradient-to-br from-sky-500/20 to-blue-500/10 border-sky-500/30" : "bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border-emerald-500/30"}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2 h-2 rounded-full ${activeSession.status === "paused" ? "bg-sky-400" : "bg-emerald-400 animate-pulse"}`} />
              <span className={`text-xs font-medium uppercase ${activeSession.status === "paused" ? "text-sky-300" : "text-emerald-300"}`}>
                {activeSession.status === "paused" ? "On Break" : "Working"}
              </span>
            </div>
            <div className="font-mono text-xl font-bold">
              {formatDuration(elapsed)}
            </div>
            <button
              onClick={() => changeView("timer")}
              className={`text-xs mt-1 ${activeSession.status === "paused" ? "text-sky-400 hover:text-sky-300" : "text-emerald-400 hover:text-emerald-300"}`}
            >
              View →
            </button>
          </div>
        )}

        <button
          onClick={() => setSettingsOpen(true)}
          className="mt-4 flex items-center gap-2 px-3 py-2 text-sm text-stone-400 hover:text-white rounded-lg hover:bg-stone-800/50"
        >
          <Icon path={ICONS.settings} size={16} />
          Settings
        </button>
      </aside>

      {/* Main */}
      <main className="flex-1 p-4 md:p-8 overflow-auto pt-16 md:pt-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {view === "dashboard" && (
              <Dashboard
                stats={stats}
                data={data}
                weeklyData={weeklyData}
                activeSession={activeSession}
                startSession={startSession}
                pauseSession={pauseSession}
                resumeSession={resumeSession}
                setView={changeView}
                gitEstimatedToday={gitEstimatedToday}
                gitEstimatedSessions={gitEstimatedSessions}
              />
            )}
            {view === "timer" && (
              <TimerView
                key={activeSession?.id || "idle"}
                activeSession={activeSession}
                elapsed={elapsed}
                startSession={startSession}
                pauseSession={pauseSession}
                resumeSession={resumeSession}
                stopSession={stopSession}
                updateSession={updateSession}
                addCheckpoint={addCheckpoint}
                updateCheckpoint={updateCheckpoint}
                deleteCheckpoint={deleteCheckpoint}
                data={data}
                showToast={showToast}
              />
            )}
            {view === "sessions" && (
              <SessionsView
                data={data}
                deleteSession={deleteSession}
                updateSession={updateSession}
                initialFilter={data.ui?.sessionsFilter || "all"}
                onFilterChange={(f) => updateUi({ sessionsFilter: f })}
                addCheckpoint={addCheckpoint}
                updateCheckpoint={updateCheckpoint}
                deleteCheckpoint={deleteCheckpoint}
                showToast={showToast}
              />
            )}
            {view === "git" && (
              <GitView
                data={data}
                addCommit={addCommit}
                setData={setData}
                showToast={showToast}
                importEstimatedSession={importEstimatedSession}
                importAllEstimated={importAllEstimated}
                isImported={isImported}
                initialRepoFilter={data.ui?.gitRepoFilter || "all"}
                onFilterChange={(r) => updateUi({ gitRepoFilter: r })}
              />
            )}
            {view === "analytics" && (
              <AnalyticsView
                data={data}
                weeklyData={weeklyData}
                gitEstimatedSessions={gitEstimatedSessions}
                initialRange={data.ui?.analyticsRange || "week"}
                onRangeChange={(r) => updateUi({ analyticsRange: r })}
                fetchFullData={fetchFullData}
              />
            )}
            {view === "worklog" && (
              <WorkLogView
                data={data}
                activeSession={activeSession}
                addCheckpoint={addCheckpoint}
                updateCheckpoint={updateCheckpoint}
                deleteCheckpoint={deleteCheckpoint}
                addWorkLogEntry={addWorkLogEntry}
                updateWorkLogEntry={updateWorkLogEntry}
                deleteWorkLogEntry={deleteWorkLogEntry}
                showToast={showToast}
              />
            )}
            {view === "export" && (
              <ExportView
                data={data}
                gitAuthors={data.settings.gitAuthors}
                showToast={showToast}
                initialPeriod={data.ui?.exportPeriod || "week"}
                initialFormat={data.ui?.exportFormat || "xlsx"}
                onPrefsChange={({ period, format }) => updateUi({ exportPeriod: period, exportFormat: format })}
                updateUi={updateUi}
                fetchFullData={fetchFullData}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
      </div>{/* end inerted content wrapper */}

      <SettingsModal
        key={settingsOpen ? "settings-open" : "settings-closed"}
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        data={data}
        updateSettings={updateSettings}
        showToast={showToast}
        onReset={handleReset}
        onOpenSync={() => { setSettingsOpen(false); setSyncOpen(true); }}
      />
      <SyncView
        key={syncOpen ? "sync-open" : "sync-closed"}
        open={syncOpen}
        onClose={() => setSyncOpen(false)}
        localData={data}
        applySyncResult={applySyncResult}
        showToast={showToast}
      />
      <Toast toast={toast} />

      {/* Quota warning banner */}
      {quotaWarning && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-600/90 text-white text-sm text-center py-2 px-4">
          Storage is full — your changes are not being saved locally.
          <button
            className="ml-3 underline hover:no-underline font-medium"
            onClick={() => setQuotaWarning(false)}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Server backup status dot — bottom-right corner */}
      <div
        className="fixed bottom-4 right-4 z-50 group flex items-end justify-end"
        title={serverStatus === "connected" ? "Server backup: connected" : "Server backup: disconnected"}
      >
        <div
          className={`w-3 h-3 rounded-full transition-colors ${
            serverStatus === "connected" ? "bg-emerald-500" : "bg-red-500"
          }`}
        />
        <span className="sr-only group-hover:not-sr-only group-hover:absolute group-hover:bottom-6 group-hover:right-0 group-hover:bg-stone-800 group-hover:text-stone-200 group-hover:text-xs group-hover:px-2 group-hover:py-1 group-hover:rounded group-hover:whitespace-nowrap group-hover:shadow-lg">
          Server backup: {serverStatus === "connected" ? "connected" : "disconnected"}
        </span>
      </div>
    </div>
  );
}

// ============ DASHBOARD ============
function Dashboard({
  stats,
  data,
  weeklyData,
  activeSession,
  startSession,
  pauseSession,
  resumeSession,
  gitEstimatedToday,
  gitEstimatedSessions,
}) {
  const goal = data.settings.dailyGoal || 8;
  const workedHrs = (stats.totalToday / 3600000).toFixed(1);
  const isFirstTime = data.sessions.length === 0;

  if (isFirstTime) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30 mb-6">
            <Icon path={ICONS.zap} size={36} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-3">Welcome to DevTrack</h1>
          <p className="text-stone-400 max-w-md mb-8">
            Track your work sessions, analyze productivity patterns, and generate
            professional reports. Start your first session to get going.
          </p>
          <button
            onClick={() => startSession("work", [], "")}
            className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 font-semibold text-lg shadow-lg shadow-amber-500/30 flex items-center gap-3"
          >
            <Icon path={ICONS.play} size={20} /> Start Your First Session
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-stone-800 p-8 bg-gradient-to-br from-amber-500/10 via-stone-950 to-orange-500/10">
        <div className="relative">
          <p className="text-stone-400 text-sm mb-1">
            {new Date().toLocaleDateString("en", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            Welcome back <Icon path={ICONS.wave} size={28} className="text-amber-400" />
          </h1>
          <p className="text-stone-300 max-w-xl">
            {activeSession
              ? activeSession.status === "paused"
                ? "You're on a break. Rest up and resume when you're ready."
                : "You're working right now. Keep going!"
              : stats.sessionsToday === 0
                ? "Ready to start a productive day? Hit the button below."
                : `You've logged ${stats.sessionsToday} session${stats.sessionsToday > 1 ? "s" : ""} today totaling ${workedHrs}h.`}
          </p>
          {!activeSession ? (
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => startSession("work", [], "")}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 font-medium shadow-lg shadow-amber-500/30 flex items-center gap-2 active:scale-[0.98] transition-transform"
              >
                <Icon path={ICONS.play} size={16} /> Start Work
              </button>
            </div>
          ) : (
            <div className="flex gap-3 mt-5">
              {activeSession.status === "paused" ? (
                <button
                  onClick={resumeSession}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 font-medium shadow-lg shadow-emerald-500/30 flex items-center gap-2 active:scale-[0.98] transition-transform"
                >
                  <Icon path={ICONS.play} size={16} /> Resume Work
                </button>
              ) : (
                <button
                  onClick={pauseSession}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 font-medium shadow-lg shadow-sky-500/30 flex items-center gap-2 active:scale-[0.98] transition-transform"
                >
                  <Icon path={ICONS.pause} size={16} /> Take a Break
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          label="Worked Today"
          value={`${workedHrs}h`}
          sub={`of ${goal}h goal`}
          icon={ICONS.clock}
          color="amber"
          progress={stats.goalProgress}
        />
        <StatCard
          label="Sessions"
          value={stats.sessionsToday}
          sub="today"
          icon={ICONS.target}
          color="emerald"
        />
        <StatCard
          label="Break Time"
          value={`${(stats.totalBreaks / 60000).toFixed(0)}m`}
          sub="today"
          icon={ICONS.coffee}
          color="sky"
        />
        <StatCard
          label="Streak"
          value={`${stats.streak}d`}
          sub={`best: ${stats.bestStreak}d`}
          icon={ICONS.fire}
          color="rose"
        />
      </div>

      {/* Git-Estimated vs Tracked comparison */}
      {gitEstimatedSessions && gitEstimatedSessions.length > 0 && (() => {
        const estHrs = (gitEstimatedToday / 3600000).toFixed(1);
        const trackedMs = stats.totalToday;
        const trackedHrs = (trackedMs / 3600000).toFixed(1);
        const goalMs = (data.settings.dailyGoal || 8) * 3600000;
        const maxVal = Math.max(gitEstimatedToday, trackedMs, goalMs);
        const trackedPct = maxVal > 0 ? (trackedMs / maxVal) * 100 : 0;
        const estPct = maxVal > 0 ? (gitEstimatedToday / maxVal) * 100 : 0;
        return (
          <div className="bg-gradient-to-br from-violet-500/10 via-stone-900/50 to-stone-950 border border-violet-500/20 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Icon path={ICONS.github} size={18} className="text-violet-400" />
                <span className="text-sm font-semibold text-violet-300">
                  Git-Estimated vs Tracked
                </span>
              </div>
              <span className="text-xs text-stone-500">today</span>
            </div>
            <div className="flex items-baseline gap-4 mb-3">
              <div>
                <span className="text-2xl font-bold text-white">{estHrs}h</span>
                <span className="text-xs text-stone-400 ml-1">estimated</span>
              </div>
              <div className="text-stone-600">/</div>
              <div>
                <span className="text-2xl font-bold text-white">{trackedHrs}h</span>
                <span className="text-xs text-stone-400 ml-1">tracked</span>
              </div>
            </div>
            <div className="h-2 bg-stone-800 rounded-full overflow-hidden flex">
              <div
                className="bg-amber-500 rounded-l-full transition-all duration-500"
                style={{ width: `${Math.min(trackedPct, 100)}%` }}
              />
              <div
                className="bg-violet-500 rounded-r-full transition-all duration-500"
                style={{ width: `${Math.min(estPct, 100)}%` }}
              />
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs text-stone-500">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> Tracked
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-violet-500" /> Estimated
              </span>
            </div>
          </div>
        );
      })()}

      {/* Charts + Activity */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 md:col-span-2 bg-stone-900/50 border border-stone-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">This Week</h3>
            <span className="text-xs text-stone-400">
              Work vs Breaks (hours)
            </span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={weeklyData}>
              <defs>
                <linearGradient id="gWork" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gBreak" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#292524" />
              <XAxis dataKey="day" stroke="#78716c" fontSize={12} />
              <YAxis stroke="#78716c" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: "#1c1917",
                  border: "1px solid #44403c",
                  borderRadius: 8,
                }}
              />
              <Area
                type="monotone"
                dataKey="work"
                stroke="#f59e0b"
                fill="url(#gWork)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="breaks"
                stroke="#38bdf8"
                fill="url(#gBreak)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-stone-900/50 border border-stone-800 rounded-2xl p-6">
          <h3 className="font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-3 max-h-[240px] overflow-auto">
            {data.sessions
              .slice()
              .reverse()
              .slice(0, 6)
              .map((s) => (
                <div key={s.id} className="flex items-start gap-3 text-sm">
                  <div
                    className={`w-2 h-2 rounded-full mt-1.5 ${s.type === "work" ? "bg-amber-400" : "bg-sky-400"}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-stone-200">
                      {s.notes || s.tags?.[0] || s.type}
                    </p>
                    <p className="text-xs text-stone-500">
                      {formatTime(s.start)} · {formatDuration(s.duration)}
                      {s.commitIds?.length > 0 &&
                        ` · ${s.commitIds.length} commit${s.commitIds.length > 1 ? "s" : ""}`}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, icon, color, progress }) {
  const colors = {
    amber:
      "from-amber-500/20 to-amber-500/5 border-amber-500/30 text-amber-400",
    emerald:
      "from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 text-emerald-400",
    sky: "from-sky-500/20 to-sky-500/5 border-sky-500/30 text-sky-400",
    rose: "from-rose-500/20 to-rose-500/5 border-rose-500/30 text-rose-400",
    violet:
      "from-violet-500/20 to-violet-500/5 border-violet-500/30 text-violet-400",
  };
  return (
    <div
      className={`bg-gradient-to-br ${colors[color]} border rounded-2xl p-5`}
    >
      <div className="flex items-center justify-between mb-3">
        <Icon path={icon} size={18} />
        <span className="text-xs text-stone-400 uppercase tracking-wide">
          {label}
        </span>
      </div>
      <div className="text-3xl font-bold text-white">{value}</div>
      <div className="text-xs text-stone-400 mt-1">{sub}</div>
      {typeof progress === "number" && (
        <div className="mt-3 h-1.5 bg-stone-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1 }}
            className="h-full bg-gradient-to-r from-amber-500 to-orange-500"
          />
        </div>
      )}
    </div>
  );
}

// ============ TIMER VIEW ============
function TimerView({
  activeSession,
  elapsed,
  startSession,
  pauseSession,
  resumeSession,
  stopSession,
  updateSession,
  addCheckpoint,
  updateCheckpoint,
  deleteCheckpoint,
  data,
  showToast,
}) {
  const [tags, setTags] = useState(() => activeSession?.tags?.join(", ") || "");
  const [notes, setNotes] = useState(() => activeSession?.notes || "");
  const [cpInput, setCpInput] = useState("");
  const [editingCpId, setEditingCpId] = useState(null);
  const [editCpData, setEditCpData] = useState({ text: "", tsInput: "" });
  const timelineRef = useRef(null);
  const persistTimer = useRef(null);

  // Auto-persist tags & notes to the active session (debounced)
  useEffect(() => {
    if (!activeSession) return;
    if (persistTimer.current) clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(() => {
      const parsedTags = tags.split(",").map((t) => t.trim()).filter(Boolean);
      updateSession(activeSession.id, { tags: parsedTags, notes });
    }, 500);
    return () => { if (persistTimer.current) clearTimeout(persistTimer.current); };
  }, [tags, notes, activeSession, updateSession]);

  // Sync local state when activeSession changes externally (e.g. navigating back)
  useEffect(() => {
    if (activeSession) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTags(activeSession.tags?.join(", ") || "");
      setNotes(activeSession.notes || "");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSession?.id]); // only on session identity change, not every prop update

  const handleStart = () => {
    startSession(
      "work",
      tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      notes,
    );
    setTags("");
    setNotes("");
  };

  const handleAddCp = () => {
    const text = cpInput.trim();
    if (!text || !activeSession) return;
    addCheckpoint(activeSession.id, text);
    setCpInput("");
    setTimeout(() => {
      if (timelineRef.current) timelineRef.current.scrollTop = 0;
    }, 50);
  };

  const handleEditCp = (cp) => {
    setEditingCpId(cp.id);
    setEditCpData({ text: cp.text, tsInput: formatTimeForInput(cp.ts) });
  };

  const handleSaveCp = (cp) => {
    const parsed = editCpData.tsInput ? parseTimeInput(editCpData.tsInput) : cp.ts;
    if (editCpData.tsInput && parsed === null) {
      showToast("Invalid time format — use h:mm AM/PM", "error");
      return;
    }
    // Guard: cancel if checkpoint no longer exists
    if (activeSession && !(activeSession.checkpoints || []).some((c) => c.id === cp.id)) {
      setEditingCpId(null);
      return;
    }
    updateCheckpoint(activeSession.id, cp.id, { text: editCpData.text.trim(), ts: parsed });
    setEditingCpId(null);
    setEditCpData({ text: "", tsInput: "" });
  };

  const handleCancelEditCp = () => {
    setEditingCpId(null);
    setEditCpData({ text: "", tsInput: "" });
  };

  const handleDeleteCp = (cp) => {
    if (confirm("Delete this checkpoint?")) {
      deleteCheckpoint(activeSession.id, cp.id);
      if (editingCpId === cp.id) handleCancelEditCp();
    }
  };

  const handleTogglePrivate = (cp) => {
    updateCheckpoint(activeSession.id, cp.id, { private: !cp.private });
  };

  // Compute work elapsed when running (elapsed already excludes pauses via timer tick)
  const workElapsed = activeSession?.status === "running" ? elapsed : 0;

  // Compute break elapsed when paused (elapsed is break time via timer tick)
  const breakElapsed = activeSession?.status === "paused" ? elapsed : 0;

  // Total work time (frozen) when paused — pure computation from session data
  const workElapsedFrozen = useMemo(() => {
    if (!activeSession || activeSession.status !== "paused") return 0;
    const completedPauses = (activeSession.pauses || [])
      .filter((p) => p.end !== null)
      .reduce((s, p) => s + (p.end - p.start), 0);
    const currentPause = activeSession.pauses[activeSession.pauses.length - 1];
    if (!currentPause) return 0;
    // Work time = time from session start to when current pause began, minus completed pauses
    return currentPause.start - activeSession.start - completedPauses;
  }, [activeSession]);

  const isPaused = activeSession?.status === "paused";
  const isRunning = activeSession?.status === "running";
  const displayWorkTime = isPaused ? workElapsedFrozen : (isRunning ? workElapsed : 0);

  const todaySessions = useMemo(
    () =>
      data.sessions.filter(
        (s) => isToday(s.start) && s.status === "completed",
      ),
    [data.sessions],
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Focus Timer</h2>
        <p className="text-stone-400">One session. Pause when you need a break. Stop when you&apos;re done.</p>
      </div>

      <div className="bg-gradient-to-br from-stone-900 to-stone-900/50 border border-stone-800 rounded-2xl p-6 sm:p-8 text-center">
            {/* Status badge */}
            {activeSession && (
              <div className="mb-5">
                <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide ${
                  isPaused
                    ? "bg-sky-500/15 text-sky-300 border border-sky-500/30"
                    : "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                }`}>
                  <span className={`w-2 h-2 rounded-full ${isPaused ? "bg-sky-400" : "bg-emerald-400 animate-pulse"}`} />
                  {isPaused ? "On Break" : "Working"}
                </span>
              </div>
            )}

            {/* Timer display */}
            <div className="relative inline-block mb-6">
              <div className={`w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 rounded-full flex items-center justify-center relative`}>
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 256 256">
                  <circle cx="128" cy="128" r="110" fill="none" stroke="#292524" strokeWidth="6" />
                  {activeSession && (
                    <circle
                      cx="128" cy="128" r="110" fill="none"
                      stroke={isPaused ? "url(#timerBreakGrad)" : "url(#timerGrad)"}
                      strokeWidth="6"
                      strokeDasharray={`${Math.min(((displayWorkTime) / ((data.settings.dailyGoal || 8) * 3600000)) * 691, 691)} 691`}
                      strokeLinecap="round"
                    />
                  )}
                  <defs>
                    <linearGradient id="timerGrad">
                      <stop offset="0%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#f97316" />
                    </linearGradient>
                    <linearGradient id="timerBreakGrad">
                      <stop offset="0%" stopColor="#38bdf8" />
                      <stop offset="100%" stopColor="#0ea5e9" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="text-center">
                  <div className="font-mono text-2xl sm:text-3xl font-bold">
                    {!activeSession ? "00:00:00" : formatDuration(displayWorkTime)}
                  </div>
                  <div className="text-xs uppercase tracking-widest text-stone-400 mt-2">
                    {!activeSession ? "Ready" : isPaused ? "Work Time" : "Elapsed"}
                  </div>
                </div>
              </div>
            </div>

            {/* Break timer — shown when paused */}
            {isPaused && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-3 px-5 rounded-xl bg-sky-500/10 border border-sky-500/20 inline-flex items-center gap-3"
              >
                <Icon path={ICONS.coffee} size={16} className="text-sky-400 shrink-0" />
                <div className="text-left">
                  <div className="text-[10px] text-sky-400/70 font-medium uppercase tracking-wider">Break</div>
                  <div className="font-mono text-lg font-bold text-sky-300 leading-tight">
                    {formatDuration(breakElapsed)}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Pauses taken indicator */}
            {activeSession && (activeSession.pauses || []).filter((p) => p.end !== null).length > 0 && !isPaused && (
              <div className="mb-5 inline-flex items-center gap-2 text-xs text-stone-500">
                <Icon path={ICONS.coffee} size={12} className="text-stone-500" />
                <span>
                  {(activeSession.pauses || []).filter((p) => p.end !== null).length} break{(activeSession.pauses || []).filter((p) => p.end !== null).length !== 1 ? "s" : ""} taken
                  {" "}(<span className="text-stone-400">{formatDuration((activeSession.pauses || []).filter((p) => p.end !== null).reduce((s, p) => s + (p.end - p.start), 0))}</span>)
                </span>
              </div>
            )}

            {/* Controls */}
            {!activeSession ? (
              <div className="max-w-sm mx-auto space-y-3">
                <div className="bg-stone-800/60 border border-stone-700/60 rounded-xl p-3 space-y-2.5">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500">
                      <Icon path={ICONS.tag} size={14} />
                    </span>
                    <input
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      placeholder="Tags (comma separated)"
                      className="w-full pl-9 pr-3 py-2 bg-stone-900/80 border border-stone-700/50 rounded-lg text-sm focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 placeholder:text-stone-600"
                    />
                  </div>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && (notes.trim() || tags.trim())) handleStart(); }}
                    placeholder="What are you working on?"
                    className="w-full px-3 py-2 bg-stone-900/80 border border-stone-700/50 rounded-lg text-sm focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 placeholder:text-stone-600"
                  />
                </div>
                <button
                  onClick={handleStart}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all"
                >
                  <Icon path={ICONS.play} size={16} /> Start Work Session
                </button>
              </div>
            ) : (
              <div className="max-w-sm mx-auto space-y-3">
                <div className="bg-stone-800/60 border border-stone-700/60 rounded-xl p-3 space-y-2.5">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500">
                      <Icon path={ICONS.tag} size={14} />
                    </span>
                    <input
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      placeholder="Tags"
                      className="w-full pl-9 pr-3 py-2 bg-stone-900/80 border border-stone-700/50 rounded-lg text-sm focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 placeholder:text-stone-600"
                    />
                  </div>
                </div>

                {/* Checkpoint timeline */}
                <div className="bg-stone-800/60 border border-stone-700/60 rounded-xl p-3">
                  {/* Add checkpoint input */}
                  <div className="flex gap-2">
                    <input
                      value={cpInput}
                      onChange={(e) => setCpInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && cpInput.trim()) handleAddCp(); }}
                      placeholder="Add checkpoint..."
                      maxLength={280}
                      className="flex-1 px-3 py-1.5 bg-stone-900/80 border border-stone-700/50 rounded-lg text-sm text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-amber-500/50"
                    />
                    <button
                      onClick={handleAddCp}
                      disabled={!cpInput.trim()}
                      className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 text-sm font-medium hover:bg-amber-500/30 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      <Icon path={ICONS.plus} size={14} /> Add
                    </button>
                  </div>

                  {/* Timeline entries */}
                  {(activeSession.checkpoints || []).length > 0 ? (
                    <div className="mt-3 max-h-60 overflow-y-auto space-y-1.5 pr-1" ref={timelineRef}>
                      {[...(activeSession.checkpoints || [])].reverse().map((cp) => (
                        <div key={cp.id} className="group flex items-start gap-2 py-1">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                          {editingCpId === cp.id ? (
                            <div className="flex-1 space-y-1.5">
                              <input
                                type="text"
                                value={editCpData.text}
                                onChange={(e) => setEditCpData((d) => ({ ...d, text: e.target.value }))}
                                className="w-full px-2 py-1 bg-stone-900/80 border border-stone-700/50 rounded text-xs text-stone-200 focus:outline-none focus:border-amber-500/50"
                              />
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="text"
                                  value={editCpData.tsInput}
                                  onChange={(e) => setEditCpData((d) => ({ ...d, tsInput: e.target.value }))}
                                  placeholder="h:mm AM/PM"
                                  className="w-24 px-2 py-1 bg-stone-900/80 border border-stone-700/50 rounded text-xs text-stone-200 focus:outline-none focus:border-amber-500/50"
                                />
                                <button
                                  onClick={() => handleSaveCp(cp)}
                                  className="px-2 py-1 text-xs rounded bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                                >Save</button>
                                <button
                                  onClick={handleCancelEditCp}
                                  className="px-2 py-1 text-xs rounded bg-stone-700/50 text-stone-400 hover:bg-stone-700"
                                >Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex-1 min-w-0">
                                <span className="text-xs text-stone-400">{formatTime(cp.ts)}</span>
                                <p className="text-sm text-stone-200 break-words">{cp.text}</p>
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                <button
                                  onClick={() => handleTogglePrivate(cp)}
                                  className="p-0.5 rounded hover:bg-stone-700/50"
                                  title={cp.private ? "Make visible" : "Make private"}
                                >
                                  <Icon
                                    path={cp.private ? ICONS.eyeOff : ICONS.eye}
                                    size={12}
                                    className={cp.private ? "text-stone-500" : "text-amber-400"}
                                  />
                                </button>
                                <button
                                  onClick={() => handleEditCp(cp)}
                                  className="p-0.5 rounded hover:bg-stone-700/50 text-stone-500 hover:text-stone-300"
                                  title="Edit"
                                >
                                  <Icon path={ICONS.edit} size={12} />
                                </button>
                                <button
                                  onClick={() => handleDeleteCp(cp)}
                                  className="p-0.5 rounded hover:bg-stone-700/50 text-stone-500 hover:text-rose-400"
                                  title="Delete"
                                >
                                  <Icon path={ICONS.trash} size={12} />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-stone-600 text-xs text-center py-3">
                      Add checkpoints to track your progress
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  {isPaused ? (
                    <button
                      onClick={resumeSession}
                      className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all"
                    >
                      <Icon path={ICONS.play} size={16} /> Resume
                    </button>
                  ) : (
                    <button
                      onClick={pauseSession}
                      className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 active:scale-[0.98] transition-all"
                    >
                      <Icon path={ICONS.pause} size={16} /> Break
                    </button>
                  )}
                  <button
                    onClick={stopSession}
                    className="flex-1 py-2.5 rounded-xl bg-stone-800 hover:bg-rose-900/40 text-sm font-medium flex items-center justify-center gap-1.5 border border-stone-700/50 hover:border-rose-500/30 active:scale-[0.98] transition-all text-stone-300 hover:text-rose-300"
                  >
                    <Icon path={ICONS.stop} size={14} /> Finish
                  </button>
                </div>
                <div className="flex items-center justify-center gap-2 text-xs text-stone-500 pt-1">
                  <span>Started {formatTime(activeSession.start)}</span>
                  {(activeSession.pauses || []).filter((p) => p.end !== null).length > 0 && (
                    <>
                      <span className="text-stone-700">·</span>
                      <span>{(activeSession.pauses || []).filter((p) => p.end !== null).length} break{(activeSession.pauses || []).filter((p) => p.end !== null).length !== 1 ? "s" : ""}</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

      {/* Today's sessions */}
      <div className="bg-stone-900/50 border border-stone-800 rounded-2xl p-6">
        <h3 className="font-semibold mb-4">Today's Sessions</h3>
        {todaySessions.length === 0 ? (
          <p className="text-stone-500 text-sm text-center py-6">
            No completed sessions yet
          </p>
        ) : (
          <div className="space-y-2">
            {todaySessions.map((s) => {
              const breakCount = (s.pauses || []).filter((p) => p.end).length;
              const breakTime = (s.pauses || []).reduce((sum, p) => sum + ((p.end || 0) - p.start), 0);
              return (
                <div
                  key={s.id}
                  className="flex items-center gap-3 p-3 bg-stone-800/50 rounded-xl"
                >
                  <div className="w-2 h-8 rounded bg-amber-400" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {s.notes || s.tags?.[0] || s.type}
                      </span>
                      {s.tags?.map((t) => (
                        <span
                          key={t}
                          className="text-xs px-2 py-0.5 bg-stone-700 rounded-full text-stone-300"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    <div className="text-xs text-stone-500">
                      {formatTime(s.start)} - {formatTime(s.end)}
                      {breakCount > 0 && (
                        <span className="text-sky-400/70 ml-2">
                          · {breakCount} break{breakCount !== 1 ? "s" : ""} ({formatDuration(breakTime)})
                        </span>
                      )}
                    </div>
                    {s.commitIds?.length > 0 && (
                      <div className="mt-1 space-y-0.5">
                        {s.commitIds.slice(0, 3).map((sha) => {
                          const commit = data.commits.find(
                            (c) => c.sha === sha,
                          );
                          if (!commit) return null;
                          return (
                            <div
                              key={sha}
                              className="flex items-center gap-1.5 text-xs text-stone-400 min-w-0 overflow-hidden"
                            >
                              <Icon path={ICONS.gitCommit} size={10} className="shrink-0" />
                              <span className="truncate min-w-0">{commit.message}</span>
                              <span className="text-stone-500 shrink-0 ml-auto whitespace-nowrap">
                                {formatTime(commit.timestamp)}
                              </span>
                            </div>
                          );
                        })}
                        {s.commitIds.length > 3 && (
                          <span className="text-xs text-stone-500">
                            +{s.commitIds.length - 3} more commits
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm">
                      {formatDuration(s.totalWorkTime || s.duration)}
                    </div>
                    {breakTime > 0 && (
                      <div className="text-xs text-stone-500">
                        +{formatDuration(breakTime)} break
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ============ SESSIONS VIEW ============
function SessionsView({ data, deleteSession, updateSession, initialFilter, onFilterChange, addCheckpoint, updateCheckpoint, deleteCheckpoint, showToast }) {
  const [filter, setFilter] = useState(initialFilter || "all");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  // ── Checkpoint UI state ──
  const [expandedSessionCps, setExpandedSessionCps] = useState(new Set());
  const [cpInputs, setCpInputs] = useState({});
  const [editingCp, setEditingCp] = useState(null); // { sessionId, cpId, text, tsInput }

  // ── Checkpoint handlers ──
  const toggleSessionCpExpand = (sessionId) => {
    setExpandedSessionCps((prev) => {
      const next = new Set(prev);
      if (next.has(sessionId)) next.delete(sessionId);
      else next.add(sessionId);
      return next;
    });
  };

  const handleAddCp = useCallback((sessionId) => {
    const text = (cpInputs[sessionId] || "").trim();
    if (!text) return;
    const s = data.sessions.find((sess) => sess.id === sessionId);
    const now = Date.now();
    const defaultTs = s ? (s.end || now) : now;
    addCheckpoint(sessionId, text, defaultTs);
    setCpInputs((prev) => ({ ...prev, [sessionId]: "" }));
  }, [cpInputs, data.sessions, addCheckpoint]);

  const handleEditCp = (sessionId, cp) => {
    setEditingCp({ sessionId, cpId: cp.id, text: cp.text, tsInput: formatTimeForInput(cp.ts) });
  };

  const handleSaveCp = () => {
    if (!editingCp) return;
    // Guard: cancel if checkpoint no longer exists
    const session = data.sessions.find((s) => s.id === editingCp.sessionId);
    if (!(session?.checkpoints || []).some((c) => c.id === editingCp.cpId)) {
      setEditingCp(null);
      return;
    }
    const parsed = editingCp.tsInput ? parseTimeInput(editingCp.tsInput) : null;
    if (editingCp.tsInput && parsed === null) {
      showToast("Invalid time format — use h:mm AM/PM", "error");
      return;
    }
    const updates = { text: editingCp.text.trim() };
    if (parsed !== null) updates.ts = parsed;
    updateCheckpoint(editingCp.sessionId, editingCp.cpId, updates);
    setEditingCp(null);
  };

  const handleCancelEditCp = () => {
    setEditingCp(null);
  };

  const handleDeleteCp = (sessionId, cpId) => {
    if (confirm("Delete this checkpoint?")) {
      deleteCheckpoint(sessionId, cpId);
      if (editingCp && editingCp.cpId === cpId) handleCancelEditCp();
    }
  };

  const handleTogglePrivate = (sessionId, cp) => {
    updateCheckpoint(sessionId, cp.id, { private: !cp.private });
  };

  const filtered = useMemo(
    () =>
      data.sessions
        .filter((s) => filter === "all" || s.type === filter)
        .filter(
          (s) =>
            !search ||
            (s.notes || "").toLowerCase().includes(search.toLowerCase()) ||
            s.tags?.some((t) =>
              t.toLowerCase().includes(search.toLowerCase()),
            ),
        )
        .sort((a, b) => b.start - a.start),
    [data.sessions, filter, search],
  );

  const grouped = filtered.reduce((acc, s) => {
    const key = formatDate(s.start);
    (acc[key] = acc[key] || []).push(s);
    return acc;
  }, {});

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Session History</h2>
        <p className="text-stone-400">All your tracked time</p>
      </div>

      <div className="flex gap-3 items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search sessions..."
          className="flex-1 px-4 py-2.5 bg-stone-900 border border-stone-800 rounded-xl text-sm focus:outline-none focus:border-amber-500"
        />
        <div className="flex gap-1 bg-stone-900 border border-stone-800 p-1 rounded-xl">
          {["all", "work"].map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); onFilterChange?.(f); }}
              className={`px-4 py-1.5 rounded-lg text-sm capitalize ${filter === f ? "bg-amber-500 text-white" : "text-stone-400"}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {Object.keys(grouped).length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Icon path={ICONS.list} size={40} className="text-stone-600 mb-4" />
            <h3 className="text-xl font-semibold text-stone-300 mb-2">
              {data.sessions.length === 0
                ? "No sessions yet"
                : "No matching sessions"}
            </h3>
            <p className="text-stone-500 max-w-sm">
              {data.sessions.length === 0
                ? "Start your first work session from the Timer or Dashboard to begin tracking your time."
                : "Try adjusting your search or filter to find what you're looking for."}
            </p>
          </div>
        )}
        {Object.entries(grouped).map(([date, sessions]) => {
          const dayWork = sessions
            .filter((s) => s.type === "work")
            .reduce((a, s) => a + (s.totalWorkTime || s.duration || 0), 0);
          return (
            <div key={date}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">
                  {date}{" "}
                  {isToday(sessions[0].start) && (
                    <span className="text-xs text-amber-400 ml-2">Today</span>
                  )}
                </h3>
                <span className="text-sm text-stone-400">
                  {(dayWork / 3600000).toFixed(1)}h work
                </span>
              </div>
              <div className="space-y-2">
                {sessions.map((s) => (
                  <motion.div
                    key={s.id}
                    layout
                    className="bg-stone-900/50 border border-stone-800 rounded-xl p-4 hover:bg-stone-800/40 hover:border-stone-700 transition-colors"
                  >
                    {/* Main row: color bar | content | duration | actions */}
                    <div className="flex items-center gap-4 min-w-0">
                    <div
                      className={`w-1 self-stretch rounded ${s.type === "work" ? "bg-amber-400" : "bg-sky-400"}`}
                    />
                    <div className="flex-1 min-w-0">
                      {editingId === s.id ? (
                        <div className="space-y-2">
                          <input
                            value={editData.notes || ""}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                notes: e.target.value,
                              })
                            }
                            className="w-full px-3 py-1.5 bg-stone-800 rounded text-sm"
                            placeholder="Notes"
                          />
                          <input
                            value={editData.tags || ""}
                            onChange={(e) =>
                              setEditData({ ...editData, tags: e.target.value })
                            }
                            className="w-full px-3 py-1.5 bg-stone-800 rounded text-sm"
                            placeholder="Tags"
                          />
                        </div>
                      ) : (
                        <>
                          <p className="font-medium">
                            {s.notes || "Untitled session"}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-stone-400">
                              {formatTime(s.start)} - {formatTime(s.end)}
                            </span>
                            {(s.pauses || []).filter((p) => p.end).length > 0 && (
                              <span className="text-xs text-sky-400/70">
                                {(s.pauses || []).filter((p) => p.end).length} break{(s.pauses || []).filter((p) => p.end).length !== 1 ? "s" : ""}
                              </span>
                            )}
                            {s.tags?.map((t) => (
                              <span
                                key={t}
                                className="text-xs px-2 py-0.5 bg-stone-800 rounded-full text-stone-300"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                          {s.commitIds?.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {s.commitIds.map((sha) => {
                                const commit = data.commits.find(
                                  (c) => c.sha === sha,
                                );
                                if (!commit) return null;
                                return (
                                  <div
                                    key={sha}
                                    className="flex items-center gap-2 text-xs text-stone-400 bg-stone-800/40 rounded-lg px-2.5 py-1.5 min-w-0 overflow-hidden"
                                  >
                                    <Icon path={ICONS.gitCommit} size={12} className="shrink-0" />
                                    <span className="font-mono text-stone-500 shrink-0">
                                      {sha.slice(0, 7)}
                                    </span>
                                    <span className="truncate min-w-0">
                                      {commit.message}
                                    </span>
                                    <span className="text-stone-500 shrink-0 ml-auto whitespace-nowrap">
                                      {formatDate(commit.timestamp)} {formatTime(commit.timestamp)}
                                    </span>
                                    {commit.repo && (
                                      <span className="text-stone-500 shrink-0 whitespace-nowrap">
                                        {commit.repo}
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm text-stone-300">
                        {formatDuration(s.totalWorkTime || s.duration)}
                      </div>
                      {(s.pauses || []).filter((p) => p.end).length > 0 && (
                        <div className="text-xs text-stone-500">
                          +{formatDuration((s.pauses || []).reduce((sum, p) => sum + ((p.end || 0) - p.start), 0))} breaks
                        </div>
                      )}
                    </div>
                    {editingId === s.id ? (
                      <button
                        onClick={() => {
                          updateSession(s.id, {
                            notes: editData.notes,
                            tags: editData.tags
                              ?.split(",")
                              .map((t) => t.trim())
                              .filter(Boolean),
                          });
                          setEditingId(null);
                        }}
                        className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                        aria-label="Save changes"
                      >
                        <Icon path={ICONS.check} size={16} />
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingId(s.id);
                          setEditData({
                            notes: s.notes,
                            tags: s.tags?.join(", "),
                          });
                        }}
                        className="p-2 rounded-lg hover:bg-stone-800 text-stone-400"
                        aria-label="Edit session"
                      >
                        <Icon path={ICONS.edit} size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (confirm(`Delete this ${s.type} session (${formatDuration(s.duration)})?`)) {
                          deleteSession(s.id);
                        }
                      }}
                      className="p-2 rounded-lg hover:bg-rose-500/20 text-stone-400 hover:text-rose-400"
                      aria-label="Delete session"
                    >
                      <Icon path={ICONS.trash} size={16} />
                    </button>
                    </div>

                    {/* ── Collapsible checkpoints section ── */}
                    <div className="mt-3 pt-3 border-t border-stone-800/60">
                      <button
                        onClick={() => toggleSessionCpExpand(s.id)}
                        className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-300"
                      >
                        <Icon path={expandedSessionCps.has(s.id) ? ICONS.chevronDown : ICONS.chevronRight} size={12} />
                        <Icon path={ICONS.flag} size={12} className="text-amber-500/60" />
                        {(s.checkpoints || []).length > 0
                          ? `${(s.checkpoints || []).length} checkpoint${(s.checkpoints || []).length !== 1 ? "s" : ""}`
                          : "No checkpoints — add"}
                      </button>

                      {expandedSessionCps.has(s.id) && (
                        <div className="mt-2 ml-5 space-y-1.5">
                          {(s.checkpoints || []).length === 0 && (
                            <p className="text-xs text-stone-600 py-1">No checkpoints yet</p>
                          )}
                          {(s.checkpoints || []).map((cp) => (
                              <div key={cp.id} className="group flex items-start gap-2 py-1">
                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                                {editingCp && editingCp.cpId === cp.id ? (
                                  <div className="flex-1 space-y-1.5">
                                    <input
                                      type="text"
                                      value={editingCp.text}
                                      onChange={(e) => setEditingCp((prev) => ({ ...prev, text: e.target.value }))}
                                      className="w-full px-2 py-1 bg-stone-900/80 border border-stone-700/50 rounded text-xs text-stone-200 focus:outline-none focus:border-amber-500/50"
                                    />
                                    <div className="flex items-center gap-1.5">
                                      <input
                                        type="text"
                                        value={editingCp.tsInput}
                                        onChange={(e) => setEditingCp((prev) => ({ ...prev, tsInput: e.target.value }))}
                                        placeholder="h:mm AM/PM"
                                        className="w-24 px-2 py-1 bg-stone-900/80 border border-stone-700/50 rounded text-xs text-stone-200 focus:outline-none focus:border-amber-500/50"
                                      />
                                      <button
                                        onClick={handleSaveCp}
                                        className="px-2 py-1 text-xs rounded bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                                      >Save</button>
                                      <button
                                        onClick={handleCancelEditCp}
                                        className="px-2 py-1 text-xs rounded bg-stone-700/50 text-stone-400 hover:bg-stone-700"
                                      >Cancel</button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <div className="flex-1 min-w-0">
                                      <span className="text-xs text-stone-400">{formatTime(cp.ts)}</span>
                                      <p className="text-sm text-stone-200 break-words">{cp.text}</p>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                      <button
                                        onClick={() => handleTogglePrivate(s.id, cp)}
                                        className="p-0.5 rounded hover:bg-stone-700/50"
                                        title={cp.private ? "Make visible" : "Make private"}
                                      >
                                        <Icon
                                          path={cp.private ? ICONS.eyeOff : ICONS.eye}
                                          size={12}
                                          className={cp.private ? "text-stone-500" : "text-amber-400"}
                                        />
                                      </button>
                                      <button
                                        onClick={() => handleEditCp(s.id, cp)}
                                        className="p-0.5 rounded hover:bg-stone-700/50 text-stone-500 hover:text-stone-300"
                                        title="Edit"
                                      >
                                        <Icon path={ICONS.edit} size={12} />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteCp(s.id, cp.id)}
                                        className="p-0.5 rounded hover:bg-stone-700/50 text-stone-500 hover:text-rose-400"
                                        title="Delete"
                                      >
                                        <Icon path={ICONS.trash} size={12} />
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            ))}

                            {/* Add checkpoint input (for completed sessions) */}
                            <div className="flex gap-2 mt-2">
                              <input
                                value={cpInputs[s.id] || ""}
                                onChange={(e) => setCpInputs((prev) => ({ ...prev, [s.id]: e.target.value }))}
                                onKeyDown={(e) => { if (e.key === "Enter" && (cpInputs[s.id] || "").trim()) handleAddCp(s.id); }}
                                placeholder="Add checkpoint..."
                                maxLength={280}
                                className="flex-1 px-3 py-1.5 bg-stone-900/80 border border-stone-700/50 rounded-lg text-xs text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-amber-500/50"
                              />
                              <button
                                onClick={() => handleAddCp(s.id)}
                                disabled={!(cpInputs[s.id] || "").trim()}
                                className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-medium hover:bg-amber-500/30 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                              >
                                <Icon path={ICONS.plus} size={12} /> Add
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============ GIT VIEW ============
function GitView({ data, addCommit, setData, showToast, importEstimatedSession, importAllEstimated, isImported, initialRepoFilter, onFilterChange }) {
  const [repoPath, setRepoPath] = useState("");
  const [validating, setValidating] = useState(false);
  const [repoError, setRepoError] = useState("");
  const [syncingRepoId, setSyncingRepoId] = useState(null);
  const [serverStatus, setServerStatus] = useState(null); // "online" | "offline" | "no-git"
  const [repoFilter, setRepoFilter] = useState(initialRepoFilter || "all");
  const [manualCommit, setManualCommit] = useState({
    sha: "",
    message: "",
    repo: "",
  });

  const trackedRepos = data.settings.trackedRepos || [];

  // Check server health on mount
  useEffect(() => {
    fetch("/api/git/health")
      .then((r) => r.json())
      .then((d) => setServerStatus(d.git ? "online" : "no-git"))
      .catch(() => setServerStatus("offline"));
  }, []);

  const validateRepo = async () => {
    const trimmed = repoPath.trim();
    if (!trimmed) {
      setRepoError("Enter a folder path");
      return;
    }
    setValidating(true);
    setRepoError("");
    try {
      const res = await fetch("/api/git/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: trimmed }),
      });
      const result = await res.json();
      if (!res.ok) {
        setRepoError(result.error || "Validation failed");
        return;
      }
      if (!result.valid) {
        setRepoError(result.error || "Invalid path");
        return;
      }
      if (!result.isRepo) {
        setRepoError("Not a git repository");
        return;
      }
      // Check if already tracked
      if (trackedRepos.some((r) => r.path === trimmed)) {
        setRepoError("This repository is already tracked");
        return;
      }
      const repo = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2),
        path: trimmed,
        name: result.name,
        branch: result.branch,
        lastSync: null,
      };
      setData((d) => ({
        ...d,
        settings: {
          ...d.settings,
          trackedRepos: [...(d.settings.trackedRepos || []), repo],
        },
      }));
      setRepoPath("");
      showToast(`Tracking "${repo.name}" on ${repo.branch}`);
    } catch {
      setServerStatus("offline");
      setRepoError("Cannot reach git server");
    }
    setValidating(false);
  };

  const syncRepo = async (repo) => {
    setSyncingRepoId(repo.id);
    try {
      const res = await fetch("/api/git/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: repo.path, count: 200 }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to fetch git log");
      }
      const result = await res.json();

      // Auto-detect git user identity from this repo
      let detectedUser = null;
      try {
        const userRes = await fetch("/api/git/user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path: repo.path }),
        });
        if (userRes.ok) {
          const userData = await userRes.json();
          if (userData.name || userData.email) {
            detectedUser = { name: userData.name, email: userData.email };
          }
        }
      } catch { /* non-critical */ }

      // Merge: replace old commits from this repo path, add new ones
      setData((d) => {
        const others = d.commits.filter(
          (c) => c.source !== "local" || c.repoPath !== repo.path,
        );
        const newCommits = result.commits.map((c) => ({
          ...c,
          source: "local",
        }));

        // Update gitAuthors: auto-add detected identity if not already known
        const prevAuthors = d.settings.gitAuthors || { identities: [], autoDetected: null };
        const identities = [...(prevAuthors.identities || [])];
        if (detectedUser) {
          const alreadyKnown = identities.some(
            (id) => id.email?.toLowerCase() === detectedUser.email?.toLowerCase(),
          );
          if (!alreadyKnown) {
            identities.push(detectedUser);
          }
        }

        return {
          ...d,
          commits: [...newCommits, ...others],
          settings: {
            ...d.settings,
            trackedRepos: (d.settings.trackedRepos || []).map((r) =>
              r.id === repo.id ? { ...r, lastSync: Date.now() } : r,
            ),
            gitAuthors: {
              identities,
              autoDetected: detectedUser || prevAuthors.autoDetected,
            },
          },
        };
      });
      // Re-link commits to all sessions now that fresh commits are in state
      setData((d) => ({
        ...d,
        sessions: linkCommitsToSessions(d.sessions, d.commits),
      }));
      showToast(`Synced ${result.commits.length} commits from ${repo.name}`);
    } catch (err) {
      showToast(err.message || "Sync failed", "error");
    }
    setSyncingRepoId(null);
  };

  const syncAll = async () => {
    for (const repo of trackedRepos) {
      await syncRepo(repo);
    }
  };

  const removeRepo = (repoId) => {
    const repo = trackedRepos.find((r) => r.id === repoId);
    if (!repo) return;
    setData((d) => ({
      ...d,
      commits: d.commits.filter(
        (c) => c.source !== "local" || c.repoPath !== repo.path,
      ),
      settings: {
        ...d.settings,
        trackedRepos: (d.settings.trackedRepos || []).filter(
          (r) => r.id !== repoId,
        ),
      },
    }));
    showToast(`Removed "${repo.name}"`);
  };

  const addManual = () => {
    if (!manualCommit.message) return;
    const sha = manualCommit.sha.trim();
    addCommit({
      sha: sha || "manual",
      message: manualCommit.message,
      repo: manualCommit.repo || "manual",
      timestamp: Date.now(),
      source: "manual",
      repoPath: "",
    });
    setManualCommit({ sha: "", message: "", repo: "" });
    showToast("Commit added");
  };

  // Filter commits by identity (always applied) then by selected repo
  const identityFilteredCommits = useMemo(
    () => filterByAuthor(data.commits, data.settings.gitAuthors),
    [data.commits, data.settings.gitAuthors],
  );

  const filteredCommits =
    repoFilter === "all"
      ? identityFilteredCommits
      : identityFilteredCommits.filter((c) => c.repo === repoFilter);

  // Identity-filtered estimated sessions (newest first)
  const filteredEstimates = useMemo(
    () => estimateWorkHours(identityFilteredCommits)
      .sort((a, b) => b.start - a.start),
    [identityFilteredCommits],
  );

  const filteredEstimatesByRepo = useMemo(() => {
    const byRepo = {};
    filteredEstimates.forEach((s) => {
      const repo = s.repoName || "unknown";
      if (!byRepo[repo]) byRepo[repo] = { total: 0, sessions: [] };
      byRepo[repo].total += s.duration;
      byRepo[repo].sessions.push(s);
    });
    // Sort repos by most recent session first
    return Object.fromEntries(
      Object.entries(byRepo).sort(([, a], [, b]) =>
        b.sessions[0].start - a.sessions[0].start,
      ),
    );
  }, [filteredEstimates]);

  // Unique repo names for filter dropdown (from identity-filtered commits)
  const repoNames = [
    ...new Set(identityFilteredCommits.map((c) => c.repo).filter(Boolean)),
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Git Tracking</h2>
        <p className="text-stone-400">
          Track commits from your local git repositories
        </p>
      </div>

      {/* Server status banner */}
      {serverStatus === "offline" && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-sm text-rose-300">
          Git server is not running. Start it with{" "}
          <code className="bg-rose-500/20 px-1.5 py-0.5 rounded text-xs">
            npm run dev:server
          </code>{" "}
          or use <code className="bg-rose-500/20 px-1.5 py-0.5 rounded text-xs">npm run dev</code> to start both.
        </div>
      )}
      {serverStatus === "no-git" && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-sm text-amber-300">
          git is not installed or not on PATH. Install git to use local
          tracking.
        </div>
      )}

      {/* Add repo panel */}
      <div className="bg-stone-900/50 border border-stone-800 rounded-2xl p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Icon path={ICONS.plus} size={18} /> Add Repository
        </h3>
        <div className="flex gap-3">
          <input
            value={repoPath}
            onChange={(e) => {
              setRepoPath(e.target.value);
              setRepoError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && validateRepo()}
            placeholder="/path/to/your/project"
            className="flex-1 px-4 py-2.5 bg-stone-800 border border-stone-700 rounded-lg text-sm focus:outline-none focus:border-amber-500 font-mono"
          />
          <button
            onClick={validateRepo}
            disabled={validating || serverStatus === "offline"}
            className="px-6 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-50 font-medium flex items-center gap-2 whitespace-nowrap"
          >
            {validating ? "Checking..." : "Validate & Add"}
          </button>
        </div>
        {repoError && (
          <p className="text-xs text-rose-400 mt-2">{repoError}</p>
        )}
      </div>

      {/* Tracked repos list */}
      {trackedRepos.length > 0 && (
        <div className="bg-stone-900/50 border border-stone-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">
              Tracked Repositories ({trackedRepos.length})
            </h3>
            <button
              onClick={syncAll}
              disabled={syncingRepoId !== null}
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-sm font-medium flex items-center gap-2"
            >
              <Icon
                path={ICONS.refresh}
                size={14}
                className={syncingRepoId !== null ? "animate-spin" : ""}
              />
              Sync All
            </button>
          </div>
          <div className="space-y-3">
            {trackedRepos.map((repo) => (
              <div
                key={repo.id}
                className="flex items-center gap-4 p-4 bg-stone-800/50 rounded-xl"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
                  <Icon path={ICONS.git} size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{repo.name}</p>
                  <p className="text-xs text-stone-500 font-mono truncate">
                    {repo.path}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                      {repo.branch}
                    </span>
                    {repo.lastSync && (
                      <span className="text-xs text-stone-500">
                        Last sync: {formatDate(repo.lastSync)}{" "}
                        {formatTime(repo.lastSync)}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => syncRepo(repo)}
                  disabled={syncingRepoId !== null}
                  className="p-2 rounded-lg hover:bg-stone-700 text-stone-400 hover:text-white disabled:opacity-50"
                  aria-label={`Sync ${repo.name}`}
                >
                  <Icon
                    path={ICONS.refresh}
                    size={16}
                    className={
                      syncingRepoId === repo.id ? "animate-spin" : ""
                    }
                  />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Remove "${repo.name}" from tracking?`)) {
                      removeRepo(repo.id);
                    }
                  }}
                  className="p-2 rounded-lg hover:bg-rose-500/20 text-stone-400 hover:text-rose-400"
                  aria-label={`Remove ${repo.name}`}
                >
                  <Icon path={ICONS.trash} size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual commit entry */}
      <div className="bg-stone-900/50 border border-stone-800 rounded-2xl p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Icon path={ICONS.plus} size={18} /> Manual Commit
        </h3>
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              value={manualCommit.repo}
              onChange={(e) =>
                setManualCommit({ ...manualCommit, repo: e.target.value })
              }
              placeholder="Repository"
              className="px-4 py-2 bg-stone-800 border border-stone-700 rounded-lg text-sm focus:outline-none focus:border-amber-500"
            />
            <input
              value={manualCommit.message}
              onChange={(e) =>
                setManualCommit({ ...manualCommit, message: e.target.value })
              }
              placeholder="Commit message"
              className="md:col-span-2 px-4 py-2 bg-stone-800 border border-stone-700 rounded-lg text-sm focus:outline-none focus:border-amber-500"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              value={manualCommit.sha}
              onChange={(e) =>
                setManualCommit({ ...manualCommit, sha: e.target.value })
              }
              placeholder="SHA"
              className="px-4 py-2 bg-stone-800 border border-stone-700 rounded-lg text-sm focus:outline-none focus:border-amber-500"
            />
            <button
              onClick={addManual}
              className="md:col-span-2 px-4 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 font-medium whitespace-nowrap transition-colors"
            >
              Add Commit
            </button>
          </div>
        </div>
      </div>

      {/* Commits list */}
      <div className="bg-stone-900/50 border border-stone-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">
            Commits ({filteredCommits.length})
          </h3>
          {repoNames.length > 1 && (
            <select
              value={repoFilter}
              onChange={(e) => { setRepoFilter(e.target.value); onFilterChange?.(e.target.value); }}
              className="px-3 py-1.5 bg-stone-800 border border-stone-700 rounded-lg text-sm focus:outline-none focus:border-amber-500"
            >
              <option value="all">All repos</option>
              {repoNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="space-y-2 max-h-[500px] overflow-auto">
          {syncingRepoId !== null &&
            filteredCommits.length === 0 && (
              <div className="flex items-center justify-center py-8 gap-2 text-stone-400">
                <Icon
                  path={ICONS.refresh}
                  size={16}
                  className="animate-spin"
                />
                Syncing...
              </div>
            )}
          {filteredCommits.length === 0 && syncingRepoId === null && (
            <p className="text-stone-500 text-center py-8">
              No commits yet. Add a repository above or enter commits manually.
            </p>
          )}
          {filteredCommits.map((c, i) => (
            <div
              key={`${c.sha}-${i}`}
              className="flex items-start gap-3 p-3 bg-stone-800/50 rounded-xl"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Icon path={ICONS.code} size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-mono text-xs text-emerald-400">
                    {c.sha}
                  </p>
                  {c.source === "manual" && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-700 text-stone-400">
                      manual
                    </span>
                  )}
                  {c.filesChanged > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-700 text-stone-400">
                      {c.filesChanged} file{c.filesChanged !== 1 && "s"}
                      {c.insertions > 0 && (
                        <span className="text-emerald-400 ml-1">
                          +{c.insertions}
                        </span>
                      )}
                      {c.deletions > 0 && (
                        <span className="text-rose-400 ml-1">
                          -{c.deletions}
                        </span>
                      )}
                    </span>
                  )}
                </div>
                <p className="text-sm">{c.message}</p>
                <p className="text-xs text-stone-500 mt-1">
                  {c.repo}
                  {c.branch && (
                    <span className="text-emerald-400/70 ml-1">
                      ({c.branch})
                    </span>
                  )}
                  {c.author && <span className="ml-1">by {c.author}</span>}
                  {" · "}
                  {formatDate(c.timestamp)} {formatTime(c.timestamp)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Estimated Work Hours */}
      {filteredEstimates && filteredEstimates.length > 0 && (
        <div className="bg-stone-900/50 border border-stone-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Icon path={ICONS.chart} size={16} className="text-violet-400" />
              <h3 className="font-semibold">Estimated Work Hours</h3>
            </div>
            {filteredEstimates.length > 0 && (
              <button
                onClick={() => importAllEstimated(filteredEstimates.filter((s) => !isImported(s.id)))}
                disabled={filteredEstimates.every((s) => isImported(s.id))}
                className="px-3 py-1.5 rounded-lg bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Import All
              </button>
            )}
          </div>

          {/* Per-repo breakdown */}
          {filteredEstimatesByRepo && Object.entries(filteredEstimatesByRepo).map(([repo, info]) => {
            const repoHrs = (info.total / 3600000).toFixed(1);
            const allImported = info.sessions.every((s) => isImported(s.id));
            return (
              <div key={repo} className="mb-4 last:mb-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-stone-200">{repo}</span>
                  <span className="text-xs text-stone-400">
                    {repoHrs}h · {info.sessions.length} session{info.sessions.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {info.sessions.map((est) => {
                    const imported = isImported(est.id);
                    const confidenceColor = est.confidence === "high"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : est.confidence === "medium"
                        ? "bg-amber-500/20 text-amber-400"
                        : "bg-stone-500/20 text-stone-400";
                    return (
                      <div
                        key={est.id}
                        className="flex items-center gap-3 px-3 py-2 bg-stone-800/50 rounded-xl"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-stone-300">
                              {formatDate(est.start)} {formatTime(est.start)} – {formatTime(est.end)}
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${confidenceColor}`}>
                              {est.confidence}
                            </span>
                          </div>
                          <p className="text-xs text-stone-500 mt-0.5">
                            {est.commitCount} commit{est.commitCount !== 1 ? "s" : ""}
                            {est.totalLines > 0 && ` · ${est.totalLines} lines changed`}
                            {" · "}{formatDuration(est.duration)}
                          </p>
                        </div>
                        <button
                          onClick={() => importEstimatedSession(est)}
                          disabled={imported}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                            imported
                              ? "bg-stone-700/50 text-stone-500 cursor-not-allowed"
                              : "bg-violet-500/20 hover:bg-violet-500/30 text-violet-300"
                          }`}
                        >
                          {imported ? "Imported" : "Import"}
                        </button>
                      </div>
                    );
                  })}
                </div>
                {!allImported && info.sessions.length > 1 && (
                  <button
                    onClick={() => importAllEstimated(info.sessions.filter((s) => !isImported(s.id)))}
                    className="mt-2 text-xs text-violet-400 hover:text-violet-300 transition-colors"
                  >
                    Import all {repo} sessions
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state when commits exist but no estimates (or filter yielded nothing) */}
      {filteredEstimates && filteredEstimates.length === 0 && data.commits && data.commits.length > 0 && (
        <div className="bg-stone-900/50 border border-stone-800 rounded-2xl p-6 text-center">
          <Icon path={ICONS.chart} size={24} className="text-stone-600 mx-auto mb-2" />
          <p className="text-sm text-stone-500">
            No matching commits for your git identities. Add identities in Settings &rarr; My Git Identities.
          </p>
        </div>
      )}
    </div>
  );
}

// ============ ANALYTICS VIEW ============
function AnalyticsView({ data, gitEstimatedSessions, initialRange, onRangeChange, fetchFullData }) {
  const [range, setRange] = useState(initialRange || "week");
  const [now] = useState(() => Date.now());
  const [fullData, setFullData] = useState(null);
  const [loadingFull, setLoadingFull] = useState(false);

  // When range is "year", fetch full historical data from server (beyond 2-month localStorage cache)
  useEffect(() => {
    if (range === "year" && fetchFullData && !fullData && !loadingFull) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoadingFull(true);
      fetchFullData().then((fd) => {
        setFullData(fd);
        setLoadingFull(false);
      });
    }
    if (range !== "year") {
      setFullData(null); // clear when switching back to smaller ranges
    }
  }, [range, fetchFullData, fullData, loadingFull]);

  // Use full data for "year" range, localStorage cache for smaller ranges
  const activeData = range === "year" && fullData ? fullData : data;

  const rangeData = useMemo(() => {
    const days = range === "week" ? 7 : range === "month" ? 30 : 365;
    const arr = [];
    for (let d = days - 1; d >= 0; d--) {
      const dayStart = startOfDay(now) - d * 86400000;
      const dayEnd = dayStart + 86400000;
      const work = activeData.sessions
        .filter(
          (s) =>
            s.status === "completed" &&
            s.type === "work" &&
            s.start >= dayStart &&
            s.start < dayEnd,
        )
        .reduce((a, s) => a + (s.totalWorkTime || s.duration), 0);
      const gitWork = (gitEstimatedSessions || [])
        .filter((s) => s.start >= dayStart && s.start < dayEnd)
        .reduce((a, s) => a + s.duration, 0);
      arr.push({
        day:
          range === "week"
            ? dayName(dayStart)
            : `${new Date(dayStart).getDate()}/${new Date(dayStart).getMonth() + 1}`,
        hours: +(work / 3600000).toFixed(2),
        gitHours: +(gitWork / 3600000).toFixed(2),
        date: dayStart,
      });
    }
    return arr;
  }, [activeData.sessions, range, now, gitEstimatedSessions]);

  const totalHrs = rangeData.reduce((a, r) => a + r.hours, 0);
  const avgHrs = (totalHrs / rangeData.length).toFixed(1);
  const maxDay = Math.max(...rangeData.map((r) => r.hours));

  const { tagData, hourlyData } = useMemo(() => {
    const rangeDays = range === "week" ? 7 : range === "month" ? 30 : 365;
    const rangeCutoff = now - rangeDays * 86400000;

    const tagBreakdown = {};
    activeData.sessions
      .filter(
        (s) =>
          s.status === "completed" &&
          s.type === "work" &&
          s.start >= rangeCutoff,
      )
      .forEach((s) => {
        (s.tags || []).forEach((t) => {
          tagBreakdown[t] = (tagBreakdown[t] || 0) + (s.totalWorkTime || s.duration);
        });
      });
    const tagData = Object.entries(tagBreakdown).map(([name, value]) => ({
      name,
      value: +(value / 3600000).toFixed(2),
    }));

    const hourly = Array(24).fill(0);
    activeData.sessions
      .filter(
        (s) =>
          s.status === "completed" &&
          s.type === "work" &&
          s.start >= rangeCutoff,
      )
      .forEach((s) => {
        const h = new Date(s.start).getHours();
        hourly[h] += (s.totalWorkTime || s.duration);
      });
    const hourlyData = hourly.map((v, i) => ({
      hour: `${i}:00`,
      minutes: +(v / 60000).toFixed(0),
    }));

    return { tagData, hourlyData };
  }, [activeData.sessions, range, now]);

  const COLORS = [
    "#f59e0b",
    "#f97316",
    "#ef4444",
    "#a855f7",
    "#10b981",
    "#06b6d4",
  ];

  const completedSessions = activeData.sessions.filter(
    (s) => s.status === "completed",
  );
  if (completedSessions.length === 0) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Icon path={ICONS.chart} size={40} className="text-stone-600 mb-4" />
          <h3 className="text-xl font-semibold text-stone-300 mb-2">
            No data yet
          </h3>
          <p className="text-stone-500 max-w-sm">
            Complete some work sessions to see your productivity analytics and
            work patterns here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics</h2>
          <p className="text-stone-400">
            Deep insights into your work patterns
          </p>
        </div>
        <div className="flex gap-1 bg-stone-900 border border-stone-800 p-1 rounded-xl">
          {["week", "month", "year"].map((r) => (
            <button
              key={r}
              onClick={() => { setRange(r); onRangeChange?.(r); }}
              className={`px-4 py-1.5 rounded-lg text-sm capitalize ${range === r ? "bg-amber-500 text-white" : "text-stone-400"}`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-stone-900/50 border border-stone-800 rounded-2xl p-5">
          <p className="text-xs text-stone-400 uppercase">Total</p>
          <p className="text-3xl font-bold mt-1">
            {totalHrs.toFixed(1)}
            <span className="text-lg text-stone-400">h</span>
          </p>
        </div>
        <div className="bg-stone-900/50 border border-stone-800 rounded-2xl p-5">
          <p className="text-xs text-stone-400 uppercase">Daily Avg</p>
          <p className="text-3xl font-bold mt-1">
            {avgHrs}
            <span className="text-lg text-stone-400">h</span>
          </p>
        </div>
        <div className="bg-stone-900/50 border border-stone-800 rounded-2xl p-5">
          <p className="text-xs text-stone-400 uppercase">Peak Day</p>
          <p className="text-3xl font-bold mt-1">
            {maxDay.toFixed(1)}
            <span className="text-lg text-stone-400">h</span>
          </p>
        </div>
      </div>

      <div className="bg-stone-900/50 border border-stone-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Work Hours Over Time</h3>
          {gitEstimatedSessions && gitEstimatedSessions.length > 0 && (
            <div className="flex items-center gap-3 text-xs text-stone-400">
              <span className="flex items-center gap-1">
                <span className="w-3 h-0.5 bg-amber-500 rounded" /> Tracked
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-0.5 bg-violet-500 rounded border-dashed" /> Git Estimated
              </span>
            </div>
          )}
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={rangeData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#292524" />
            <XAxis dataKey="day" stroke="#78716c" fontSize={11} />
            <YAxis stroke="#78716c" fontSize={11} />
            <Tooltip
              contentStyle={{
                background: "#1c1917",
                border: "1px solid #44403c",
                borderRadius: 8,
              }}
            />
            <Line
              type="monotone"
              dataKey="hours"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ fill: "#f59e0b", r: 3 }}
              name="Tracked Hours"
            />
            {gitEstimatedSessions && gitEstimatedSessions.length > 0 && (
              <Line
                type="monotone"
                dataKey="gitHours"
                stroke="#8b5cf6"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: "#8b5cf6", r: 3 }}
                name="Git Estimated"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-stone-900/50 border border-stone-800 rounded-2xl p-6">
          <h3 className="font-semibold mb-4">Work by Tag</h3>
          {tagData.length === 0 ? (
            <p className="text-stone-500 text-center py-8">
              No tagged sessions yet
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={tagData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {tagData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#1c1917",
                    border: "1px solid #44403c",
                    borderRadius: 8,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-stone-900/50 border border-stone-800 rounded-2xl p-6">
          <h3 className="font-semibold mb-4">Peak Hours</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#292524" />
              <XAxis
                dataKey="hour"
                stroke="#78716c"
                fontSize={11}
                interval={3}
              />
              <YAxis stroke="#78716c" fontSize={11} />
              <Tooltip
                contentStyle={{
                  background: "#1c1917",
                  border: "1px solid #44403c",
                  borderRadius: 8,
                }}
              />
              <Bar dataKey="minutes" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ============ EXPORT VIEW ============
function ExportView({ data, gitAuthors, showToast, initialPeriod, initialFormat, onPrefsChange, updateUi, fetchFullData }) {
  const [period, setPeriod] = useState(initialPeriod || "week");
  const [format, setFormat] = useState(initialFormat || "xlsx");
  const [includeCheckpoints, setIncludeCheckpoints] = useState(data.ui?.exportIncludeCheckpoints ?? true);
  const [includeWorkLog, setIncludeWorkLog] = useState(data.ui?.exportIncludeWorkLog ?? true);
  const [, setExporting] = useState(false);
  const preview = useMemo(() => getExportPreview(data, period), [data, period]);

  const handleExport = async () => {
    setExporting(true);
    try {
      // For year/all-time exports, fetch full data from server to include trimmed history
      let exportSource = data;
      if ((period === "year" || period === "all") && fetchFullData) {
        const full = await fetchFullData();
        if (full) exportSource = full;
      }
      const exportData = {
        ...exportSource,
        commits: filterByAuthor(exportSource.commits || [], gitAuthors),
        includeCheckpoints,
        includeWorkLog,
      };
      if (format === "xlsx") {
        generateExcelReport(exportData, period);
      } else {
        generateCSVReport(exportData, period);
      }
      showToast(`${format === "xlsx" ? "Excel" : "CSV"} report exported!`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Export Report</h2>
        <p className="text-stone-400">
          Generate professional, enterprise-grade reports
        </p>
      </div>

      {/* Export Preview Card */}
      <div className="bg-gradient-to-br from-stone-900/80 to-stone-900/50 border border-stone-800 rounded-2xl p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Icon path={ICONS.clock} size={18} /> Export Preview
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-stone-800/60 rounded-xl p-3 text-center">
            <p className="text-xs text-stone-500 uppercase tracking-wide">Period</p>
            <p className="text-lg font-bold text-white mt-1">{period.charAt(0).toUpperCase() + period.slice(1)}</p>
            <p className="text-[10px] text-stone-500 mt-0.5">{preview.days} days</p>
          </div>
          <div className="bg-stone-800/60 rounded-xl p-3 text-center">
            <p className="text-xs text-stone-500 uppercase tracking-wide">Sessions</p>
            <p className="text-lg font-bold text-amber-400 mt-1">{preview.totalSessions}</p>
            <p className="text-[10px] text-stone-500 mt-0.5">{preview.totalHours}h tracked</p>
          </div>
          <div className="bg-stone-800/60 rounded-xl p-3 text-center">
            <p className="text-xs text-stone-500 uppercase tracking-wide">Commits</p>
            <p className="text-lg font-bold text-emerald-400 mt-1">{preview.totalCommits}</p>
            <p className="text-[10px] text-stone-500 mt-0.5">{preview.repoCount} repos</p>
          </div>
          <div className="bg-stone-800/60 rounded-xl p-3 text-center">
            <p className="text-xs text-stone-500 uppercase tracking-wide">Tags</p>
            <p className="text-lg font-bold text-blue-400 mt-1">{preview.tagCount}</p>
            <p className="text-[10px] text-stone-500 mt-0.5 truncate">{preview.tags.slice(0, 3).join(", ")}{preview.tagCount > 3 ? "…" : ""}</p>
          </div>
        </div>
        <p className="text-xs text-stone-500 mt-3 text-center">{preview.dateRange}</p>
      </div>

      <div className="bg-stone-900/50 border border-stone-800 rounded-2xl p-6">
        <h3 className="font-semibold mb-4">Report Configuration</h3>

        <div className="space-y-5">
          <div>
            <label className="text-xs text-stone-400 uppercase tracking-wide">
              Time Period
            </label>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {["day", "week", "month", "year"].map((p) => (
                <button
                  key={p}
                  onClick={() => { setPeriod(p); onPrefsChange?.({ period: p, format }); }}
                  className={`py-3 rounded-xl text-sm capitalize font-medium ${period === p ? "bg-amber-500 text-white" : "bg-stone-800 text-stone-400 hover:bg-stone-700"}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-stone-400 uppercase tracking-wide">
              Format
            </label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                onClick={() => { setFormat("xlsx"); onPrefsChange?.({ period, format: "xlsx" }); }}
                className={`py-3 rounded-xl text-sm font-medium ${format === "xlsx" ? "bg-emerald-500 text-white" : "bg-stone-800 text-stone-400"}`}
              >
                <span className="flex items-center justify-center gap-2">
                  <Icon path={ICONS.spreadsheet} size={16} /> Excel (.xlsx) — Recommended
                </span>
              </button>
              <button
                onClick={() => { setFormat("csv"); onPrefsChange?.({ period, format: "csv" }); }}
                className={`py-3 rounded-xl text-sm font-medium ${format === "csv" ? "bg-emerald-500 text-white" : "bg-stone-800 text-stone-400"}`}
              >
                <span className="flex items-center justify-center gap-2">
                  <Icon path={ICONS.fileText} size={16} /> CSV
                </span>
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs text-stone-400 uppercase tracking-wide">Checkpoint Notes</label>
            <div className="mt-2 space-y-2">
              <label className="flex items-start gap-3 p-3 bg-stone-800/60 rounded-xl cursor-pointer">
                <input type="checkbox" checked={includeCheckpoints} onChange={(e) => {
                  setIncludeCheckpoints(e.target.checked);
                  updateUi?.({ exportIncludeCheckpoints: e.target.checked });
                }} className="mt-0.5 accent-amber-500" />
                <div>
                  <p className="text-sm font-medium">In-session checkpoints</p>
                  <p className="text-xs text-stone-500">Adds a "Checkpoints" column to Raw Data and Timesheet sheets. Private notes excluded automatically.</p>
                </div>
              </label>
              <label className="flex items-start gap-3 p-3 bg-stone-800/60 rounded-xl cursor-pointer">
                <input type="checkbox" checked={includeWorkLog} onChange={(e) => {
                  setIncludeWorkLog(e.target.checked);
                  updateUi?.({ exportIncludeWorkLog: e.target.checked });
                }} className="mt-0.5 accent-amber-500" />
                <div>
                  <p className="text-sm font-medium">Standalone work log notes</p>
                  <p className="text-xs text-stone-500">Adds a "Work Log" sheet with all standalone entries. Private notes excluded automatically.</p>
                </div>
              </label>
            </div>
          </div>

          <button
            onClick={handleExport}
            disabled={preview.totalSessions === 0 && preview.totalCommits === 0}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 disabled:from-stone-700 disabled:to-stone-700 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30 disabled:shadow-none transition-all"
          >
            <Icon path={ICONS.download} size={20} /> Generate & Download {format === "xlsx" ? "Excel" : "CSV"} Report
          </button>
        </div>
      </div>

      <div className="bg-stone-900/50 border border-stone-800 rounded-2xl p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Icon path={ICONS.clipboard} size={18} /> {format === "xlsx" ? "6 Professional Sheets" : "What's Included"}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(format === "xlsx" ? [
            {
              title: "Dashboard",
              desc: "Executive summary — key metrics, tag distribution, visual KPIs",
              accent: "text-amber-300",
            },
            {
              title: "Timesheet",
              desc: "Enterprise timesheet grid with clock in/out, overtime flags, daily subtotals",
              accent: "text-emerald-300",
            },
            {
              title: "Daily Summary",
              desc: "Day-by-day breakdown with goal tracking, variance, and status indicators",
              accent: "text-blue-300",
            },
            {
              title: "Tag Analysis",
              desc: "Project/tag breakdown with hours, sessions, avg duration, % of total",
              accent: "text-purple-300",
            },
            {
              title: "Git Activity",
              desc: "All commits with SHA, repo, branch, lines changed, author details",
              accent: "text-orange-300",
            },
            {
              title: "Raw Data",
              desc: "Unformatted session & commit data for data portability and re-import",
              accent: "text-stone-300",
            },
          ] : [
            {
              title: "Metadata Header",
              desc: "Period, total hours, session count, generation timestamp",
              accent: "text-amber-300",
            },
            {
              title: "Enhanced Sessions",
              desc: "All sessions with computed fields: day name, goal status, variance",
              accent: "text-emerald-300",
            },
            {
              title: "Git Commits",
              desc: "All commits with full metadata as comment-prefixed section",
              accent: "text-blue-300",
            },
          ]).map((s) => (
            <div key={s.title} className="p-4 bg-stone-800/50 rounded-xl">
              <p className={`font-medium ${s.accent}`}>{s.title}</p>
              <p className="text-xs text-stone-400 mt-1">{s.desc}</p>
            </div>
          ))}
        </div>
        {format === "xlsx" && (
          <p className="text-xs text-stone-500 mt-4 text-center">
            Professional styling with color-coded headers, alternating rows, freeze panes, auto-filters, and duration formatting
          </p>
        )}
      </div>
    </div>
  );
}

// ============ WORK LOG VIEW ============
function WorkLogView({
  data,
  activeSession,
  addCheckpoint,
  updateCheckpoint,
  deleteCheckpoint,
  addWorkLogEntry,
  updateWorkLogEntry,
  deleteWorkLogEntry,
  showToast,
}) {
  const [search, setSearch] = useState("");
  const [addText, setAddText] = useState("");
  const [addTsInput, setAddTsInput] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedSessions, setExpandedSessions] = useState(() => {
    const latest = (Array.isArray(data.sessions) ? data.sessions : [])
      .filter((s) => (s.checkpoints || []).length > 0)
      .sort((a, b) => b.start - a.start)[0];
    return latest ? new Set([latest.id]) : new Set();
  });
  const [editingEntry, setEditingEntry] = useState(null);

  // Merge session checkpoints and standalone work log entries into unified timeline
  const timeline = useMemo(() => {
    const entries = [];
    data.sessions.forEach((s) => {
      (s.checkpoints || []).forEach((cp) => {
        entries.push({
          ...cp,
          source: "session",
          sessionId: s.id,
          sessionTitle: s.notes || "Untitled session",
          sessionStart: s.start,
          sessionEnd: s.end,
          sessionType: s.type,
          sessionDuration: s.duration,
        });
      });
    });
    (data.workLog || []).forEach((wl) => {
      entries.push({ ...wl, source: "standalone" });
    });
    entries.sort((a, b) => b.ts - a.ts);
    return entries;
  }, [data.sessions, data.workLog]);

  // Group entries by day
  const grouped = useMemo(() => {
    const groups = {};
    timeline.forEach((entry) => {
      const key = formatDate(entry.ts);
      (groups[key] = groups[key] || []).push(entry);
    });
    return groups;
  }, [timeline]);

  // Search filtering
  const filtered = useMemo(() => {
    if (!search.trim()) return grouped;
    const q = search.toLowerCase();
    const result = {};
    Object.entries(grouped).forEach(([date, entries]) => {
      const matching = entries.filter(
        (e) =>
          e.text.toLowerCase().includes(q) ||
          (e.sessionTitle || "").toLowerCase().includes(q)
      );
      if (matching.length > 0) result[date] = matching;
    });
    return result;
  }, [grouped, search]);

  // --- Add Note handler ---
  const handleAddNote = () => {
    const text = addText.trim();
    if (!text) return;
    const ts = addTsInput ? parseTimeInput(addTsInput) : Date.now();
    if (addTsInput && !ts) {
      showToast("Invalid time format — use h:mm AM/PM", "error");
      return;
    }
    if (activeSession) {
      addCheckpoint(activeSession.id, text, ts || Date.now());
    } else {
      addWorkLogEntry(text, ts || Date.now());
    }
    setAddText("");
    setAddTsInput("");
    setShowAddForm(false);
  };

  // --- Edit handlers ---
  const handleStartEdit = (entry) => {
    setEditingEntry({
      id: entry.id,
      type: entry.source === "standalone" ? "worklog" : "checkpoint",
      text: entry.text,
      tsInput: formatTimeForInput(entry.ts),
      sessionId: entry.sessionId,
    });
  };

  const handleSaveEdit = () => {
    if (!editingEntry) return;
    const parsed = editingEntry.tsInput
      ? parseTimeInput(editingEntry.tsInput)
      : null;
    if (editingEntry.tsInput && parsed === null) {
      showToast("Invalid time format — use h:mm AM/PM", "error");
      return;
    }
    const updates = { text: editingEntry.text.trim() };
    if (parsed) updates.ts = parsed;
    if (editingEntry.type === "checkpoint") {
      updateCheckpoint(editingEntry.sessionId, editingEntry.id, updates);
    } else {
      updateWorkLogEntry(editingEntry.id, updates);
    }
    setEditingEntry(null);
  };

  const handleCancelEdit = () => {
    setEditingEntry(null);
  };

  // --- Delete handlers ---
  const handleDelete = (entry) => {
    if (!confirm("Delete this note?")) return;
    if (entry.source === "standalone") {
      deleteWorkLogEntry(entry.id);
    } else {
      deleteCheckpoint(entry.sessionId, entry.id);
    }
    if (editingEntry && editingEntry.id === entry.id) setEditingEntry(null);
  };

  // --- Privacy toggle ---
  const handleTogglePrivate = (entry) => {
    if (entry.source === "standalone") {
      updateWorkLogEntry(entry.id, { private: !entry.private });
    } else {
      updateCheckpoint(entry.sessionId, entry.id, { private: !entry.private });
    }
  };

  // --- Session expansion toggle ---
  const toggleSession = (sessionId) => {
    setExpandedSessions((prev) => {
      const next = new Set(prev);
      if (next.has(sessionId)) next.delete(sessionId);
      else next.add(sessionId);
      return next;
    });
  };

  const isEmpty = timeline.length === 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold">Work Log</h2>
          <p className="text-stone-400 text-sm">
            Unified timeline of session checkpoints and standalone notes
          </p>
        </div>
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes..."
            className="pl-9 pr-3 py-1.5 bg-stone-900/80 border border-stone-700/50 rounded-lg text-sm text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-amber-500/50 w-56"
          />
        </div>
      </div>

      {/* Add Note button + form */}
      <div>
        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 text-sm font-medium hover:bg-amber-500/30 flex items-center gap-1.5"
          >
            <Icon path={ICONS.plus} size={14} /> Add Note
          </button>
        ) : (
          <div className="bg-stone-800/60 border border-stone-700/50 rounded-xl p-3 space-y-2">
            <input
              type="text"
              value={addText}
              onChange={(e) => setAddText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && addText.trim()) handleAddNote();
              }}
              placeholder="Note text..."
              maxLength={280}
              className="w-full px-3 py-1.5 bg-stone-900/80 border border-stone-700/50 rounded-lg text-sm text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-amber-500/50"
            />
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={addTsInput}
                onChange={(e) => setAddTsInput(e.target.value)}
                placeholder="h:mm AM/PM (optional, defaults to now)"
                className="w-56 px-3 py-1.5 bg-stone-900/80 border border-stone-700/50 rounded-lg text-xs text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-amber-500/50"
              />
              {activeSession && (
                <span className="text-xs text-stone-500 italic">
                  Will be added to active session
                </span>
              )}
              <div className="flex-1" />
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setAddText("");
                  setAddTsInput("");
                }}
                className="px-2.5 py-1 text-xs rounded bg-stone-700/50 text-stone-400 hover:bg-stone-700"
              >
                Cancel
              </button>
              <button
                onClick={handleAddNote}
                disabled={!addText.trim()}
                className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 text-sm font-medium hover:bg-amber-500/30 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <Icon path={ICONS.plus} size={14} /> Add
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Timeline */}
      {isEmpty ? (
        <div className="text-center py-12">
          <p className="text-stone-500">No entries yet. Add a note or start tracking.</p>
        </div>
      ) : Object.keys(filtered).length === 0 ? (
        <div className="text-center py-12">
          <p className="text-stone-500">No results matching &quot;{search}&quot;</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(filtered).map(([date, entries]) => {
            // Track which sessions we've rendered cards for in this day group
            const renderedSessions = new Set();

            return (
              <div key={date}>
                {/* Day header */}
                <div className="flex items-center gap-2 mb-3">
                  <Icon path={ICONS.calendar} size={16} className="text-amber-400" />
                  <span className="text-stone-300 text-sm font-medium">{date}</span>
                </div>

                <div className="space-y-2 ml-1">
                  {entries.map((entry) => {
                    // Session checkpoint
                    if (entry.source === "session") {
                      const isFirstOccurrence = !renderedSessions.has(entry.sessionId);
                      if (isFirstOccurrence) renderedSessions.add(entry.sessionId);

                      const isExpanded = expandedSessions.has(entry.sessionId);
                      const sessionCheckpoints = entries.filter(
                        (e) => e.source === "session" && e.sessionId === entry.sessionId
                      );
                      const cpCount = sessionCheckpoints.length;

                      return (
                        <div key={entry.id} className={isFirstOccurrence ? "" : "ml-6"}>
                          {isFirstOccurrence && (
                            <div className="bg-stone-800/60 border border-stone-700/50 rounded-xl p-3 space-y-2">
                              {/* Session card header */}
                              <div className="flex items-center gap-2">
                                <Icon path={ICONS.clock} size={14} className="text-amber-400 shrink-0" />
                                <span className="text-stone-200 font-medium text-sm truncate flex-1">
                                  {entry.sessionTitle}
                                </span>
                                {entry.sessionStart && (
                                  <span className="text-stone-400 text-xs shrink-0">
                                    {formatTime(entry.sessionStart)}
                                    {entry.sessionEnd ? ` – ${formatTime(entry.sessionEnd)}` : ""}
                                  </span>
                                )}
                                {entry.sessionDuration > 0 && (
                                  <span className="text-xs bg-stone-700/60 text-stone-300 px-1.5 py-0.5 rounded shrink-0">
                                    {formatDuration(entry.sessionDuration)}
                                  </span>
                                )}
                                <span className="text-xs bg-amber-500/15 text-amber-400 px-1.5 py-0.5 rounded shrink-0">
                                  {cpCount} {cpCount === 1 ? "note" : "notes"}
                                </span>
                                <button
                                  onClick={() => toggleSession(entry.sessionId)}
                                  className="p-0.5 rounded hover:bg-stone-700/50 text-stone-400 hover:text-stone-200 shrink-0"
                                >
                                  <Icon
                                    path={isExpanded ? ICONS.chevronDown : ICONS.chevronRight}
                                    size={14}
                                  />
                                </button>
                              </div>

                              {/* Expanded checkpoints */}
                              {isExpanded && (
                                <div className="space-y-1 pl-2">
                                  {sessionCheckpoints.map((cp) => (
                                    <div key={cp.id} className="group flex items-start gap-2 py-1">
                                      <Icon path={ICONS.flag} size={12} className="text-amber-400 mt-1 shrink-0" />
                                      {editingEntry && editingEntry.id === cp.id ? (
                                        <div className="flex-1 space-y-1.5">
                                          <input
                                            type="text"
                                            value={editingEntry.text}
                                            onChange={(e) =>
                                              setEditingEntry((prev) => ({ ...prev, text: e.target.value }))
                                            }
                                            className="w-full px-2 py-1 bg-stone-900/80 border border-stone-700/50 rounded text-xs text-stone-200 focus:outline-none focus:border-amber-500/50"
                                          />
                                          <div className="flex items-center gap-1.5">
                                            <input
                                              type="text"
                                              value={editingEntry.tsInput}
                                              onChange={(e) =>
                                                setEditingEntry((prev) => ({ ...prev, tsInput: e.target.value }))
                                              }
                                              placeholder="h:mm AM/PM"
                                              className="w-24 px-2 py-1 bg-stone-900/80 border border-stone-700/50 rounded text-xs text-stone-200 focus:outline-none focus:border-amber-500/50"
                                            />
                                            <button
                                              onClick={handleSaveEdit}
                                              className="px-2 py-1 text-xs rounded bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                                            >
                                                              Save
                                            </button>
                                            <button
                                              onClick={handleCancelEdit}
                                              className="px-2 py-1 text-xs rounded bg-stone-700/50 text-stone-400 hover:bg-stone-700"
                                            >
                                              Cancel
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        <>
                                          <div className="flex-1 min-w-0">
                                            <span className="text-xs text-stone-400">{formatTime(cp.ts)}</span>
                                            <p className="text-sm text-stone-200 break-words">{cp.text}</p>
                                          </div>
                                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                            <button
                                              onClick={() => handleTogglePrivate(cp)}
                                              className="p-0.5 rounded hover:bg-stone-700/50"
                                              title={cp.private ? "Make visible" : "Make private"}
                                            >
                                              <Icon
                                                path={cp.private ? ICONS.eyeOff : ICONS.eye}
                                                size={12}
                                                className={cp.private ? "text-stone-500" : "text-amber-400"}
                                              />
                                            </button>
                                            <button
                                              onClick={() => handleStartEdit(cp)}
                                              className="p-0.5 rounded hover:bg-stone-700/50 text-stone-500 hover:text-stone-300"
                                              title="Edit"
                                            >
                                              <Icon path={ICONS.edit} size={12} />
                                            </button>
                                            <button
                                              onClick={() => handleDelete(cp)}
                                              className="p-0.5 rounded hover:bg-stone-700/50 text-stone-500 hover:text-rose-400"
                                              title="Delete"
                                            >
                                              <Icon path={ICONS.trash} size={12} />
                                            </button>
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    }

                    // Standalone entry
                    return (
                      <div key={entry.id} className="group flex items-start gap-2 py-1 opacity-55 hover:opacity-80 transition-opacity">
                        <Icon path={ICONS.fileText} size={14} className="text-stone-500 mt-0.5 shrink-0" />
                        {editingEntry && editingEntry.id === entry.id ? (
                          <div className="flex-1 space-y-1.5">
                            <input
                              type="text"
                              value={editingEntry.text}
                              onChange={(e) =>
                                setEditingEntry((prev) => ({ ...prev, text: e.target.value }))
                              }
                              className="w-full px-2 py-1 bg-stone-900/80 border border-stone-700/50 rounded text-xs text-stone-200 focus:outline-none focus:border-amber-500/50"
                            />
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                value={editingEntry.tsInput}
                                onChange={(e) =>
                                  setEditingEntry((prev) => ({ ...prev, tsInput: e.target.value }))
                                }
                                placeholder="h:mm AM/PM"
                                className="w-24 px-2 py-1 bg-stone-900/80 border border-stone-700/50 rounded text-xs text-stone-200 focus:outline-none focus:border-amber-500/50"
                              />
                              <button
                                onClick={handleSaveEdit}
                                className="px-2 py-1 text-xs rounded bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                              >
                                Save
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="px-2 py-1 text-xs rounded bg-stone-700/50 text-stone-400 hover:bg-stone-700"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex-1 min-w-0">
                              <span className="text-xs text-stone-400">{formatTime(entry.ts)}</span>
                              <p className="text-sm text-stone-300 italic break-words">{entry.text}</p>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                              <button
                                onClick={() => handleTogglePrivate(entry)}
                                className="p-0.5 rounded hover:bg-stone-700/50"
                                title={entry.private ? "Make visible" : "Make private"}
                              >
                                <Icon
                                  path={entry.private ? ICONS.eyeOff : ICONS.eye}
                                  size={12}
                                  className={entry.private ? "text-stone-500" : "text-amber-400"}
                                />
                              </button>
                              <button
                                onClick={() => handleStartEdit(entry)}
                                className="p-0.5 rounded hover:bg-stone-700/50 text-stone-500 hover:text-stone-300"
                                title="Edit"
                              >
                                <Icon path={ICONS.edit} size={12} />
                              </button>
                              <button
                                onClick={() => handleDelete(entry)}
                                className="p-0.5 rounded hover:bg-stone-700/50 text-stone-500 hover:text-rose-400"
                                title="Delete"
                              >
                                <Icon path={ICONS.trash} size={12} />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============ SETTINGS MODAL ============
function SettingsModal({ open, onClose, data, updateSettings, showToast, onReset, onOpenSync }) {
  const [form, setForm] = useState(data.settings);
  const [newIdentityName, setNewIdentityName] = useState("");
  const [newIdentityEmail, setNewIdentityEmail] = useState("");

  // Sync form when modal opens and handle Escape key
  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const gitAuthors = form.gitAuthors || { identities: [], autoDetected: null };
  const identities = gitAuthors.identities || [];

  const addIdentity = () => {
    const name = newIdentityName.trim();
    const email = newIdentityEmail.trim();
    if (!name && !email) return;
    const exists = identities.some(
      (id) => id.email?.toLowerCase() === email.toLowerCase() && email,
    );
    if (exists) return;
    setForm({
      ...form,
      gitAuthors: {
        ...gitAuthors,
        identities: [...identities, { name, email }],
      },
    });
    setNewIdentityName("");
    setNewIdentityEmail("");
  };

  const removeIdentity = (index) => {
    setForm({
      ...form,
      gitAuthors: {
        ...gitAuthors,
        identities: identities.filter((_, i) => i !== index),
      },
    });
  };

  const autoDetectIdentities = async () => {
    const repos = data.settings.trackedRepos || [];
    if (repos.length === 0) {
      showToast("No tracked repos to detect from", "error");
      return;
    }
    const detected = [...identities];
    for (const repo of repos) {
      try {
        const res = await fetch("/api/git/user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path: repo.path }),
        });
        if (!res.ok) continue;
        const user = await res.json();
        if (!user.name && !user.email) continue;
        const alreadyKnown = detected.some(
          (id) => id.email?.toLowerCase() === user.email?.toLowerCase(),
        );
        if (!alreadyKnown) {
          detected.push({ name: user.name, email: user.email });
        }
      } catch { /* skip unavailable repos */ }
    }
    setForm({
      ...form,
      gitAuthors: { ...gitAuthors, identities: detected, autoDetected: detected[detected.length - 1] || null },
    });
    const newCount = detected.length - identities.length;
    if (newCount > 0) {
      showToast(`Detected ${newCount} new identit${newCount !== 1 ? "ies" : "y"}`);
    } else {
      showToast("All identities already known");
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        className="bg-stone-900 border border-stone-800 rounded-2xl p-6 w-full max-w-md max-h-[85vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold">Settings</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-white" aria-label="Close settings">
            ✕
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-stone-400">
              Daily Work Goal (hours)
            </label>
            <input
              type="number"
              value={form.dailyGoal || 8}
              onChange={(e) => setForm({ ...form, dailyGoal: +e.target.value })}
              className="w-full mt-1 px-4 py-2 bg-stone-800 border border-stone-700 rounded-lg text-sm"
            />
          </div>

          {/* Author Identity Management */}
          <div className="border-t border-stone-800 pt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-stone-400 uppercase tracking-wide">
                My Git Identities
              </label>
              <button
                onClick={autoDetectIdentities}
                className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
              >
                Auto-detect
              </button>
            </div>
            <p className="text-[11px] text-stone-500 mb-3">
              Commits from these authors are shown across all views — Git Tracking, Analytics, Dashboard &amp; Exports.
              Add your different work emails here.
            </p>

            {/* Identity chips */}
            {identities.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {identities.map((id, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-violet-500/15 text-violet-300 rounded-lg text-xs"
                  >
                    {id.name && id.email
                      ? `${id.name} <${id.email}>`
                      : id.name || id.email}
                    <button
                      onClick={() => removeIdentity(i)}
                      className="text-violet-400 hover:text-violet-200 transition-colors"
                      aria-label={`Remove ${id.name || id.email}`}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Add identity inputs */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Name"
                  value={newIdentityName}
                  onChange={(e) => setNewIdentityName(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-stone-800 border border-stone-700 rounded-lg text-sm"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={newIdentityEmail}
                  onChange={(e) => setNewIdentityEmail(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-stone-800 border border-stone-700 rounded-lg text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addIdentity();
                  }}
                />
              </div>
              <button
                onClick={addIdentity}
                disabled={!newIdentityName.trim() && !newIdentityEmail.trim()}
                className="w-full py-2 rounded-lg bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Add Identity
              </button>
            </div>
          </div>

          {/* Data Sync */}
          <div className="border-t border-stone-800 pt-4">
            <label className="text-xs text-stone-400 uppercase tracking-wide">
              Data Sync
            </label>
            <p className="text-[11px] text-stone-500 mb-3">
              Compare and sync your browser data with the server backup.
            </p>
            <button
              onClick={() => { onClose(); onOpenSync?.(); }}
              className="w-full py-2 rounded-lg bg-stone-800 border border-stone-700 text-sm
                         hover:bg-stone-700 transition-colors flex items-center justify-center gap-2"
            >
              <Icon path={ICONS.refresh} size={16} />
              Sync Data
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                updateSettings(form);
                onClose();
              }}
              className="flex-1 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 font-medium"
            >
              Save
            </button>
            <button
              onClick={() => {
                if (confirm("Clear all data? This cannot be undone.")) {
                  onReset();
                  onClose();
                }
              }}
              className="px-4 py-2.5 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30"
            >
              Reset
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ============ TOAST ============
function Toast({ toast }) {
  return (
    <div aria-live="polite" role="status">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50 px-5 py-3 bg-stone-800 border border-stone-700 rounded-xl shadow-2xl flex items-center gap-2"
          >
            <Icon
              path={toast.type === "error" ? ICONS.alert : ICONS.check}
              size={18}
              className={
                toast.type === "error" ? "text-rose-400" : "text-emerald-400"
              }
            />
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============ SYNC VIEW ============
function SyncView({ open, onClose, localData, applySyncResult, showToast }) {
  // Flow state machine
  const [phase, setPhase] = useState("loading"); // loading | error | no-server | no-local | identical | summary | strategy | conflicts | dryrun | executing | done
  const [serverData, setServerData] = useState(null);
  const [diffResult, setDiffResult] = useState(null);
  const [strategy, setStrategy] = useState(null);
  const [resolutions, setResolutions] = useState({});
  const [preview, setPreview] = useState(null);
  const [versions, setVersions] = useState([]);
  const [expandedSections, setExpandedSections] = useState({});
  const [showVersions, setShowVersions] = useState(false);
  const [previewVersion, setPreviewVersion] = useState(null);

  // Escape key handler
  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  // Kick off diff computation when modal opens
  useEffect(() => {
    if (!open) return;
    setPhase("loading");
    setStrategy(null);
    setResolutions({});
    setPreview(null);
    setShowVersions(false);
    setPreviewVersion(null);

    (async () => {
      try {
        const res = await fetch("/api/data");
        if (!res.ok) throw new Error("Server error");
        const result = await res.json();

        let srvData = null;
        if (result.exists && result.data) {
          if (validateDataShape(result.data)) {
            srvData = migrate(result.data);
          }
        }

        setServerData(srvData);

        // Edge case: no server data
        if (!srvData) {
          const localEmpty = !localData?.sessions?.length && !localData?.commits?.length;
          if (localEmpty) {
            setPhase("no-data");
          } else {
            setPhase("no-server");
          }
          return;
        }

        // Edge case: no local data (just defaults)
        const localEmpty = !localData?.sessions?.length && !localData?.commits?.length;
        if (localEmpty) {
          setPhase("no-local");
          return;
        }

        const diff = computeDiff(localData, srvData);
        setDiffResult(diff);

        // Edge case: both identical
        if (diff.summary.localOnlyCount === 0 && diff.summary.serverOnlyCount === 0 && diff.summary.conflictCount === 0) {
          setPhase("identical");
          return;
        }

        setPhase("summary");
      } catch {
        setPhase("error");
      }

      // Also load versions
      try {
        const vRes = await fetch("/api/data/versions");
        if (vRes.ok) {
          const vData = await vRes.json();
          setVersions(vData.versions || []);
        }
      } catch { /* non-critical */ }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Helper: toggle expandable section
  const toggleSection = (key) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Helper: set resolution for a conflict item
  const setResolution = (section, id, side) => {
    setResolutions((prev) => ({
      ...prev,
      [section]: { ...(prev[section] || {}), [id]: side },
    }));
  };

  // Bulk resolve all conflicts for a section
  const resolveAll = (section, side) => {
    if (!diffResult) return;
    const items = diffResult[section]?.conflicts || [];
    const updates = {};
    for (const item of items) {
      updates[item.id] = side;
    }
    setResolutions((prev) => ({ ...prev, [section]: updates }));
  };

  // Go to strategy select
  const selectStrategy = (s) => {
    setStrategy(s);
    if (s === "merge" && diffResult) {
      // Check if there are actual conflicts
      const hasConflicts =
        diffResult.sessions.conflicts.length > 0 ||
        diffResult.commits.conflicts.length > 0 ||
        diffResult.settings.conflicts.length > 0 ||
        diffResult.ui.conflicts.length > 0;
      if (hasConflicts) {
        // Auto-resolve everything to "local" as default
        const sessionAutoRes = {};
        const commitAutoRes = {};
        for (const c of diffResult.sessions.conflicts) sessionAutoRes[c.id] = "local";
        for (const c of diffResult.commits.conflicts) commitAutoRes[c.id] = "local";
        setResolutions({ sessions: sessionAutoRes, commits: commitAutoRes, settings: {}, ui: {} });
        setPhase("conflicts");
        return;
      }
    }
    // No conflicts or non-merge: go straight to dry run
    goToDryRun(s);
  };

  const goToDryRun = (s) => {
    const p = previewSync(s || strategy, localData, serverData, diffResult, s === "merge" || strategy === "merge" ? resolutions : {});
    setPreview(p);
    setPhase("dryrun");
  };

  // Execute the sync
  const executeSync = async () => {
    setPhase("executing");
    try {
      let resultData;
      if (strategy === "push") {
        resultData = applyPush(localData);
      } else if (strategy === "pull") {
        resultData = applyPull(serverData);
      } else {
        resultData = applyMerge(localData, serverData, diffResult, resolutions);
      }

      // Version backup — only if there's disk data to back up
      if (serverData) {
        try {
          await fetch("/api/data/versions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ label: `pre-sync-${strategy}` }),
          });
        } catch { /* non-critical — backup is best effort */ }
      }

      // Explicitly persist to disk (don't rely on debounced save)
      try {
        await fetch("/api/data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: resultData }),
        });
      } catch { /* localStorage save via applySyncResult still fires */ }

      applySyncResult(resultData);
      setPhase("done");

      // Refresh versions list
      try {
        const vRes = await fetch("/api/data/versions");
        if (vRes.ok) {
          const vData = await vRes.json();
          setVersions(vData.versions || []);
        }
      } catch { /* non-critical */ }
    } catch {
      showToast("Sync failed — your data was not changed", "error");
      setPhase("dryrun");
    }
  };

  // Execute push-only for no-server case
  const executePushOnly = async () => {
    setPhase("executing");
    setStrategy("push");
    try {
      // No version backup needed — there's no disk data to back up

      // Explicitly persist to disk (don't rely on debounced save)
      await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: localData }),
      });

      setPreview({
        strategy: "push",
        description: ["Local data pushed to server."],
        resultSummary: {
          sessionsCount: localData?.sessions?.length || 0,
          commitsCount: localData?.commits?.length || 0,
        },
      });
      applySyncResult(localData);
      setPhase("done");
    } catch {
      showToast("Push failed", "error");
      setPhase("no-server");
    }
  };

  // Execute pull-only for no-local case
  const executePullOnly = async () => {
    setPhase("executing");
    setStrategy("pull");
    try {
      // Version backup — only if there's disk data to back up
      if (serverData) {
        try {
          await fetch("/api/data/versions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ label: "pre-sync-pull" }),
          });
        } catch { /* non-critical */ }
      }

      setPreview({
        strategy: "pull",
        description: ["Server data pulled to browser."],
        resultSummary: {
          sessionsCount: serverData?.sessions?.length || 0,
          commitsCount: serverData?.commits?.length || 0,
        },
      });
      applySyncResult(serverData);
      setPhase("done");
    } catch {
      showToast("Pull failed", "error");
      setPhase("no-local");
    }
  };

  // Restore a version
  const restoreVersion = async (vId) => {
    if (!confirm("Restore this version? Your current data will be backed up first.")) return;
    try {
      const res = await fetch(`/api/data/versions/${vId}/restore`, { method: "POST" });
      if (!res.ok) throw new Error();
      // Reload the restored data
      const dataRes = await fetch("/api/data");
      if (dataRes.ok) {
        const dataResult = await dataRes.json();
        if (dataResult.exists && dataResult.data) {
          if (!validateDataShape(dataResult.data)) {
            showToast("Version data is corrupted — restore aborted", "error");
            return;
          }
          const restored = sanitizeData(migrate(dataResult.data));
          if (!restored) {
            showToast("Version data could not be sanitized — restore aborted", "error");
            return;
          }
          applySyncResult(restored);
        }
      }
      showToast("Version restored");
      // Refresh versions
      const vRes = await fetch("/api/data/versions");
      if (vRes.ok) {
        const vData = await vRes.json();
        setVersions(vData.versions || []);
      }
      onClose();
    } catch {
      showToast("Restore failed", "error");
    }
  };

  // Preview a version (diff vs current)
  const openVersionPreview = async (vId) => {
    try {
      const res = await fetch(`/api/data/versions/${vId}`);
      if (!res.ok) return;
      const result = await res.json();
      if (result.exists && result.data) {
        if (!validateDataShape(result.data)) {
          showToast("Version snapshot is corrupted", "error");
          return;
        }
        const versionData = sanitizeData(migrate(result.data));
        if (!versionData) return;
        const diff = computeDiff(localData, versionData);
        setPreviewVersion({ id: vId, data: versionData, diff });
      }
    } catch { /* ignore */ }
  };

  // Delete a version
  const deleteVersion = async (vId) => {
    try {
      await fetch(`/api/data/versions/${vId}`, { method: "DELETE" });
      setVersions((prev) => prev.filter((v) => v.id !== vId));
      if (previewVersion?.id === vId) setPreviewVersion(null);
    } catch { /* ignore */ }
  };

  if (!open) return null;

  // ─── Shared header ───
  const renderHeader = (title, hideClose = false) => (
    <div className="flex items-center justify-between mb-5">
      <h3 className="text-lg font-bold">{title}</h3>
      {!hideClose && (
        <button onClick={onClose} className="text-stone-400 hover:text-white transition-colors" aria-label="Close sync">
          ✕
        </button>
      )}
    </div>
  );

  // ─── Badge helper ───
  const Badge = ({ color, children }) => (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
      color === "green" ? "bg-emerald-500/20 text-emerald-400" :
      color === "blue" ? "bg-blue-500/20 text-blue-400" :
      color === "amber" ? "bg-amber-500/20 text-amber-400" :
      "bg-stone-700 text-stone-400"
    }`}>
      {children}
    </span>
  );

  // ─── Format session brief ───
  const sessionBrief = (s) => {
    const dur = s.duration ? formatDuration(s.duration) : "active";
    const date = s.start ? formatDate(s.start) : "";
    return `${date} · ${s.type || "work"} · ${dur}`;
  };

  // ─── Format commit brief ───
  const commitBrief = (c) => {
    const sha = c.sha ? c.sha.slice(0, 7) : "manual";
    const msg = c.message ? (c.message.length > 40 ? c.message.slice(0, 40) + "…" : c.message) : "no message";
    return `${sha} ${msg} (${c.repo || "unknown"})`;
  };

  // ─── RENDER: Loading ───
  if (phase === "loading") {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          onClick={(e) => e.stopPropagation()} className="bg-stone-900 border border-stone-800 rounded-2xl p-6 w-full max-w-2xl">
          {renderHeader("Data Sync")}
          <div className="flex items-center justify-center py-12 gap-3 text-stone-400">
            <Icon path={ICONS.refresh} size={20} className="animate-spin" />
            <span>Loading data from server…</span>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── RENDER: Error ───
  if (phase === "error") {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          onClick={(e) => e.stopPropagation()} className="bg-stone-900 border border-stone-800 rounded-2xl p-6 w-full max-w-2xl">
          {renderHeader("Data Sync")}
          <div className="text-center py-12">
            <p className="text-rose-400 mb-4">Cannot reach the sync server.</p>
            <p className="text-stone-500 text-sm mb-6">Make sure the git server is running on port 9001.</p>
            <button onClick={onClose} className="px-6 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-sm transition-colors">
              Close
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── RENDER: No data on either side ───
  if (phase === "no-data") {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          onClick={(e) => e.stopPropagation()} className="bg-stone-900 border border-stone-800 rounded-2xl p-6 w-full max-w-2xl">
          {renderHeader("Data Sync")}
          <div className="text-center py-12">
            <div className="text-stone-400 text-4xl mb-3">📭</div>
            <p className="text-stone-300 mb-2">No data to sync.</p>
            <p className="text-stone-500 text-sm mb-6">Neither your browser nor the server has any tracked data yet. Start tracking sessions or commits first.</p>
            <button onClick={onClose} className="px-6 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-sm transition-colors">
              Close
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── RENDER: No server data ───
  if (phase === "no-server") {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          onClick={(e) => e.stopPropagation()} className="bg-stone-900 border border-stone-800 rounded-2xl p-6 w-full max-w-2xl">
          {renderHeader("Data Sync")}
          <div className="text-center py-8">
            <p className="text-stone-300 mb-2">No server data found.</p>
            <p className="text-stone-500 text-sm mb-6">You can push your local data to create a server backup.</p>
            <p className="text-stone-400 text-sm mb-6">
              Local: {localData?.sessions?.length || 0} sessions, {localData?.commits?.length || 0} commits
            </p>
            <button onClick={executePushOnly}
              className="px-6 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 font-medium text-sm transition-colors">
              Push Local → Server
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── RENDER: No local data ───
  if (phase === "no-local") {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          onClick={(e) => e.stopPropagation()} className="bg-stone-900 border border-stone-800 rounded-2xl p-6 w-full max-w-2xl">
          {renderHeader("Data Sync")}
          <div className="text-center py-8">
            <p className="text-stone-300 mb-2">No local data found.</p>
            <p className="text-stone-500 text-sm mb-6">You can pull data from the server.</p>
            <p className="text-stone-400 text-sm mb-6">
              Server: {serverData?.sessions?.length || 0} sessions, {serverData?.commits?.length || 0} commits
            </p>
            <button onClick={executePullOnly}
              className="px-6 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 font-medium text-sm transition-colors">
              Pull Server → Local
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── RENDER: Identical ───
  if (phase === "identical") {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          onClick={(e) => e.stopPropagation()} className="bg-stone-900 border border-stone-800 rounded-2xl p-6 w-full max-w-2xl">
          {renderHeader("Data Sync")}
          <div className="text-center py-8">
            <div className="text-emerald-400 text-4xl mb-3">✓</div>
            <p className="text-stone-300 mb-2">Everything is in sync!</p>
            <p className="text-stone-500 text-sm mb-6">Local and server data are identical.</p>
            {versions.length > 0 && (
              <button onClick={() => setShowVersions(true)}
                className="px-6 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-sm transition-colors mb-4">
                View Version History ({versions.length})
              </button>
            )}
            {showVersions && renderVersionHistory()}
            <div><button onClick={onClose} className="px-6 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-sm transition-colors">Close</button></div>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── RENDER: Version History ───
  const renderVersionHistory = () => (
    <div className="mt-4 text-left border-t border-stone-800 pt-4 max-h-60 overflow-y-auto">
      <h4 className="text-sm font-medium text-stone-300 mb-3">Version History</h4>
      {versions.length === 0 ? (
        <p className="text-stone-500 text-sm">No versions saved yet.</p>
      ) : (
        <div className="space-y-2">
          {versions.map((v) => (
            <div key={v.id} className="flex items-center justify-between bg-stone-800/50 rounded-lg px-3 py-2">
              <div>
                <p className="text-sm text-stone-300">{v.label}</p>
                <p className="text-xs text-stone-500">
                  {formatDate(v.timestamp)} · {v.sessionCount} sessions · {v.commitCount} commits
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openVersionPreview(v.id)}
                  className="text-xs text-stone-400 hover:text-stone-200 transition-colors">Preview</button>
                <button onClick={() => restoreVersion(v.id)}
                  className="text-xs text-amber-400 hover:text-amber-300 transition-colors">Restore</button>
                <button onClick={() => deleteVersion(v.id)}
                  className="text-xs text-rose-400 hover:text-rose-300 transition-colors">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {previewVersion && (
        <div className="mt-3 bg-stone-800 rounded-lg p-3 border border-stone-700">
          <div className="flex items-center justify-between mb-2">
            <h5 className="text-xs text-stone-400 uppercase tracking-wide">Version Preview</h5>
            <button onClick={() => setPreviewVersion(null)} className="text-stone-500 hover:text-stone-300 text-xs">✕</button>
          </div>
          {(() => {
            const d = previewVersion.diff;
            return (
              <div className="text-xs text-stone-400 space-y-1">
                <p>Sessions: {d.summary.localOnlyCount} local-only · {d.summary.serverOnlyCount} version-only · {d.summary.conflictCount} conflicts</p>
                <p>Commits: {d.commits.localOnly.length} local-only · {d.commits.serverOnly.length} version-only · {d.commits.conflicts.length} conflicts</p>
                <p>Settings: {d.settings.conflicts.length} field(s) differ</p>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );

  // ─── RENDER: Diff Summary ───
  if (phase === "summary" || phase === "strategy") {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-stone-900 border border-stone-800 rounded-2xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto">
          {renderHeader("Data Sync — Diff Summary")}

          {/* Summary cards */}
          <div className="grid grid-cols-4 gap-3 mb-5">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-emerald-400">{diffResult.sessions.localOnly.length + diffResult.commits.localOnly.length}</div>
              <div className="text-[11px] text-stone-400">Browser only</div>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-blue-400">{diffResult.sessions.serverOnly.length + diffResult.commits.serverOnly.length}</div>
              <div className="text-[11px] text-stone-400">Disk only</div>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-amber-400">{diffResult.summary.conflictCount}</div>
              <div className="text-[11px] text-stone-400">Conflicts</div>
            </div>
            <div className="bg-stone-800 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-stone-400">{diffResult.summary.identicalCount}</div>
              <div className="text-[11px] text-stone-400">Identical</div>
            </div>
          </div>

          {/* Expandable sections */}
          {renderDiffSection("Sessions", diffResult.sessions, sessionBrief)}
          {renderDiffSection("Commits", diffResult.commits, commitBrief)}
          {renderSettingsDiff()}
          {renderUiDiff()}

          {/* Version history link */}
          {versions.length > 0 && (
            <div className="mt-4 text-center">
              <button onClick={() => setShowVersions(!showVersions)}
                className="text-xs text-stone-400 hover:text-stone-200 transition-colors">
                {showVersions ? "Hide" : "Show"} Version History ({versions.length})
              </button>
              {showVersions && renderVersionHistory()}
            </div>
          )}

          {/* Strategy selection */}
          <div className="mt-5 space-y-3">
            <h4 className="text-sm font-medium text-stone-300">Choose Strategy</h4>
            <div className="grid grid-cols-3 gap-3">
              <button onClick={() => selectStrategy("push")}
                className={`p-4 rounded-lg border text-left transition-colors ${
                  strategy === "push" ? "border-emerald-500 bg-emerald-500/10" : "border-stone-700 bg-stone-800/50 hover:bg-stone-800"
                }`}>
                <div className="text-sm font-medium text-stone-200 mb-1">Push</div>
                <div className="text-[11px] text-stone-400">Browser → Disk</div>
                <div className="text-[10px] text-rose-400/70 mt-2">
                  {diffResult.sessions.serverOnly.length + diffResult.commits.serverOnly.length > 0
                    ? `⚠ Loses ${diffResult.sessions.serverOnly.length + diffResult.commits.serverOnly.length} disk-only items`
                    : "No disk-only data to lose"}
                </div>
              </button>
              <button onClick={() => selectStrategy("pull")}
                className={`p-4 rounded-lg border text-left transition-colors ${
                  strategy === "pull" ? "border-blue-500 bg-blue-500/10" : "border-stone-700 bg-stone-800/50 hover:bg-stone-800"
                }`}>
                <div className="text-sm font-medium text-stone-200 mb-1">Pull</div>
                <div className="text-[11px] text-stone-400">Disk → Browser</div>
                <div className="text-[10px] text-rose-400/70 mt-2">
                  {diffResult.sessions.localOnly.length + diffResult.commits.localOnly.length > 0
                    ? `⚠ Loses ${diffResult.sessions.localOnly.length + diffResult.commits.localOnly.length} browser-only items`
                    : "No browser-only data to lose"}
                </div>
              </button>
              <button onClick={() => selectStrategy("merge")}
                className={`p-4 rounded-lg border text-left transition-colors ${
                  strategy === "merge" ? "border-amber-500 bg-amber-500/10" : "border-stone-700 bg-stone-800/50 hover:bg-stone-800"
                }`}>
                <div className="text-sm font-medium text-stone-200 mb-1">Merge</div>
                <div className="text-[11px] text-stone-400">Keep both sides</div>
                <div className="text-[10px] text-amber-400/70 mt-2">
                  {diffResult.summary.conflictCount > 0
                    ? `${diffResult.summary.conflictCount} conflict(s) to resolve`
                    : "No conflicts — clean merge"}
                </div>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── RENDER: Diff section helper ───
  function renderDiffSection(title, section, briefFn) {
    const key = title.toLowerCase();
    const isExpanded = expandedSections[key];
    const hasDiffs = section.localOnly.length > 0 || section.serverOnly.length > 0 || section.conflicts.length > 0;

    return (
      <div className="border-t border-stone-800 pt-3">
        <button onClick={() => toggleSection(key)}
          className="w-full flex items-center justify-between text-sm text-stone-300 hover:text-white transition-colors">
          <span className="flex items-center gap-2">
            {title}
            <Badge color="green">{section.localOnly.length} browser</Badge>
            <Badge color="blue">{section.serverOnly.length} disk</Badge>
            {section.conflicts.length > 0 && <Badge color="amber">{section.conflicts.length} conflicts</Badge>}
            {!hasDiffs && <Badge>match</Badge>}
          </span>
          <span className="text-stone-500">{isExpanded ? "▾" : "▸"}</span>
        </button>
        {isExpanded && (
          <div className="mt-2 space-y-1.5 text-xs">
            {section.localOnly.map((item, i) => (
              <div key={`lo-${i}`} className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-300">
                <span className="text-emerald-500/70 mr-2">browser:</span>{briefFn(item)}
              </div>
            ))}
            {section.serverOnly.map((item, i) => (
              <div key={`so-${i}`} className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-300">
                <span className="text-blue-500/70 mr-2">disk:</span>{briefFn(item)}
              </div>
            ))}
            {section.conflicts.map((c, i) => (
              <div key={`cf-${i}`} className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-300">
                <span className="text-amber-500/70 mr-2">conflict:</span>
                <span className="text-stone-400">{briefFn(c.local)}</span>
                <span className="text-stone-600 ml-2">({c.fields.length} field{c.fields.length !== 1 ? "s" : ""} differ)</span>
              </div>
            ))}
            {!hasDiffs && <p className="text-stone-500 px-3 py-1">All {title.toLowerCase()} match.</p>}
          </div>
        )}
      </div>
    );
  }

  // ─── RENDER: Settings diff ───
  function renderSettingsDiff() {
    const isExpanded = expandedSections.settings;
    return (
      <div className="border-t border-stone-800 pt-3">
        <button onClick={() => toggleSection("settings")}
          className="w-full flex items-center justify-between text-sm text-stone-300 hover:text-white transition-colors">
          <span className="flex items-center gap-2">
            Settings
            {diffResult.settings.conflicts.length > 0
              ? <Badge color="amber">{diffResult.settings.conflicts.length} field(s) differ</Badge>
              : <Badge>match</Badge>}
          </span>
          <span className="text-stone-500">{isExpanded ? "▾" : "▸"}</span>
        </button>
        {isExpanded && (
          <div className="mt-2 space-y-1.5 text-xs">
            {diffResult.settings.conflicts.map((c, i) => (
              <div key={i} className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-300">
                <span className="font-medium">{c.key}</span>
                <span className="text-stone-500 mx-2">:</span>
                <span className="text-emerald-400">{JSON.stringify(c.localValue)}</span>
                <span className="text-stone-600 mx-1">vs</span>
                <span className="text-blue-400">{JSON.stringify(c.serverValue)}</span>
              </div>
            ))}
            {diffResult.settings.identical && <p className="text-stone-500 px-3 py-1">All settings match.</p>}
          </div>
        )}
      </div>
    );
  }

  // ─── RENDER: UI diff ───
  function renderUiDiff() {
    const isExpanded = expandedSections.ui;
    return (
      <div className="border-t border-stone-800 pt-3">
        <button onClick={() => toggleSection("ui")}
          className="w-full flex items-center justify-between text-sm text-stone-300 hover:text-white transition-colors">
          <span className="flex items-center gap-2">
            UI Preferences
            {diffResult.ui.conflicts.length > 0
              ? <Badge color="amber">{diffResult.ui.conflicts.length} field(s) differ</Badge>
              : <Badge>match</Badge>}
          </span>
          <span className="text-stone-500">{isExpanded ? "▾" : "▸"}</span>
        </button>
        {isExpanded && (
          <div className="mt-2 space-y-1.5 text-xs">
            {diffResult.ui.conflicts.map((c, i) => (
              <div key={i} className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-300">
                <span className="font-medium">{c.key}</span>
                <span className="text-stone-500 mx-2">:</span>
                <span className="text-emerald-400">{JSON.stringify(c.localValue)}</span>
                <span className="text-stone-600 mx-1">vs</span>
                <span className="text-blue-400">{JSON.stringify(c.serverValue)}</span>
              </div>
            ))}
            {diffResult.ui.identical && <p className="text-stone-500 px-3 py-1">All preferences match.</p>}
          </div>
        )}
      </div>
    );
  }

  // ─── RENDER: Conflict Resolver ───
  if (phase === "conflicts") {
    const hasSessionConflicts = diffResult.sessions.conflicts.length > 0;
    const hasCommitConflicts = diffResult.commits.conflicts.length > 0;
    const hasSettingsConflicts = diffResult.settings.conflicts.length > 0;
    const hasUiConflicts = diffResult.ui.conflicts.length > 0;

    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-stone-900 border border-stone-800 rounded-2xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto">
          {renderHeader("Resolve Conflicts")}

          {/* Bulk actions */}
          <div className="flex gap-2 mb-4">
            <button onClick={() => { resolveAll("sessions", "local"); resolveAll("commits", "local"); }}
              className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors">
              Keep All Local
            </button>
            <button onClick={() => { resolveAll("sessions", "server"); resolveAll("commits", "server"); }}
              className="text-xs px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors">
              Keep All Server
            </button>
          </div>

          {/* Session conflicts */}
          {hasSessionConflicts && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-stone-300 mb-2">
                Sessions ({diffResult.sessions.conflicts.length})
              </h4>
              <div className="space-y-2">
                {diffResult.sessions.conflicts.map((c) => (
                  <div key={c.id} className="bg-stone-800 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-stone-400">{sessionBrief(c.local)}</span>
                      <div className="flex gap-1">
                        <button onClick={() => setResolution("sessions", c.id, "local")}
                          className={`text-[11px] px-2 py-1 rounded ${
                            (resolutions.sessions || {})[c.id] === "local"
                              ? "bg-emerald-500/30 text-emerald-300" : "bg-stone-700 text-stone-400 hover:bg-stone-600"
                          }`}>Local</button>
                        <button onClick={() => setResolution("sessions", c.id, "server")}
                          className={`text-[11px] px-2 py-1 rounded ${
                            (resolutions.sessions || {})[c.id] === "server"
                              ? "bg-blue-500/30 text-blue-300" : "bg-stone-700 text-stone-400 hover:bg-stone-600"
                          }`}>Server</button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="bg-stone-900 rounded p-2">
                        <span className="text-emerald-500">Local: </span>
                        <span className="text-stone-400">{c.fields.map((f) => f.key).join(", ")}</span>
                      </div>
                      <div className="bg-stone-900 rounded p-2">
                        <span className="text-blue-500">Server: </span>
                        <span className="text-stone-400">{c.fields.map((f) => f.key).join(", ")}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Commit conflicts */}
          {hasCommitConflicts && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-stone-300 mb-2">
                Commits ({diffResult.commits.conflicts.length})
              </h4>
              <div className="space-y-2">
                {diffResult.commits.conflicts.map((c) => (
                  <div key={c.id} className="bg-stone-800 rounded-lg p-3 flex items-center justify-between">
                    <span className="text-xs text-stone-400">{commitBrief(c.local)}</span>
                    <div className="flex gap-1">
                      <button onClick={() => setResolution("commits", c.id, "local")}
                        className={`text-[11px] px-2 py-1 rounded ${
                          (resolutions.commits || {})[c.id] === "local"
                            ? "bg-emerald-500/30 text-emerald-300" : "bg-stone-700 text-stone-400 hover:bg-stone-600"
                        }`}>Local</button>
                      <button onClick={() => setResolution("commits", c.id, "server")}
                        className={`text-[11px] px-2 py-1 rounded ${
                          (resolutions.commits || {})[c.id] === "server"
                            ? "bg-blue-500/30 text-blue-300" : "bg-stone-700 text-stone-400 hover:bg-stone-600"
                        }`}>Server</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Settings conflicts */}
          {hasSettingsConflicts && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-stone-300 mb-2">Settings</h4>
              <div className="space-y-2">
                {diffResult.settings.conflicts.map((c) => (
                  <div key={c.key} className="bg-stone-800 rounded-lg p-3 flex items-center justify-between">
                    <span className="text-xs text-stone-400">
                      <span className="font-medium text-stone-300">{c.key}</span>:{" "}
                      <span className="text-emerald-400">{JSON.stringify(c.localValue)}</span>
                      <span className="text-stone-600 mx-1">→</span>
                      <span className="text-blue-400">{JSON.stringify(c.serverValue)}</span>
                    </span>
                    <div className="flex gap-1">
                      <button onClick={() => setResolution("settings", c.key, "local")}
                        className={`text-[11px] px-2 py-1 rounded ${
                          (resolutions.settings || {})[c.key] === "local"
                            ? "bg-emerald-500/30 text-emerald-300" : "bg-stone-700 text-stone-400 hover:bg-stone-600"
                        }`}>Local</button>
                      <button onClick={() => setResolution("settings", c.key, "server")}
                        className={`text-[11px] px-2 py-1 rounded ${
                          (resolutions.settings || {})[c.key] === "server"
                            ? "bg-blue-500/30 text-blue-300" : "bg-stone-700 text-stone-400 hover:bg-stone-600"
                        }`}>Server</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* UI conflicts */}
          {hasUiConflicts && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-stone-300 mb-2">UI Preferences</h4>
              <div className="space-y-2">
                {diffResult.ui.conflicts.map((c) => (
                  <div key={c.key} className="bg-stone-800 rounded-lg p-3 flex items-center justify-between">
                    <span className="text-xs text-stone-400">
                      <span className="font-medium text-stone-300">{c.key}</span>:{" "}
                      <span className="text-emerald-400">{JSON.stringify(c.localValue)}</span>
                      <span className="text-stone-600 mx-1">→</span>
                      <span className="text-blue-400">{JSON.stringify(c.serverValue)}</span>
                    </span>
                    <div className="flex gap-1">
                      <button onClick={() => setResolution("ui", c.key, "local")}
                        className={`text-[11px] px-2 py-1 rounded ${
                          (resolutions.ui || {})[c.key] === "local"
                            ? "bg-emerald-500/30 text-emerald-300" : "bg-stone-700 text-stone-400 hover:bg-stone-600"
                        }`}>Local</button>
                      <button onClick={() => setResolution("ui", c.key, "server")}
                        className={`text-[11px] px-2 py-1 rounded ${
                          (resolutions.ui || {})[c.key] === "server"
                            ? "bg-blue-500/30 text-blue-300" : "bg-stone-700 text-stone-400 hover:bg-stone-600"
                        }`}>Server</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Continue button */}
          <button onClick={() => goToDryRun("merge")}
            className="w-full mt-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 font-medium text-sm transition-colors">
            Continue to Preview →
          </button>
        </motion.div>
      </div>
    );
  }

  // ─── RENDER: Dry Run ───
  if (phase === "dryrun" && preview) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-stone-900 border border-stone-800 rounded-2xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto">
          {renderHeader("Sync Preview")}

          <div className="bg-stone-800 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Badge color={strategy === "push" ? "green" : strategy === "pull" ? "blue" : "amber"}>
                {strategy.toUpperCase()}
              </Badge>
              <span className="text-sm text-stone-300">
                {strategy === "push" ? "Browser → Disk" : strategy === "pull" ? "Disk → Browser" : "Merge both sides"}
              </span>
            </div>
            <div className="space-y-1.5">
              {preview.description.map((line, i) => (
                <p key={i} className={`text-sm ${
                  line.startsWith("⚠") ? "text-rose-400" :
                  line.startsWith("✓") ? "text-emerald-400" :
                  "text-stone-400"
                }`}>{line}</p>
              ))}
            </div>
          </div>

          <div className="bg-stone-800/50 rounded-lg p-3 mb-5">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-stone-200">{preview.resultSummary.sessionsCount}</div>
                <div className="text-[11px] text-stone-400">sessions after sync</div>
              </div>
              <div>
                <div className="text-lg font-bold text-stone-200">{preview.resultSummary.commitsCount}</div>
                <div className="text-[11px] text-stone-400">commits after sync</div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={executeSync}
              className="flex-1 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 font-medium text-sm transition-colors">
              Create Backup & Sync
            </button>
            <button onClick={() => setPhase(strategy === "merge" && diffResult.summary.conflictCount > 0 ? "conflicts" : "summary")}
              className="px-4 py-2.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-sm transition-colors">
              Back
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── RENDER: Dryrun fallback (preview not ready) ───
  if (phase === "dryrun" && !preview) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-stone-900 border border-stone-800 rounded-2xl p-6 w-full max-w-2xl">
          {renderHeader("Sync Preview")}
          <p className="text-stone-400 text-sm mb-4">Something went wrong generating the preview.</p>
          <button onClick={() => setPhase("summary")}
            className="px-4 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-sm transition-colors">
            Back to Summary
          </button>
        </motion.div>
      </div>
    );
  }

  // ─── RENDER: Executing ───
  if (phase === "executing") {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="bg-stone-900 border border-stone-800 rounded-2xl p-6 w-full max-w-2xl">
          {renderHeader("Syncing…", true)}
          <div className="flex items-center justify-center py-12 gap-3 text-stone-400">
            <Icon path={ICONS.refresh} size={20} className="animate-spin" />
            <span>Creating backup and applying changes…</span>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── RENDER: Done ───
  if (phase === "done") {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-stone-900 border border-stone-800 rounded-2xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto">
          {renderHeader("Sync Complete")}
          <div className="text-center py-6">
            <div className="text-emerald-400 text-4xl mb-3">✓</div>
            <p className="text-stone-300 mb-2">Data synced successfully!</p>
            <p className="text-stone-500 text-sm mb-4">
              A backup was saved as "pre-sync-{strategy}". You can restore it from version history.
            </p>
            {preview && (
              <div className="bg-stone-800 rounded-lg p-3 mb-6 text-left">
                <p className="text-sm text-stone-400 mb-1">
                  Result: {preview.resultSummary.sessionsCount} sessions, {preview.resultSummary.commitsCount} commits
                </p>
                {preview.description.map((line, i) => (
                  <p key={i} className="text-xs text-stone-500">{line}</p>
                ))}
              </div>
            )}
            {versions.length > 0 && (
              <button onClick={() => setShowVersions(true)}
                className="text-xs text-stone-400 hover:text-stone-200 transition-colors mb-4 block mx-auto">
                View Version History ({versions.length})
              </button>
            )}
            {showVersions && renderVersionHistory()}
            <div>
              <button onClick={onClose}
                className="px-6 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 font-medium text-sm transition-colors">
                Done
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return null;
}
