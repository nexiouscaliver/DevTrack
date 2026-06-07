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
    return migrate(parsed);
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
    return migrate(parsed);
  } catch {
    return null;
  }
};

const save = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    if (
      e instanceof DOMException &&
      (e.name === "QuotaExceededError" || e.code === 22)
    ) {
      console.error("DevTrack: localStorage quota exceeded. Data not saved.");
    } else {
      throw e;
    }
  }
  // Fire-and-forget save to server (durable backup)
  fetch("/api/data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data }),
  }).catch(() => {
    console.warn("DevTrack: server backup unavailable — data saved to localStorage only");
  });
};

export default function App() {
  // Load once and derive all initial state from it
  const [initialData] = useState(() => load());
  const [data, setData] = useState(() => initialData || DEFAULT_DATA);
  const [now] = useState(() => Date.now());
  const [view, setView] = useState(() => initialData?.ui?.view || "dashboard");
  const [activeSession, setActiveSession] = useState(() => {
    const running = (initialData?.sessions || []).find((s) => s.status === "running" || s.status === "paused");
    return running || null;
  });
  const [elapsed, setElapsed] = useState(() => {
    const active = (initialData?.sessions || []).find((s) => s.status === "running" || s.status === "paused");
    if (!active) return 0;
    if (active.status === "paused") {
      const currentPause = (active.pauses || []).find((p) => p.end === null);
      return currentPause ? Date.now() - currentPause.start : 0;
    }
    return Date.now() - active.start;
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const saveTimer = useRef(null);

  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save(data), 300);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [data]);

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
  const serverSynced = useRef(false);
  const dataRef = useRef(data);
  useEffect(() => { dataRef.current = data; }, [data]);
  useEffect(() => {
    if (serverSynced.current) return;
    serverSynced.current = true;
    const mountHash = JSON.stringify(data);

    loadFromServer().then((serverData) => {
      if (!serverData) return;
      if (JSON.stringify(dataRef.current) !== mountHash) return;

      localStorage.setItem(STORAGE_KEY, JSON.stringify(serverData));
      setData(serverData);
      setView(serverData.ui?.view || "dashboard");
      const running = serverData.sessions.find((s) => s.status === "running" || s.status === "paused") || null;
      if (running) {
        setActiveSession(running);
        if (running.status === "paused") {
          const currentPause = (running.pauses || []).find((p) => p.end === null);
          setElapsed(currentPause ? Date.now() - currentPause.start : 0);
        } else {
          const paused = (running.pauses || []).reduce((s, p) => s + ((p.end || 0) - p.start), 0);
          setElapsed(Date.now() - running.start - paused);
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Timer tick — update every second while session is active (running or paused)
  useEffect(() => {
    if (!activeSession || activeSession.status === "completed") return;
    const tick = () => {
      if (activeSession.status === "running") {
        const paused = activeSession.pauses.reduce((s, p) => s + ((p.end || 0) - p.start), 0);
        setElapsed(Date.now() - activeSession.start - paused);
      } else if (activeSession.status === "paused") {
        // Keep ticking so break elapsed updates
        const completedPauses = activeSession.pauses
          .filter((p) => p.end !== null)
          .reduce((s, p) => s + (p.end - p.start), 0);
        const currentPauseStart = activeSession.pauses[activeSession.pauses.length - 1]?.start || Date.now();
        setElapsed(completedPauses + (Date.now() - currentPauseStart));
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [activeSession]);

  const toastTimer = useRef(null);

  const showToast = useCallback((msg, type = "success") => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, type });
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  const startSession = (type = "work", tags = [], notes = "") => {
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
    };
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
    { id: "export", label: "Export Report", icon: ICONS.download },
  ];

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 font-sans flex">
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
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <SettingsModal
        key={settingsOpen ? "open" : "closed"}
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        data={data}
        updateSettings={updateSettings}
        showToast={showToast}
        onReset={handleReset}
      />
      <Toast toast={toast} />
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
  const isFirstTime = stats.totalToday === 0 && stats.streak === 0;

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
  data,
  showToast,
}) {
  const [tags, setTags] = useState(() => activeSession?.tags?.join(", ") || "");
  const [notes, setNotes] = useState(() => activeSession?.notes || "");

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

  const saveSessionNotes = () => {
    if (activeSession)
      updateSession(activeSession.id, {
        notes,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
    showToast("Notes saved");
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
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="What are you working on?"
                    rows={2}
                    className="w-full px-3 py-2 bg-stone-900/80 border border-stone-700/50 rounded-lg text-sm focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 resize-none placeholder:text-stone-600"
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
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Notes..."
                    rows={2}
                    className="w-full px-3 py-2 bg-stone-900/80 border border-stone-700/50 rounded-lg text-sm focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 resize-none placeholder:text-stone-600"
                  />
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
                    onClick={saveSessionNotes}
                    className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-sm font-medium flex items-center justify-center gap-1.5 border border-stone-700/50 active:scale-[0.98] transition-all text-stone-300 hover:text-stone-100"
                  >
                    <Icon path={ICONS.check} size={14} /> Save
                  </button>
                  <button
                    onClick={stopSession}
                    className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-rose-900/40 text-sm font-medium flex items-center justify-center gap-1.5 border border-stone-700/50 hover:border-rose-500/30 active:scale-[0.98] transition-all text-stone-300 hover:text-rose-300"
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
                              className="flex items-center gap-1.5 text-xs text-stone-400"
                            >
                              <Icon path={ICONS.gitCommit} size={10} />
                              <span className="truncate">{commit.message}</span>
                              <span className="text-stone-500 shrink-0 ml-auto">
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
function SessionsView({ data, deleteSession, updateSession, initialFilter, onFilterChange }) {
  const [filter, setFilter] = useState(initialFilter || "all");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

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
                    className="bg-stone-900/50 border border-stone-800 rounded-xl p-4 flex items-center gap-4 hover:bg-stone-800/40 hover:border-stone-700 transition-colors"
                  >
                    <div
                      className={`w-1 self-stretch rounded ${s.type === "work" ? "bg-amber-400" : "bg-sky-400"}`}
                    />
                    <div className="flex-1">
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
                                    className="flex items-center gap-2 text-xs text-stone-400 bg-stone-800/40 rounded-lg px-2.5 py-1.5"
                                  >
                                    <Icon path={ICONS.gitCommit} size={12} />
                                    <span className="font-mono text-stone-500">
                                      {sha.slice(0, 7)}
                                    </span>
                                    <span className="truncate">
                                      {commit.message}
                                    </span>
                                    <span className="text-stone-500 shrink-0 ml-auto">
                                      {formatDate(commit.timestamp)} {formatTime(commit.timestamp)}
                                    </span>
                                    {commit.repo && (
                                      <span className="text-stone-500 shrink-0">
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
function AnalyticsView({ data, gitEstimatedSessions, initialRange, onRangeChange }) {
  const [range, setRange] = useState(initialRange || "week");
  const [now] = useState(() => Date.now());

  const rangeData = useMemo(() => {
    const days = range === "week" ? 7 : range === "month" ? 30 : 365;
    const arr = [];
    for (let d = days - 1; d >= 0; d--) {
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
  }, [data.sessions, range, now, gitEstimatedSessions]);

  const totalHrs = rangeData.reduce((a, r) => a + r.hours, 0);
  const avgHrs = (totalHrs / rangeData.length).toFixed(1);
  const maxDay = Math.max(...rangeData.map((r) => r.hours));

  const { tagData, hourlyData } = useMemo(() => {
    const rangeDays = range === "week" ? 7 : range === "month" ? 30 : 365;
    const rangeCutoff = now - rangeDays * 86400000;

    const tagBreakdown = {};
    data.sessions
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
    data.sessions
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
  }, [data.sessions, range, now]);

  const COLORS = [
    "#f59e0b",
    "#f97316",
    "#ef4444",
    "#a855f7",
    "#10b981",
    "#06b6d4",
  ];

  const completedSessions = data.sessions.filter(
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
function ExportView({ data, gitAuthors, showToast, initialPeriod, initialFormat, onPrefsChange }) {
  const [period, setPeriod] = useState(initialPeriod || "week");
  const [format, setFormat] = useState(initialFormat || "xlsx");
  const preview = useMemo(() => getExportPreview(data, period), [data, period]);

  const handleExport = () => {
    const exportData = {
      ...data,
      commits: filterByAuthor(data.commits || [], gitAuthors),
    };
    if (format === "xlsx") {
      generateExcelReport(exportData, period);
    } else {
      generateCSVReport(exportData, period);
    }
    showToast(`${format === "xlsx" ? "Excel" : "CSV"} report exported!`);
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

// ============ SETTINGS MODAL ============
function SettingsModal({ open, onClose, data, updateSettings, showToast, onReset }) {
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
