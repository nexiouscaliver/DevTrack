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
import * as XLSX from "xlsx";

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
const formatDate = (ts) => new Date(ts).toLocaleDateString();
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

const sanitizeCell = (val) => {
  const str = String(val ?? "");
  if (/^[=+\-@\t\r]/.test(str)) {
    return "'" + str;
  }
  return str;
};

const STORAGE_KEY = "devtrack_data_v1";

const DEFAULT_DATA = {
  sessions: [],
  commits: [],
  settings: {
    dailyGoal: 8,
    githubToken: "",
    githubUser: "",
    idleMinutes: 10,
  },
};

const load = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      !parsed ||
      !Array.isArray(parsed.sessions) ||
      !Array.isArray(parsed.commits) ||
      !parsed.settings ||
      typeof parsed.settings !== "object"
    ) {
      return null;
    }
    return parsed;
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
};

export default function App() {
  const [data, setData] = useState(() => load() || DEFAULT_DATA);
  const [now] = useState(() => Date.now());
  const [view, setView] = useState("dashboard");
  const [activeSession, setActiveSession] = useState(() => {
    const d = load();
    return (d?.sessions || []).find((s) => s.status === "running") || null;
  });
  const [elapsed, setElapsed] = useState(() => {
    const d = load();
    const running = (d?.sessions || []).find((s) => s.status === "running");
    return running ? Date.now() - running.start : 0;
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const saveTimer = useRef(null);

  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save(data), 300);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [data]);

  // Timer tick
  useEffect(() => {
    if (!activeSession || activeSession.status !== "running") return;
    const tick = () => setElapsed(Date.now() - activeSession.start);
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
    };
    setActiveSession(session);
    setElapsed(0);
    setData((d) => ({ ...d, sessions: [...d.sessions, session] }));
    showToast(`${type === "work" ? "💼 Work" : "☕ Break"} session started`);
  };

  const stopSession = useCallback(() => {
    setActiveSession((current) => {
      if (!current) return null;
      const now = Date.now();
      const ended = {
        ...current,
        end: now,
        duration: now - current.start,
        status: "completed",
      };
      setData((d) => ({
        ...d,
        sessions: d.sessions.map((s) => (s.id === current.id ? ended : s)),
      }));
      setElapsed(0);
      showToast("Session completed ✓");
      return null;
    });
  }, [showToast]);

  // Idle detection — auto-stop session after configured minutes
  useEffect(() => {
    const idleMs = (data.settings.idleMinutes || 0) * 60000;
    if (!activeSession || idleMs === 0) return;

    let lastActivity = Date.now();
    let idleCheck;

    const resetIdle = () => {
      lastActivity = Date.now();
    };

    const events = ["mousemove", "keydown", "mousedown", "touchstart", "scroll"];
    events.forEach((e) => window.addEventListener(e, resetIdle));

    idleCheck = setInterval(() => {
      if (Date.now() - lastActivity >= idleMs) {
        stopSession();
        showToast("Session auto-stopped due to inactivity", "error");
      }
    }, 30000);

    return () => {
      events.forEach((e) => window.removeEventListener(e, resetIdle));
      clearInterval(idleCheck);
    };
  }, [activeSession, data.settings.idleMinutes, stopSession, showToast]);

  const deleteSession = (id) => {
    setData((d) => ({ ...d, sessions: d.sessions.filter((s) => s.id !== id) }));
    showToast("Session deleted");
  };

  const updateSession = (id, updates) => {
    setData((d) => ({
      ...d,
      sessions: d.sessions.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    }));
  };

  const updateSettings = (updates) => {
    setData((d) => ({ ...d, settings: { ...d.settings, ...updates } }));
  };

  const addCommit = (commit) => {
    setData((d) => ({ ...d, commits: [commit, ...d.commits] }));
  };

  // Stats
  const stats = useMemo(() => {
    const todaySessions = data.sessions.filter(
      (s) => s.status === "completed" && isToday(s.start),
    );
    const workToday = todaySessions.filter((s) => s.type === "work");
    const totalToday = workToday.reduce((a, s) => a + s.duration, 0);
    const breaksToday = todaySessions.filter((s) => s.type === "break");
    const totalBreaks = breaksToday.reduce((a, s) => a + s.duration, 0);

    // Weekly
    const weekAgo = now - 7 * 86400000;
    const weekSessions = data.sessions.filter(
      (s) => s.status === "completed" && s.start > weekAgo && s.type === "work",
    );
    const totalWeek = weekSessions.reduce((a, s) => a + s.duration, 0);

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
        .reduce((a, s) => a + s.duration, 0);
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
        .reduce((a, s) => a + s.duration, 0);
      const breaks = data.sessions
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
        breaks: +(breaks / 3600000).toFixed(2),
        date: dayStart,
      });
    }
    return arr;
  }, [data.sessions, now]);

  const nav = [
    { id: "dashboard", label: "Dashboard", icon: ICONS.dashboard },
    { id: "timer", label: "Timer", icon: ICONS.timer },
    { id: "sessions", label: "Sessions", icon: ICONS.list },
    { id: "git", label: "Git Sync", icon: ICONS.github },
    { id: "analytics", label: "Analytics", icon: ICONS.chart },
    { id: "export", label: "Export Report", icon: ICONS.download },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900/50 backdrop-blur border-r border-slate-800 p-5 flex flex-col sticky top-0 h-screen">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Icon path={ICONS.zap} size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-none">DevTrack</h1>
            <p className="text-xs text-slate-400">Smart Work Tracker</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {nav.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                view === item.id
                  ? "bg-gradient-to-r from-indigo-500/20 to-purple-500/10 text-white border border-indigo-500/30"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
              }`}
            >
              <Icon path={item.icon} size={18} />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Mini timer */}
        {activeSession && (
          <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-medium text-emerald-300 uppercase">
                {activeSession.type}
              </span>
            </div>
            <div className="font-mono text-xl font-bold">
              {formatDuration(elapsed)}
            </div>
            <button
              onClick={() => setView("timer")}
              className="text-xs text-emerald-400 hover:text-emerald-300 mt-1"
            >
              View →
            </button>
          </div>
        )}

        <button
          onClick={() => setSettingsOpen(true)}
          className="mt-4 flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/50"
        >
          <Icon path={ICONS.settings} size={16} />
          Settings
        </button>
      </aside>

      {/* Main */}
      <main className="flex-1 p-8 overflow-auto">
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
                setView={setView}
              />
            )}
            {view === "timer" && (
              <TimerView
                key={activeSession?.id || "idle"}
                activeSession={activeSession}
                elapsed={elapsed}
                startSession={startSession}
                pauseSession={stopSession}
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
              />
            )}
            {view === "git" && (
              <GitView
                data={data}
                addCommit={addCommit}
                setData={setData}
                showToast={showToast}
              />
            )}
            {view === "analytics" && (
              <AnalyticsView data={data} weeklyData={weeklyData} />
            )}
            {view === "export" && (
              <ExportView data={data} showToast={showToast} />
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
        setData={setData}
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
}) {
  const goal = data.settings.dailyGoal || 8;
  const workedHrs = (stats.totalToday / 3600000).toFixed(1);
  const isFirstTime = stats.totalToday === 0 && stats.streak === 0;

  if (isFirstTime) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-6">
            <Icon path={ICONS.zap} size={36} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-3">Welcome to DevTrack</h1>
          <p className="text-slate-400 max-w-md mb-8">
            Track your work sessions, analyze productivity patterns, and generate
            professional reports. Start your first session to get going.
          </p>
          <button
            onClick={() => startSession("work", [], "")}
            className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 font-semibold text-lg shadow-lg shadow-indigo-500/30 flex items-center gap-3"
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
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 p-8 bg-gradient-to-br from-indigo-500/10 via-slate-950 to-purple-500/10">
        <div className="relative">
          <p className="text-slate-400 text-sm mb-1">
            {new Date().toLocaleDateString("en", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
          <h1 className="text-3xl font-bold mb-2">Welcome back 👋</h1>
          <p className="text-slate-300 max-w-xl">
            {activeSession
              ? `You're currently in a ${activeSession.type} session. Keep going!`
              : stats.sessionsToday === 0
                ? "Ready to start a productive day? Hit the button below."
                : `You've logged ${stats.sessionsToday} session${stats.sessionsToday > 1 ? "s" : ""} today totaling ${workedHrs}h.`}
          </p>
          {!activeSession && (
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => startSession("work", [], "")}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 font-medium shadow-lg shadow-indigo-500/30 flex items-center gap-2"
              >
                <Icon path={ICONS.play} size={16} /> Start Work
              </button>
              <button
                onClick={() => startSession("break", [], "")}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-medium flex items-center gap-2"
              >
                <Icon path={ICONS.coffee} size={16} /> Take a Break
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Worked Today"
          value={`${workedHrs}h`}
          sub={`of ${goal}h goal`}
          icon={ICONS.clock}
          color="indigo"
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
          color="amber"
        />
        <StatCard
          label="Streak"
          value={`${stats.streak}d`}
          sub={`best: ${stats.bestStreak}d`}
          icon={ICONS.fire}
          color="rose"
        />
      </div>

      {/* Charts + Activity */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">This Week</h3>
            <span className="text-xs text-slate-400">
              Work vs Breaks (hours)
            </span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={weeklyData}>
              <defs>
                <linearGradient id="gWork" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gBreak" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: 8,
                }}
              />
              <Area
                type="monotone"
                dataKey="work"
                stroke="#6366f1"
                fill="url(#gWork)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="breaks"
                stroke="#f59e0b"
                fill="url(#gBreak)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
          <h3 className="font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-3 max-h-[240px] overflow-auto">
            {data.sessions
              .slice()
              .reverse()
              .slice(0, 6)
              .map((s) => (
                <div key={s.id} className="flex items-start gap-3 text-sm">
                  <div
                    className={`w-2 h-2 rounded-full mt-1.5 ${s.type === "work" ? "bg-indigo-400" : "bg-amber-400"}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-slate-200">
                      {s.notes || s.tags?.[0] || s.type}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatTime(s.start)} · {formatDuration(s.duration)}
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
    indigo:
      "from-indigo-500/20 to-indigo-500/5 border-indigo-500/30 text-indigo-400",
    emerald:
      "from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 text-emerald-400",
    amber:
      "from-amber-500/20 to-amber-500/5 border-amber-500/30 text-amber-400",
    rose: "from-rose-500/20 to-rose-500/5 border-rose-500/30 text-rose-400",
  };
  return (
    <div
      className={`bg-gradient-to-br ${colors[color]} border rounded-2xl p-5`}
    >
      <div className="flex items-center justify-between mb-3">
        <Icon path={icon} size={18} />
        <span className="text-xs text-slate-400 uppercase tracking-wide">
          {label}
        </span>
      </div>
      <div className="text-3xl font-bold text-white">{value}</div>
      <div className="text-xs text-slate-400 mt-1">{sub}</div>
      {typeof progress === "number" && (
        <div className="mt-3 h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1 }}
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
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
  updateSession,
  data,
  showToast,
}) {
  const [tags, setTags] = useState(() => activeSession?.tags?.join(", ") || "");
  const [notes, setNotes] = useState(() => activeSession?.notes || "");
  const [type, setType] = useState("work");

  const handleStart = () => {
    startSession(
      type,
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
        <p className="text-slate-400">Track your work with precision</p>
      </div>

      <div className="bg-gradient-to-br from-slate-900 to-slate-900/50 border border-slate-800 rounded-2xl p-10 text-center">
        {/* Timer display */}
        <div className="relative inline-block mb-6">
          <div className="w-64 h-64 rounded-full border-4 border-slate-800 flex items-center justify-center relative">
            {activeSession && (
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="128"
                  cy="128"
                  r="124"
                  fill="none"
                  stroke="url(#timerGrad)"
                  strokeWidth="4"
                  strokeDasharray={`${((elapsed % 3600000) / 3600000) * 779} 779`}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="timerGrad">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                </defs>
              </svg>
            )}
            <div>
              <div className="font-mono text-5xl font-bold">
                {formatDuration(activeSession ? elapsed : 0)}
              </div>
              <div className="text-xs uppercase tracking-widest text-slate-400 mt-2">
                {activeSession ? activeSession.type : "Ready"}
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        {!activeSession ? (
          <div className="space-y-4 max-w-md mx-auto">
            <div className="flex gap-2 bg-slate-800/50 p-1 rounded-xl">
              <button
                onClick={() => setType("work")}
                className={`flex-1 py-2 rounded-lg font-medium text-sm ${type === "work" ? "bg-indigo-500 text-white" : "text-slate-400"}`}
              >
                💼 Work
              </button>
              <button
                onClick={() => setType("break")}
                className={`flex-1 py-2 rounded-lg font-medium text-sm ${type === "break" ? "bg-amber-500 text-white" : "text-slate-400"}`}
              >
                ☕ Break
              </button>
            </div>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Tags (comma separated)"
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
            />
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What are you working on?"
              rows={2}
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-indigo-500 resize-none"
            />
            <button
              onClick={handleStart}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30"
            >
              <Icon path={ICONS.play} size={18} /> Start Session
            </button>
          </div>
        ) : (
          <div className="space-y-4 max-w-md mx-auto">
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Tags"
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
            />
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes..."
              rows={2}
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-indigo-500 resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={pauseSession}
                className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 font-semibold flex items-center justify-center gap-2"
              >
                <Icon path={ICONS.stop} size={18} /> Stop Session
              </button>
              <button
                onClick={saveSessionNotes}
                className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 font-semibold flex items-center justify-center gap-2"
              >
                <Icon path={ICONS.check} size={18} /> Save Notes
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Started at {formatTime(activeSession.start)}
            </p>
          </div>
        )}
      </div>

      {/* Today's sessions */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
        <h3 className="font-semibold mb-4">Today's Sessions</h3>
        {todaySessions.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-6">
            No completed sessions yet
          </p>
        ) : (
          <div className="space-y-2">
            {todaySessions.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl"
              >
                <div
                  className={`w-2 h-8 rounded ${s.type === "work" ? "bg-indigo-400" : "bg-amber-400"}`}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {s.notes || s.tags?.[0] || s.type}
                    </span>
                    {s.tags?.map((t) => (
                      <span
                        key={t}
                        className="text-xs px-2 py-0.5 bg-slate-700 rounded-full text-slate-300"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="text-xs text-slate-500">
                    {formatTime(s.start)} - {formatTime(s.end)}
                  </div>
                </div>
                <div className="font-mono text-sm">
                  {formatDuration(s.duration)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============ SESSIONS VIEW ============
function SessionsView({ data, deleteSession, updateSession }) {
  const [filter, setFilter] = useState("all");
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
        <p className="text-slate-400">All your tracked time</p>
      </div>

      <div className="flex gap-3 items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search sessions..."
          className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
        />
        <div className="flex gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
          {["all", "work", "break"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-sm capitalize ${filter === f ? "bg-indigo-500 text-white" : "text-slate-400"}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {Object.keys(grouped).length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Icon path={ICONS.list} size={40} className="text-slate-600 mb-4" />
            <h3 className="text-xl font-semibold text-slate-300 mb-2">
              {data.sessions.length === 0
                ? "No sessions yet"
                : "No matching sessions"}
            </h3>
            <p className="text-slate-500 max-w-sm">
              {data.sessions.length === 0
                ? "Start your first work session from the Timer or Dashboard to begin tracking your time."
                : "Try adjusting your search or filter to find what you're looking for."}
            </p>
          </div>
        )}
        {Object.entries(grouped).map(([date, sessions]) => {
          const dayWork = sessions
            .filter((s) => s.type === "work")
            .reduce((a, s) => a + (s.duration || 0), 0);
          return (
            <div key={date}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">
                  {date}{" "}
                  {isToday(sessions[0].start) && (
                    <span className="text-xs text-indigo-400 ml-2">Today</span>
                  )}
                </h3>
                <span className="text-sm text-slate-400">
                  {(dayWork / 3600000).toFixed(1)}h work
                </span>
              </div>
              <div className="space-y-2">
                {sessions.map((s) => (
                  <motion.div
                    key={s.id}
                    layout
                    className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex items-center gap-4"
                  >
                    <div
                      className={`w-1 self-stretch rounded ${s.type === "work" ? "bg-indigo-400" : "bg-amber-400"}`}
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
                            className="w-full px-3 py-1.5 bg-slate-800 rounded text-sm"
                            placeholder="Notes"
                          />
                          <input
                            value={editData.tags || ""}
                            onChange={(e) =>
                              setEditData({ ...editData, tags: e.target.value })
                            }
                            className="w-full px-3 py-1.5 bg-slate-800 rounded text-sm"
                            placeholder="Tags"
                          />
                        </div>
                      ) : (
                        <>
                          <p className="font-medium">
                            {s.notes || "Untitled session"}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-slate-400">
                              {formatTime(s.start)} - {formatTime(s.end)}
                            </span>
                            {s.tags?.map((t) => (
                              <span
                                key={t}
                                className="text-xs px-2 py-0.5 bg-slate-800 rounded-full text-slate-300"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                    <div className="font-mono text-sm text-slate-300">
                      {formatDuration(s.duration)}
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
                        className="p-2 rounded-lg hover:bg-slate-800 text-slate-400"
                      >
                        <Icon path={ICONS.edit} size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => deleteSession(s.id)}
                      className="p-2 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400"
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
function GitView({ data, addCommit, setData, showToast }) {
  const [username, setUsername] = useState(data.settings.githubUser || "");
  const [token, setToken] = useState(data.settings.githubToken || "");
  const [loading, setLoading] = useState(false);
  const [manualCommit, setManualCommit] = useState({
    sha: "",
    message: "",
    repo: "",
  });

  const fetchCommits = async () => {
    if (!username) {
      showToast("Enter GitHub username", "error");
      return;
    }
    setLoading(true);
    try {
      const headers = token ? { Authorization: `token ${token}` } : {};
      const res = await fetch(
        `https://api.github.com/users/${username}/events`,
        { headers },
      );
      if (res.status === 401) throw new Error("Invalid GitHub token — check your settings");
      if (res.status === 403) throw new Error("API rate limited — try again later or add a personal access token");
      if (res.status === 404) throw new Error("GitHub user not found — check the username");
      if (!res.ok) throw new Error(`GitHub API error (${res.status})`);
      const events = await res.json();
      const commits = events
        .filter((e) => e.type === "PushEvent")
        .flatMap((e) =>
          (e.payload.commits || []).map((c) => ({
            sha: c.sha.substring(0, 7),
            message: c.message.split("\n")[0],
            repo: e.repo.name,
            timestamp: new Date(e.created_at).getTime(),
          })),
        )
        .slice(0, 50);
      setData((d) => ({
        ...d,
        commits,
        settings: { ...d.settings, githubUser: username, githubToken: token },
      }));
      showToast(`Fetched ${commits.length} commits`);
    } catch (err) {
      showToast(err.message || "Failed to fetch commits. Check your connection.", "error");
    }
    setLoading(false);
  };

  const addManual = () => {
    if (!manualCommit.message) return;
    const sha = manualCommit.sha.trim();
    addCommit({
      sha: sha || "manual",
      message: manualCommit.message,
      repo: manualCommit.repo || "manual",
      timestamp: Date.now(),
    });
    setManualCommit({ sha: "", message: "", repo: "" });
    showToast("Commit added");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Git Integration</h2>
        <p className="text-slate-400">Sync your GitHub commits automatically</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Icon path={ICONS.github} size={18} /> GitHub Sync
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400">GitHub Username</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full mt-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">
                Personal Access Token (optional)
              </label>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="ghp_..."
                className="w-full mt-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <button
              onClick={fetchCommits}
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
            >
              <Icon
                path={ICONS.refresh}
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              {loading ? "Fetching..." : "Sync Commits"}
            </button>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Icon path={ICONS.plus} size={18} /> Manual Commit
          </h3>
          <div className="space-y-3">
            <input
              value={manualCommit.repo}
              onChange={(e) =>
                setManualCommit({ ...manualCommit, repo: e.target.value })
              }
              placeholder="Repository"
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
            />
            <input
              value={manualCommit.message}
              onChange={(e) =>
                setManualCommit({ ...manualCommit, message: e.target.value })
              }
              placeholder="Commit message"
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
            />
            <input
              value={manualCommit.sha}
              onChange={(e) =>
                setManualCommit({ ...manualCommit, sha: e.target.value })
              }
              placeholder="SHA (optional)"
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={addManual}
              className="w-full py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 font-medium"
            >
              Add Commit
            </button>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
        <h3 className="font-semibold mb-4">Commits ({data.commits.length})</h3>
        <div className="space-y-2 max-h-[500px] overflow-auto">
          {data.commits.length === 0 ? (
            <p className="text-slate-500 text-center py-8">
              No commits yet. Sync with GitHub or add manually.
            </p>
          ) : (
            data.commits.map((c, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-xl"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon path={ICONS.code} size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-xs text-emerald-400 mb-0.5">
                    {c.sha}
                  </p>
                  <p className="text-sm">{c.message}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {c.repo} · {formatDate(c.timestamp)}{" "}
                    {formatTime(c.timestamp)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ============ ANALYTICS VIEW ============
function AnalyticsView({ data }) {
  const [range, setRange] = useState("week");
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
        .reduce((a, s) => a + s.duration, 0);
      arr.push({
        day:
          range === "week"
            ? dayName(dayStart)
            : `${new Date(dayStart).getDate()}/${new Date(dayStart).getMonth() + 1}`,
        hours: +(work / 3600000).toFixed(2),
        date: dayStart,
      });
    }
    return arr;
  }, [data.sessions, range, now]);

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
          tagBreakdown[t] = (tagBreakdown[t] || 0) + s.duration;
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
        hourly[h] += s.duration;
      });
    const hourlyData = hourly.map((v, i) => ({
      hour: `${i}:00`,
      minutes: +(v / 60000).toFixed(0),
    }));

    return { tagData, hourlyData };
  }, [data.sessions, range, now]);

  const COLORS = [
    "#6366f1",
    "#a855f7",
    "#ec4899",
    "#f59e0b",
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
          <Icon path={ICONS.chart} size={40} className="text-slate-600 mb-4" />
          <h3 className="text-xl font-semibold text-slate-300 mb-2">
            No data yet
          </h3>
          <p className="text-slate-500 max-w-sm">
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
          <p className="text-slate-400">
            Deep insights into your work patterns
          </p>
        </div>
        <div className="flex gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
          {["week", "month", "year"].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-4 py-1.5 rounded-lg text-sm capitalize ${range === r ? "bg-indigo-500 text-white" : "text-slate-400"}`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
          <p className="text-xs text-slate-400 uppercase">Total</p>
          <p className="text-3xl font-bold mt-1">
            {totalHrs.toFixed(1)}
            <span className="text-lg text-slate-400">h</span>
          </p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
          <p className="text-xs text-slate-400 uppercase">Daily Avg</p>
          <p className="text-3xl font-bold mt-1">
            {avgHrs}
            <span className="text-lg text-slate-400">h</span>
          </p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
          <p className="text-xs text-slate-400 uppercase">Peak Day</p>
          <p className="text-3xl font-bold mt-1">
            {maxDay.toFixed(1)}
            <span className="text-lg text-slate-400">h</span>
          </p>
        </div>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
        <h3 className="font-semibold mb-4">Work Hours Over Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={rangeData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
            <YAxis stroke="#64748b" fontSize={11} />
            <Tooltip
              contentStyle={{
                background: "#0f172a",
                border: "1px solid #334155",
                borderRadius: 8,
              }}
            />
            <Line
              type="monotone"
              dataKey="hours"
              stroke="#6366f1"
              strokeWidth={2}
              dot={{ fill: "#6366f1", r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
          <h3 className="font-semibold mb-4">Work by Tag</h3>
          {tagData.length === 0 ? (
            <p className="text-slate-500 text-center py-8">
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
                    background: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: 8,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
          <h3 className="font-semibold mb-4">Peak Hours</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="hour"
                stroke="#64748b"
                fontSize={9}
                interval={2}
              />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip
                contentStyle={{
                  background: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: 8,
                }}
              />
              <Bar dataKey="minutes" fill="#a855f7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ============ EXPORT VIEW ============
function ExportView({ data, showToast }) {
  const [period, setPeriod] = useState("week");
  const [format, setFormat] = useState("xlsx");

  const exportExcel = () => {
    const days =
      period === "day"
        ? 1
        : period === "week"
          ? 7
          : period === "month"
            ? 30
            : 365;
    const cutoff = Date.now() - days * 86400000;

    const sessions = data.sessions
      .filter((s) => s.status === "completed" && s.start >= cutoff)
      .filter((s) => !s.id.startsWith("demo_"));
    const commits = (data.commits || []).filter((c) => c.timestamp >= cutoff);

    // Sheet 1: Executive Summary (smart boss-ready)
    const summary = [];
    for (let d = days - 1; d >= 0; d--) {
      const dayStart = startOfDay(Date.now()) - d * 86400000;
      const dayEnd = dayStart + 86400000;
      const daySessions = sessions.filter(
        (s) => s.start >= dayStart && s.start < dayEnd,
      );
      const work = daySessions.filter((s) => s.type === "work");
      const breaks = daySessions.filter((s) => s.type === "break");
      const firstStart = work[0]?.start;
      const lastEnd = work[work.length - 1]?.end;
      const workHrs = work.reduce((a, s) => a + s.duration, 0) / 3600000;
      const dayCommits = commits.filter(
        (c) => c.timestamp >= dayStart && c.timestamp < dayEnd,
      );

      summary.push({
        Date: formatDate(dayStart),
        Day: dayName(dayStart),
        "First Login": firstStart ? formatTime(firstStart) : "-",
        "Last Logout": lastEnd ? formatTime(lastEnd) : "-",
        Sessions: work.length,
        Breaks: breaks.length,
        "Work Hours": +workHrs.toFixed(2),
        "Break Hours": +(
          breaks.reduce((a, s) => a + s.duration, 0) / 3600000
        ).toFixed(2),
        Commits: dayCommits.length,
        Notes: sanitizeCell(
          work
            .map((s) => s.notes)
            .filter(Boolean)
            .join("; "),
        ),
      });
    }

    // Sheet 2: Detailed Intervals
    const intervals = sessions.map((s) => ({
      Date: formatDate(s.start),
      "Start Time": formatTime(s.start),
      "End Time": formatTime(s.end),
      "Duration (min)": +((s.duration || 0) / 60000).toFixed(1),
      Type: s.type,
      Tags: sanitizeCell((s.tags || []).join(", ")),
      Notes: sanitizeCell(s.notes || ""),
    }));

    // Sheet 3: Git Activity
    const gitSheet = commits.map((c) => ({
      Date: formatDate(c.timestamp),
      Time: formatTime(c.timestamp),
      Repository: sanitizeCell(c.repo),
      SHA: c.sha,
      Message: sanitizeCell(c.message),
    }));

    // Sheet 4: Totals
    const totals = [
      {
        Period: `Last ${period}`,
        "Total Work Hours": +summary
          .reduce((a, r) => a + r["Work Hours"], 0)
          .toFixed(2),
        "Total Break Hours": +summary
          .reduce((a, r) => a + r["Break Hours"], 0)
          .toFixed(2),
        "Avg Daily Hours": +(
          summary.reduce((a, r) => a + r["Work Hours"], 0) / days
        ).toFixed(2),
        "Total Sessions": summary.reduce((a, r) => a + r["Sessions"], 0),
        "Total Commits": summary.reduce((a, r) => a + r["Commits"], 0),
        "Exported On": new Date().toLocaleString(),
      },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(totals),
      "Summary",
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(summary),
      "Daily Overview",
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(intervals),
      "Detailed Intervals",
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(gitSheet),
      "Git Activity",
    );

    XLSX.writeFile(
      wb,
      `DevTrack_Report_${period}_${formatDate(Date.now()).replace(/\//g, "-")}.xlsx`,
    );
    showToast("Report exported!");
  };

  const exportCSV = () => {
    const days =
      period === "day"
        ? 1
        : period === "week"
          ? 7
          : period === "month"
            ? 30
            : 365;
    const cutoff = Date.now() - days * 86400000;
    const sessions = data.sessions
      .filter((s) => s.status === "completed" && s.start >= cutoff)
      .filter((s) => !s.id.startsWith("demo_"));

    const rows = [
      ["Date", "Start", "End", "Duration (min)", "Type", "Tags", "Notes"],
    ];
    sessions.forEach((s) => {
      rows.push([
        formatDate(s.start),
        formatTime(s.start),
        formatTime(s.end),
        +((s.duration || 0) / 60000).toFixed(1),
        s.type,
        (s.tags || []).join("; "),
        s.notes || "",
      ]);
    });
    const csv = rows
      .map((r) =>
        r
          .map((c) => `"${sanitizeCell(c).replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `DevTrack_${period}_${Date.now()}.csv`;
    a.click();
    showToast("CSV exported!");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Export Smart Report</h2>
        <p className="text-slate-400">
          Generate professional reports for your manager
        </p>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
        <h3 className="font-semibold mb-4">Report Configuration</h3>

        <div className="space-y-5">
          <div>
            <label className="text-xs text-slate-400 uppercase tracking-wide">
              Time Period
            </label>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {["day", "week", "month", "year"].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`py-3 rounded-xl text-sm capitalize font-medium ${period === p ? "bg-indigo-500 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 uppercase tracking-wide">
              Format
            </label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                onClick={() => setFormat("xlsx")}
                className={`py-3 rounded-xl text-sm font-medium ${format === "xlsx" ? "bg-emerald-500 text-white" : "bg-slate-800 text-slate-400"}`}
              >
                📊 Excel (.xlsx) — Recommended
              </button>
              <button
                onClick={() => setFormat("csv")}
                className={`py-3 rounded-xl text-sm font-medium ${format === "csv" ? "bg-emerald-500 text-white" : "bg-slate-800 text-slate-400"}`}
              >
                📄 CSV
              </button>
            </div>
          </div>

          <button
            onClick={format === "xlsx" ? exportExcel : exportCSV}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30"
          >
            <Icon path={ICONS.download} size={20} /> Generate & Download Report
          </button>
        </div>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
        <h3 className="font-semibold mb-4">📋 What's included in the Excel</h3>
        <div className="grid grid-cols-2 gap-4">
          {[
            {
              title: "Summary",
              desc: "Period totals, averages, export timestamp",
            },
            {
              title: "Daily Overview",
              desc: "First login, last logout, work/break hours per day",
            },
            {
              title: "Detailed Intervals",
              desc: "Every start/pause/resume with tags & notes",
            },
            {
              title: "Git Activity",
              desc: "All commits synced during the period",
            },
          ].map((s) => (
            <div key={s.title} className="p-4 bg-slate-800/50 rounded-xl">
              <p className="font-medium text-indigo-300">{s.title}</p>
              <p className="text-xs text-slate-400 mt-1">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============ SETTINGS MODAL ============
function SettingsModal({ open, onClose, data, updateSettings, setData }) {
  const [form, setForm] = useState(() => data.settings);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold">Settings</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-400">
              Daily Work Goal (hours)
            </label>
            <input
              type="number"
              value={form.dailyGoal || 8}
              onChange={(e) => setForm({ ...form, dailyGoal: +e.target.value })}
              className="w-full mt-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400">
              Idle Detection (minutes, 0=off)
            </label>
            <input
              type="number"
              value={form.idleMinutes || 10}
              onChange={(e) =>
                setForm({ ...form, idleMinutes: +e.target.value })
              }
              className="w-full mt-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                updateSettings(form);
                onClose();
              }}
              className="flex-1 py-2.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 font-medium"
            >
              Save
            </button>
            <button
              onClick={() => {
                if (confirm("Clear all data? This cannot be undone.")) {
                  localStorage.removeItem(STORAGE_KEY);
                  setData(DEFAULT_DATA);
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
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          className="fixed bottom-6 right-6 z-50 px-5 py-3 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl flex items-center gap-2"
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
  );
}
