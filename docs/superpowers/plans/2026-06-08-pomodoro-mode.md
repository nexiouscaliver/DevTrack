# Pomodoro Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Pomodoro timer mode to DevTrack that auto-cycles between configurable work/break intervals, integrated with the existing session system.

**Architecture:** A mode toggle inside the existing TimerView component. Pomodoro state managed via new `useState` hooks in `App()`. Auto-cycling uses an atomic `transitionPomodoroPhase()` function (not separate stop+start calls) to avoid React batching race conditions. All pomodoro work/break periods are real sessions tagged `"pomodoro"`.

**Tech Stack:** React 19, Tailwind CSS 3 (stone-* palette), Framer Motion, Vitest (for lint/test), Web Audio API + Notification API (browser-native, no new deps)

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `src/App.jsx` (line 40–252) | Modify | Add `skipForward`, `forward` icons to ICONS |
| `src/App.jsx` (line 420–442) | Modify | Add `pomodoro` to `DEFAULT_DATA.settings`, `timerMode` to `DEFAULT_DATA.ui` |
| `src/App.jsx` (line 458–516) | Modify | Add pomodoro field defaults in `sanitizeData` |
| `src/App.jsx` (line 518–562) | Modify | Add pomodoro settings migration in `migrate` |
| `src/App.jsx` (line 785–804) | Modify | Add pomodoro state hooks in `App()` |
| `src/App.jsx` (line ~1031) | Modify | Add pomodoro countdown + grace checks to timer tick |
| `src/App.jsx` (new, ~line 1085) | Insert | New pomodoro functions: `pomodoroElapsed` memo, `setTimerMode`, `startPomodoro`, `startBreakNow`, `transitionPomodoroPhase`, `handlePomodoroIntervalComplete`, `skipBreak`, `extendWork`, `playNotificationSound`, `pomodoroNotify` |
| `src/App.jsx` (line 1774–1788) | Modify | Pass new pomodoro props to `<TimerView>` |
| `src/App.jsx` (line 2205–2600) | Modify | TimerView: mode toggle, countdown, counter, grace UI, skip/extend |
| `src/App.jsx` (line 4719–4954) | Modify | SettingsModal: add Pomodoro settings section |

---

### Task 1: Data Model — DEFAULT_DATA, sanitizeData, migrate

**Files:**
- Modify: `src/App.jsx:420–442` (DEFAULT_DATA)
- Modify: `src/App.jsx:498–507` (sanitizeData settings)
- Modify: `src/App.jsx:518–562` (migrate)

- [ ] **Step 1: Add pomodoro to DEFAULT_DATA.settings and timerMode to DEFAULT_DATA.ui**

In `src/App.jsx`, find the `DEFAULT_DATA` object (line 420) and replace the entire object:

```javascript
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
    pomodoro: {
      workInterval: 25,
      breakInterval: 5,
      autoStartBreak: true,
      notifications: true,
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
    timerMode: "free",
  },
};
```

- [ ] **Step 2: Add pomodoro defaults to sanitizeData**

Find the `settings:` block inside `sanitizeData()` (line 498–507). Replace the entire `settings:` block:

```javascript
    settings: {
      dailyGoal: data.settings?.dailyGoal ?? 8,
      trackedRepos: Array.isArray(data.settings?.trackedRepos)
        ? data.settings.trackedRepos
        : [],
      gitAuthors: data.settings?.gitAuthors ?? {
        identities: [],
        autoDetected: null,
      },
      pomodoro: {
        workInterval: typeof data.settings?.pomodoro?.workInterval === "number"
          ? Math.max(1, Math.min(120, data.settings.pomodoro.workInterval))
          : 25,
        breakInterval: typeof data.settings?.pomodoro?.breakInterval === "number"
          ? Math.max(1, Math.min(60, data.settings.pomodoro.breakInterval))
          : 5,
        autoStartBreak: data.settings?.pomodoro?.autoStartBreak ?? true,
        notifications: data.settings?.pomodoro?.notifications ?? true,
      },
    },
```

- [ ] **Step 3: Add pomodoro migration**

Inside the `migrate()` function (line 518), just before the final `return parsed;` (line 562), add:

```javascript
  // Add pomodoro settings if missing
  if (!parsed.settings.pomodoro) {
    parsed.settings.pomodoro = {
      workInterval: 25,
      breakInterval: 5,
      autoStartBreak: true,
      notifications: true,
    };
  }
  // Add timerMode UI pref if missing
  if (!parsed.ui) parsed.ui = {};
  if (!parsed.ui.timerMode) parsed.ui.timerMode = "free";
```

- [ ] **Step 4: Run lint**

Run: `npm run lint`
Expected: PASS (no new lint errors)

- [ ] **Step 5: Commit**

```bash
git add src/App.jsx
git commit -m "feat(pomodoro): add data model, defaults, sanitize, and migrate"
```

---

### Task 2: Add New Icons

**Files:**
- Modify: `src/App.jsx:40–252` (ICONS map)

- [ ] **Step 1: Add skipForward and forward icons**

Find the `ICONS` object (line 40). After the `flag` entry (around line 251, before the closing `};`), add these two new entries:

```javascript
  forward: (
    <>
      <polygon points="5 4 15 12 5 20 5 4" />
      <line x1="19" y1="5" x2="19" y2="19" />
    </>
  ),
  skipForward: (
    <>
      <polygon points="5 4 15 12 5 20 5 4" />
      <line x1="19" y1="5" x2="19" y2="19" />
      <line x1="15" y1="5" x2="15" y2="19" />
    </>
  ),
```

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/App.jsx
git commit -m "feat(pomodoro): add forward and skipForward icons"
```

---

### Task 3: Add Pomodoro State Hooks and Mount Recovery

**Files:**
- Modify: `src/App.jsx:785–804` (App state hooks)

- [ ] **Step 1: Add new state hooks after existing state declarations**

Find the line with `const [serverStatus, setServerStatus] = useState("connected");` (around line 799). After the line with `const saveTimer = useRef(null);` (around line 804), add:

```javascript
  // --- Pomodoro state ---
  // pomodoroCycle is derived from sessions (auto-resets on new day)
  const pomodoroCycle = useMemo(() => {
    return (data.sessions || []).filter(
      (s) => isToday(s.start) && s.status === "completed" && s.type === "work" && (s.tags || []).includes("pomodoro"),
    ).length;
  }, [data.sessions]);
  const [pomodoroPhase, setPomodoroPhase] = useState(() => {
    const timerMode = initialData?.ui?.timerMode;
    if (timerMode !== "pomodoro") return null;
    const running = (initialData?.sessions || []).find(
      (s) => s.status === "running" || s.status === "paused",
    );
    if (!running || !(running.tags || []).includes("pomodoro")) return null;
    return running.type === "work" ? "work" : "break";
  });
  const [pomodoroTarget, setPomodoroTarget] = useState(() => {
    if (pomodoroPhase === null) return null;
    const settings = initialData?.settings?.pomodoro;
    const interval = pomodoroPhase === "work"
      ? (settings?.workInterval ?? 25)
      : (settings?.breakInterval ?? 5);
    return interval * 60000;
  });
  const [graceEnd, setGraceEnd] = useState(null);
  const pomodoroTargetRef = useRef(pomodoroTarget);
  pomodoroTargetRef.current = pomodoroTarget;
  const pomodoroPhaseRef = useRef(pomodoroPhase);
  pomodoroPhaseRef.current = pomodoroPhase;
```

Note: `pomodoroCycle` is now a `useMemo` derived from `data.sessions` — it auto-resets when a new day starts because `isToday()` checks the current date. No manual reset needed. `pomodoroPhase` and `pomodoroTarget` initializers use the hook order correctly. Both refs (`pomodoroTargetRef`, `pomodoroPhaseRef`) are declared together.

- [ ] **Step 2: Add pomodoroElapsed useMemo**

After the new state hooks, add a `useMemo` that computes actual work-time for pomodoro countdown (handles pause semantics correctly):

```javascript
  // Custom elapsed for pomodoro: work-time only, ignores current pause
  const pomodoroElapsed = useMemo(() => {
    if (!activeSession || pomodoroPhase !== "work") return elapsed;
    const pauses = activeSession.pauses || [];
    const completedPauseTime = pauses
      .filter((p) => p.end !== null)
      .reduce((sum, p) => sum + (p.end - p.start), 0);
    const effectiveNow =
      activeSession.status === "paused" && pauses.length > 0
        ? pauses[pauses.length - 1].start
        : Date.now();
    return Math.max(0, effectiveNow - activeSession.start - completedPauseTime);
  }, [activeSession, elapsed, pomodoroPhase]);
```

- [ ] **Step 3: Run lint**

Run: `npm run lint`
Expected: PASS (may have unused variable warnings for new hooks — these will be used in later tasks)

- [ ] **Step 4: Commit**

```bash
git add src/App.jsx
git commit -m "feat(pomodoro): add state hooks, mount recovery, and custom elapsed computation"
```

---

### Task 4: Core Pomodoro Functions in App()

**Files:**
- Modify: `src/App.jsx` — insert new functions after `showToast` (line 1083), before `startSession` (line 1085)

- [ ] **Step 1: Add playNotificationSound function**

Insert before `startSession` (line 1085):

```javascript
  // --- Pomodoro notification sound (Web Audio API, 440Hz sine, 200ms) ---
  const playNotificationSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 440;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch {
      // AudioContext not available — silent fallback
    }
  }, []);

  // --- Pomodoro notification (toast + browser notification + sound) ---
  const pomodoroNotify = useCallback((message, type = "success") => {
    showToast(message, type);
    const settings = dataRef.current.settings?.pomodoro;
    if (settings?.notifications) {
      playNotificationSound();
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        try {
          const n = new Notification("DevTrack — Pomodoro", {
            body: message.replace(/🍅\s*/g, ""),
            silent: true,
          });
          n.onclick = () => { window.focus(); n.close(); };
        } catch {
          // Notification API not available
        }
      }
    }
  }, [showToast, playNotificationSound]);
```

- [ ] **Step 2: Add setTimerMode function**

```javascript
  // --- Pomodoro mode toggle ---
  const setTimerMode = useCallback((mode) => {
    setData((d) => ({ ...d, ui: { ...d.ui, timerMode: mode } }));
  }, []);
```

- [ ] **Step 3: Add transitionPomodoroPhase — atomic stop+start for pomodoro cycling**

This is the critical function that replaces separate `stopSession()` + `startSession()` calls to avoid React batching race conditions:

```javascript
  // --- Atomic pomodoro phase transition (avoids React batching issues) ---
  // NOTE: State setters are intentionally nested inside setActiveSession's updater
  // callback to ensure atomicity — all state changes happen in a single React batch.
  const transitionPomodoroPhase = useCallback((fromPhase, toPhase, toType) => {
    const now = Date.now();

    // 1. Complete the current session (inline, like stopSession but without git sync or toast)
    setActiveSession((current) => {
      if (!current) return null;
      let pauses = current.pauses || [];
      if (current.status === "paused" && pauses.length > 0) {
        pauses = pauses.map((p, i) =>
          i === pauses.length - 1 && p.end === null ? { ...p, end: now } : p,
        );
      }
      const totalDuration = now - current.start;
      const totalBreakTime = pauses.reduce((s, p) => s + ((p.end || now) - p.start), 0);
      const totalWorkTime = totalDuration - totalBreakTime;
      const completed = {
        ...current,
        end: now,
        duration: totalDuration,
        totalWorkTime,
        totalBreakTime,
        pauses,
        status: "completed",
      };

      // 2. Create the next session
      const nextSession = {
        id: `s_${now}`,
        type: toType,
        start: now,
        end: null,
        duration: 0,
        tags: ["pomodoro"],
        notes: "",
        status: "running",
        pauses: [],
        checkpoints: [],
      };

      // 3. Update data.sessions in a single setData call
      setData((d) => ({
        ...d,
        sessions: d.sessions.map((s) => (s.id === current.id ? completed : s)).concat(nextSession),
      }));

      // 4. Update pomodoro state
      // Increment cycle when a WORK interval COMPLETES (not when next work starts)
      // Note: pomodoroCycle is a useMemo, so we don't need to increment it here —
      // it derives from data.sessions which will update via setData above.
      // However, the new session won't be in data.sessions yet (React batching),
      // so we DON'T try to set it. The useMemo will pick up the completed work
      // session after the next render.
      setPomodoroPhase(toPhase === "grace" ? "grace" : toType === "work" ? "work" : "break");
      if (toPhase === "grace") {
        setGraceEnd(Date.now() + 30000);
        setPomodoroTarget(null);
      } else {
        setGraceEnd(null);
        const settings = dataRef.current.settings?.pomodoro;
        const interval = toType === "work"
          ? (settings?.workInterval ?? 25)
          : (settings?.breakInterval ?? 5);
        setPomodoroTarget(interval * 60000);
      }
      setElapsed(0);

      return nextSession;
    });
  }, []);
```

- [ ] **Step 4: Add handlePomodoroIntervalComplete**

```javascript
  // --- Handle pomodoro interval completion ---
  const handlePomodoroIntervalComplete = useCallback(() => {
    const phase = dataRef.current.__pomodoroPhase;
    const settings = dataRef.current.settings?.pomodoro;

    if (phase === "work") {
      // Work interval done → transition to grace (or directly to break)
      pomodoroNotify("🍅 Work interval complete! Break in 30s...", "success");
      if (settings?.autoStartBreak !== false) {
        transitionPomodoroPhase("work", "grace", "break");
      } else {
        // No auto-start: complete work, prompt user
        // Just stop the session, let user manually start break
        setActiveSession((current) => {
          if (!current) return null;
          const now = Date.now();
          let pauses = current.pauses || [];
          if (current.status === "paused" && pauses.length > 0) {
            pauses = pauses.map((p, i) =>
              i === pauses.length - 1 && p.end === null ? { ...p, end: now } : p,
            );
          }
          const totalDuration = now - current.start;
          const totalBreakTime = pauses.reduce((s, p) => s + ((p.end || now) - p.start), 0);
          const completed = {
            ...current,
            end: now,
            duration: totalDuration,
            totalWorkTime: totalDuration - totalBreakTime,
            totalBreakTime,
            pauses,
            status: "completed",
          };
          setData((d) => ({
            ...d,
            sessions: d.sessions.map((s) => (s.id === current.id ? completed : s)),
          }));
          setPomodoroPhase(null);
          setPomodoroTarget(null);
          setGraceEnd(null);
          return null;
        });
      }
    } else if (phase === "break") {
      // Break done → stop, prompt user for next work
      pomodoroNotify("Break over — ready for the next pomodoro?", "info");
      setActiveSession((current) => {
        if (!current) return null;
        const now = Date.now();
        const totalDuration = now - current.start;
        const completed = {
          ...current,
          end: now,
          duration: totalDuration,
          totalWorkTime: 0,
          totalBreakTime: totalDuration,
          pauses: [],
          status: "completed",
        };
        setData((d) => ({
          ...d,
          sessions: d.sessions.map((s) => (s.id === current.id ? completed : s)),
        }));
        setPomodoroPhase(null);
        setPomodoroTarget(null);
        setGraceEnd(null);
        return null;
      });
    }
  }, [pomodoroNotify, transitionPomodoroPhase]);
```

**Important:** `handlePomodoroIntervalComplete` reads `pomodoroPhase` via a ref to avoid stale closures. Add a ref right after the state hook declarations from Task 3:

```javascript
  const pomodoroPhaseRef = useRef(pomodoroPhase);
  pomodoroPhaseRef.current = pomodoroPhase;
```

And update `handlePomodoroIntervalComplete` to use `pomodoroPhaseRef.current` instead of `dataRef.current.__pomodoroPhase`:

```javascript
    const phase = pomodoroPhaseRef.current;
```

- [ ] **Step 5: Add skipBreak and extendWork**

```javascript
  // --- Skip current break (end break session, go to prompt for next work) ---
  const skipBreak = useCallback(() => {
    if (pomodoroPhaseRef.current !== "break" && pomodoroPhaseRef.current !== "grace") return;

    if (pomodoroPhaseRef.current === "grace") {
      // Grace period — just reset grace state, the work session is already completed
      setGraceEnd(null);
      setPomodoroPhase(null);
      setPomodoroTarget(null);
      return;
    }

    // Actually in a break session — complete it
    setActiveSession((current) => {
      if (!current) return null;
      const now = Date.now();
      const totalDuration = now - current.start;
      const completed = {
        ...current,
        end: now,
        duration: totalDuration,
        totalWorkTime: 0,
        totalBreakTime: totalDuration,
        pauses: [],
        status: "completed",
      };
      setData((d) => ({
        ...d,
        sessions: d.sessions.map((s) => (s.id === current.id ? completed : s)),
      }));
      setPomodoroPhase(null);
      setPomodoroTarget(null);
      setGraceEnd(null);
      return null;
    });
  }, []);

  // --- Extend current work interval by 5 minutes ---
  const extendWork = useCallback(() => {
    if (pomodoroPhaseRef.current !== "work") return;
    setPomodoroTarget((prev) => (prev ? prev + 5 * 60000 : null));
  }, []);
```

- [ ] **Step 6: Add pomodoro cleanup effect for stopSession/midnight edge cases**

The existing `stopSession` (line 1176) does not know about pomodoro state. When a user manually stops, or when the stale-session midnight auto-complete fires (line 759), pomodoro state must be reset. Add this `useEffect` after the pomodoro functions:

```javascript
  // --- Pomodoro cleanup: reset phase when active session is cleared ---
  // Handles: manual stop, midnight stale-session auto-complete, any path that sets activeSession to null
  useEffect(() => {
    if (!activeSession && pomodoroPhaseRef.current) {
      setPomodoroPhase(null);
      setPomodoroTarget(null);
      setGraceEnd(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSession]);
```

This effect watches `activeSession`. When it becomes `null` (from any source) and we were in a pomodoro phase, the phase resets automatically.

- [ ] **Step 7: Run lint**

Run: `npm run lint`
Expected: PASS (may warn about unused functions — they'll be used in later tasks)

- [ ] **Step 8: Commit**

```bash
git add src/App.jsx
git commit -m "feat(pomodoro): add core functions — transition, notify, skip, extend"
```

---

### Task 5: Modify Timer Tick useEffect

**Files:**
- Modify: `src/App.jsx:1031–1037` (timer tick useEffect)

- [ ] **Step 1: Add pomodoro countdown and grace period checks to the timer tick**

Find the timer tick `useEffect` (line 1031):

```javascript
  useEffect(() => {
    if (!activeSession || activeSession.status === "completed") return;
    const tick = () => setElapsed(computeElapsed(activeSession));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [activeSession]);
```

Replace with:

```javascript
  useEffect(() => {
    if (!activeSession || activeSession.status === "completed") return;
    const tick = () => {
      setElapsed(computeElapsed(activeSession));

      // Pomodoro countdown check
      const phase = pomodoroPhaseRef.current;
      if (phase === "work") {
        const target = pomodoroTargetRef.current;
        if (target) {
          const pauses = activeSession.pauses || [];
          const completedPauseTime = pauses
            .filter((p) => p.end !== null)
            .reduce((sum, p) => sum + (p.end - p.start), 0);
          const effectiveNow =
            activeSession.status === "paused" && pauses.length > 0
              ? pauses[pauses.length - 1].start
              : Date.now();
          const workElapsed = Math.max(0, effectiveNow - activeSession.start - completedPauseTime);
          if (workElapsed >= target) {
            handlePomodoroIntervalComplete();
          }
        }
      } else if (phase === "break") {
        const target = pomodoroTargetRef.current;
        if (target && computeElapsed(activeSession) >= target) {
          handlePomodoroIntervalComplete();
        }
      } else if (phase === "grace") {
        const end = graceEnd;
        if (end && Date.now() >= end) {
          // Grace expired — auto-start break using the atomic function
          startBreakNow();
        }
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSession, handlePomodoroIntervalComplete, startBreakNow, graceEnd]);
```

Note: The `graceEnd` dependency ensures the effect re-runs when grace starts/ends. The pomodoro refs (`pomodoroPhaseRef`, `pomodoroTargetRef`) are used inside the tick to read latest values without re-creating the interval.

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/App.jsx
git commit -m "feat(pomodoro): add countdown and grace period checks to timer tick"
```

---

### Task 6: Wire Pomodoro Props to TimerView

**Files:**
- Modify: `src/App.jsx:1774–1788` (TimerView JSX call)

- [ ] **Step 1: Add pomodoro props to the TimerView component call**

Find the `<TimerView` JSX (line 1774). Replace the entire call:

```jsx
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
                pomodoroPhase={pomodoroPhase}
                pomodoroCycle={pomodoroCycle}
                pomodoroTarget={pomodoroTarget}
                pomodoroElapsed={pomodoroElapsed}
                timerMode={data.ui?.timerMode || "free"}
                graceRemaining={graceEnd ? Math.max(0, Math.ceil((graceEnd - Date.now()) / 1000)) : null}
                setTimerMode={setTimerMode}
                skipBreak={skipBreak}
                extendWork={extendWork}
              />
            )}
```

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: PASS (may warn about unused props — TimerView will use them in next task)

- [ ] **Step 3: Commit**

```bash
git add src/App.jsx
git commit -m "feat(pomodoro): wire pomodoro props to TimerView component"
```

---

### Task 7: TimerView — Mode Toggle, Start Button, and Pomodoro Start

**Files:**
- Modify: `src/App.jsx:2205–2260` (TimerView function signature + handleStart)

- [ ] **Step 1: Update TimerView function signature to accept new props**

Find the `TimerView` function (line 2205). Replace the function signature:

```jsx
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
  pomodoroPhase,
  pomodoroCycle,
  pomodoroTarget,
  pomodoroElapsed,
  timerMode,
  graceRemaining,
  setTimerMode,
  skipBreak,
  extendWork,
}) {
```

- [ ] **Step 2: Update handleStart to support pomodoro mode**

Find `handleStart` (around line 2248). Replace it:

```javascript
  const handleStart = () => {
    if (timerMode === "pomodoro") {
      startSession(
        "work",
        ["pomodoro", ...tags.split(",").map((t) => t.trim()).filter(Boolean)],
        notes,
      );
      // Pomodoro phase/target will be set by the caller
      // We need to set it here since startSession doesn't know about pomodoro
    } else {
      startSession(
        "work",
        tags.split(",").map((t) => t.trim()).filter(Boolean),
        notes,
      );
    }
    setTags("");
    setNotes("");
  };
```

Wait — we need `setPomodoroPhase` and `setPomodoroTarget` accessible from TimerView. These are in App(). Let me add them as additional props or handle it differently.

Better approach: Pass a `startPomodoro` function from App() that wraps `startSession` and also sets pomodoro state. Or — simpler — add `setPomodoroPhase` and `setPomodoroTarget` as additional props.

Actually, the cleanest approach: wrap the pomodoro start logic in App() and pass it as a new prop `startPomodoro`. Add this function in App() alongside the other pomodoro functions:

```javascript
  // --- Start a pomodoro work session ---
  const startPomodoro = useCallback((tags = [], notes = "") => {
    startSession("work", ["pomodoro", ...tags], notes);
    // startSession may auto-close existing session — that's fine
    const settings = dataRef.current.settings?.pomodoro;
    setPomodoroPhase("work");
    setPomodoroTarget((settings?.workInterval ?? 25) * 60000);
    setGraceEnd(null);
  }, [startSession]);
```

Add `startPomodoro` to the TimerView props (both the call site and the function signature), and update `handleStart`:

```javascript
  const handleStart = () => {
    const parsedTags = tags.split(",").map((t) => t.trim()).filter(Boolean);
    if (timerMode === "pomodoro") {
      startPomodoro(parsedTags, notes);
    } else {
      startSession("work", parsedTags, notes);
    }
    setTags("");
    setNotes("");
  };
```

- [ ] **Step 3: Update the header area with mode toggle**

Find the TimerView header area (around line 2339):

```jsx
      <div>
        <h2 className="text-2xl font-bold">Focus Timer</h2>
        <p className="text-stone-400">One session. Pause when you need a break. Stop when you&apos;re done.</p>
      </div>
```

Replace with:

```jsx
      <div>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-2xl font-bold">Focus Timer</h2>
          {!activeSession && (
            <div className="flex bg-stone-800 rounded-lg p-0.5 text-xs">
              <button
                onClick={() => setTimerMode("free")}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  timerMode === "free"
                    ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-sm"
                    : "text-stone-400 hover:text-stone-200"
                }`}
              >
                Free Timer
              </button>
              <button
                onClick={() => setTimerMode("pomodoro")}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  timerMode === "pomodoro"
                    ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-sm"
                    : "text-stone-400 hover:text-stone-200"
                }`}
              >
                🍅 Pomodoro
              </button>
            </div>
          )}
        </div>
        <p className="text-stone-400">
          {timerMode === "pomodoro"
            ? "Work in focused intervals with automatic break cycling."
            : "One session. Pause when you need a break. Stop when you're done."}
        </p>
      </div>
```

- [ ] **Step 4: Update start button text for pomodoro mode**

Find the "Start Work Session" button (around line 2448–2453). Change the button text:

```jsx
                <button
                  onClick={handleStart}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all"
                >
                  <Icon path={ICONS.play} size={16} />
                  {timerMode === "pomodoro" ? "Start Pomodoro" : "Start Work Session"}
                </button>
```

- [ ] **Step 5: Run lint**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/App.jsx
git commit -m "feat(pomodoro): add mode toggle, start button, and pomodoro start to TimerView"
```

---

### Task 8: TimerView — Countdown Display, Counter, and Status Badge

**Files:**
- Modify: `src/App.jsx:2345–2422` (timer ring area in TimerView)

- [ ] **Step 1: Update status badge to show pomodoro indicator**

Find the status badge section (around line 2347–2358). Replace:

```jsx
            {activeSession && (
              <div className="mb-5">
                <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide ${
                  isPaused
                    ? "bg-sky-500/15 text-sky-300 border border-sky-500/30"
                    : "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                }`}>
                  <span className={`w-2 h-2 rounded-full ${isPaused ? "bg-sky-400" : "bg-emerald-400 animate-pulse"}`} />
                  {timerMode === "pomodoro" && pomodoroPhase && "🍅 "}
                  {pomodoroPhase === "grace"
                    ? "Break Starting..."
                    : isPaused
                      ? "On Break"
                      : "Working"}
                </span>
              </div>
            )}
```

- [ ] **Step 2: Update timer display to show countdown in pomodoro mode**

Find the timer display section (around line 2361–2394 — the `w-48 h-48` div and its contents). Replace the inner content:

```jsx
            {/* Timer display */}
            <div className="relative inline-block mb-6">
              <div className={`w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 rounded-full flex items-center justify-center relative`}>
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 256 256">
                  <circle cx="128" cy="128" r="110" fill="none" stroke="#292524" strokeWidth="6" />
                  {activeSession && (() => {
                    const isPomodoro = timerMode === "pomodoro" && pomodoroPhase;
                    const progress = isPomodoro && pomodoroTarget
                      ? Math.min((pomodoroElapsed / pomodoroTarget) * 691, 691)
                      : Math.min(((displayWorkTime) / ((data.settings.dailyGoal || 8) * 3600000)) * 691, 691);
                    return (
                      <circle
                        cx="128" cy="128" r="110" fill="none"
                        stroke={isPaused || pomodoroPhase === "break" ? "url(#timerBreakGrad)" : "url(#timerGrad)"}
                        strokeWidth="6"
                        strokeDasharray={`${progress} 691`}
                        strokeLinecap="round"
                      />
                    );
                  })()}
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
                  {(() => {
                    const isPomodoro = timerMode === "pomodoro" && pomodoroPhase;
                    if (isPomodoro && pomodoroTarget) {
                      const remaining = Math.max(0, pomodoroTarget - pomodoroElapsed);
                      return (
                        <>
                          <div className="font-mono text-2xl sm:text-3xl font-bold">
                            {formatDuration(remaining)}
                          </div>
                          <div className="text-xs uppercase tracking-widest text-stone-400 mt-2">
                            {pomodoroPhase === "grace" ? "Starting break..." : pomodoroPhase === "work" ? "Work" : "Break"}
                          </div>
                          <div className="text-[10px] text-stone-600 mt-1">
                            Elapsed: {formatDuration(pomodoroElapsed)}
                          </div>
                        </>
                      );
                    }
                    return (
                      <>
                        <div className="font-mono text-2xl sm:text-3xl font-bold">
                          {!activeSession ? "00:00:00" : formatDuration(displayWorkTime)}
                        </div>
                        <div className="text-xs uppercase tracking-widest text-stone-400 mt-2">
                          {!activeSession ? "Ready" : isPaused ? "Work Time" : "Elapsed"}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
```

- [ ] **Step 3: Add pomodoro counter pips below the timer ring**

After the timer display div and the break timer section (after the `{isPaused && (` block, around line 2411), and before the pauses taken indicator, add:

```jsx
            {/* Pomodoro counter — completed intervals today */}
            {timerMode === "pomodoro" && pomodoroCycle > 0 && (
              <div className="mb-5 flex items-center justify-center gap-1.5">
                {Array.from({ length: Math.min(pomodoroCycle, 8) }).map((_, i) => (
                  <motion.span
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-2.5 h-2.5 rounded-full bg-amber-400"
                  />
                ))}
                {pomodoroCycle > 8 && (
                  <span className="text-xs text-amber-400 font-medium ml-1">+{pomodoroCycle - 8}</span>
                )}
              </div>
            )}
```

- [ ] **Step 4: Run lint**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/App.jsx
git commit -m "feat(pomodoro): add countdown display, progress ring, and pomodoro counter"
```

---

### Task 9: TimerView — Grace Period UI and Skip/Extend Buttons

**Files:**
- Modify: `src/App.jsx` — TimerView control buttons area (around line 2424–2590)

- [ ] **Step 1: Add grace period UI**

After the pomodoro counter and before the main controls section (the `{!activeSession ? (` block), add:

```jsx
            {/* Grace period countdown — pomodoro mode */}
            {timerMode === "pomodoro" && pomodoroPhase === "grace" && graceRemaining !== null && graceRemaining > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 p-3 px-5 rounded-xl bg-amber-500/10 border border-amber-500/20 inline-flex items-center gap-4"
              >
                <div className="text-center">
                  <div className="text-[10px] text-amber-400/70 font-medium uppercase tracking-wider">Break in</div>
                  <div className="font-mono text-lg font-bold text-amber-300">{graceRemaining}s</div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      // Start break immediately
                      const now = Date.now();
                      const settings = data.settings?.pomodoro;
                      const interval = (settings?.breakInterval ?? 5) * 60000;
                      const breakSession = {
                        id: `s_${now}`,
                        type: "break",
                        start: now,
                        end: null,
                        duration: 0,
                        tags: ["pomodoro"],
                        notes: "",
                        status: "running",
                        pauses: [],
                        checkpoints: [],
                      };
                      setActiveSession(breakSession);
                      setData((d) => ({ ...d, sessions: [...d.sessions, breakSession] }));
                      showToast("Break started", "info");
                    }}
                    className="px-3 py-1.5 rounded-lg bg-sky-500/20 text-sky-300 text-xs font-medium hover:bg-sky-500/30 flex items-center gap-1"
                  >
                    <Icon path={ICONS.play} size={12} /> Start Break Now
                  </button>
                  <button
                    onClick={skipBreak}
                    className="px-3 py-1.5 rounded-lg bg-stone-700/50 text-stone-300 text-xs font-medium hover:bg-stone-700 flex items-center gap-1"
                  >
                    <Icon path={ICONS.skipForward} size={12} /> Skip Break
                  </button>
                </div>
              </motion.div>
            )}
```

Wait — the "Start Break Now" button directly manipulates state but needs access to `setActiveSession` and `setData` which aren't props of TimerView. We need to pass a `startBreakNow` function from App() instead.

Add to App() pomodoro functions:

```javascript
  // --- Start break immediately (called from grace period UI) ---
  const startBreakNow = useCallback(() => {
    const now = Date.now();
    const settings = dataRef.current.settings?.pomodoro;
    const interval = (settings?.breakInterval ?? 5) * 60000;
    const breakSession = {
      id: `s_${now}`,
      type: "break",
      start: now,
      end: null,
      duration: 0,
      tags: ["pomodoro"],
      notes: "",
      status: "running",
      pauses: [],
      checkpoints: [],
    };
    setActiveSession(breakSession);
    setData((d) => ({ ...d, sessions: [...d.sessions, breakSession] }));
    setPomodoroPhase("break");
    setPomodoroTarget(interval);
    setGraceEnd(null);
    setElapsed(0);
    showToast("Break started", "info");
  }, [showToast]);
```

Add `startBreakNow` to TimerView props (both call site and function signature). Then the button becomes:

```jsx
                  <button
                    onClick={startBreakNow}
                    className="px-3 py-1.5 rounded-lg bg-sky-500/20 text-sky-300 text-xs font-medium hover:bg-sky-500/30 flex items-center gap-1"
                  >
                    <Icon path={ICONS.play} size={12} /> Start Break Now
                  </button>
```

- [ ] **Step 2: Add Extend/Skip buttons, and hide Pause during pomodoro break**

Find the control buttons area where Pause/Resume/Stop are rendered (inside the `{activeSession ? (` block).

**Important:** The spec requires Pause to be unavailable during pomodoro break phases. The existing Pause button's visibility condition needs to also check that we're not in a pomodoro break. Find the Pause button (the one that calls `pauseSession`) and wrap its visibility:

Change the existing Pause button visibility from just checking `isRunning` to also excluding pomodoro breaks:

```jsx
{/* Pause button — hidden during pomodoro break (breaks are already rest) */}
{isRunning && !(timerMode === "pomodoro" && pomodoroPhase === "break") && (
  <button
    onClick={pauseSession}
    ...
  >
    <Icon path={ICONS.pause} size={16} /> Pause
  </button>
)}
```

Then after the Stop button, add the pomodoro-specific buttons:

```jsx
                  {/* Pomodoro: Extend Work button */}
                  {timerMode === "pomodoro" && pomodoroPhase === "work" && (
                    <button
                      onClick={extendWork}
                      className="px-4 py-2.5 rounded-xl bg-stone-700/50 border border-stone-600/50 hover:bg-stone-700 font-medium text-sm flex items-center gap-2 transition-all"
                    >
                      <Icon path={ICONS.forward} size={14} /> +5 min
                    </button>
                  )}
                  {/* Pomodoro: Skip Break button (during break) */}
                  {timerMode === "pomodoro" && pomodoroPhase === "break" && (
                    <button
                      onClick={skipBreak}
                      className="px-4 py-2.5 rounded-xl bg-stone-700/50 border border-stone-600/50 hover:bg-stone-700 font-medium text-sm flex items-center gap-2 transition-all"
                    >
                      <Icon path={ICONS.skipForward} size={14} /> Skip Break
                    </button>
                  )}
```

- [ ] **Step 3: Add "Start Next Pomodoro" prompt (shown after break completes)**

When `pomodoroPhase` is `null` and `timerMode === "pomodoro"` and there's no active session but `pomodoroCycle > 0`, show a prompt to start the next pomodoro. Add this before the `{!activeSession ? (` block in the controls section:

Actually, this is already handled by the existing `{!activeSession ? (` block which shows the start button. When break ends, `pomodoroPhase` becomes `null`, `activeSession` becomes `null`, and the "Start Pomodoro" button appears. The user sees the counter showing completed pomodoros and clicks to start the next one. No additional UI needed.

- [ ] **Step 4: Run lint**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/App.jsx
git commit -m "feat(pomodoro): add grace period UI, skip break, and extend work buttons"
```

---

### Task 10: SettingsModal — Pomodoro Settings Section

**Files:**
- Modify: `src/App.jsx:4719–4954` (SettingsModal)

- [ ] **Step 1: Add Pomodoro settings section**

In `SettingsModal`, find the daily goal input section. After the daily goal `<div>` block and before the `{/* Author Identity Management */}` section (around line 4838), insert:

```jsx
          {/* Pomodoro Timer Settings */}
          <div className="border-t border-stone-800 pt-4">
            <label className="text-xs text-stone-400 uppercase tracking-wide">
              Pomodoro Timer
            </label>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-stone-500">Work Interval (min)</label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={form.pomodoro?.workInterval ?? 25}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      pomodoro: { ...form.pomodoro, workInterval: Math.max(1, Math.min(120, +e.target.value || 1)) },
                    })
                  }
                  onBlur={(e) => {
                    const v = Math.max(1, Math.min(120, +e.target.value || 25));
                    setForm({ ...form, pomodoro: { ...form.pomodoro, workInterval: v } });
                  }}
                  className="w-full mt-1 px-3 py-1.5 bg-stone-800 border border-stone-700 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-[11px] text-stone-500">Break Interval (min)</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={form.pomodoro?.breakInterval ?? 5}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      pomodoro: { ...form.pomodoro, breakInterval: Math.max(1, Math.min(60, +e.target.value || 1)) },
                    })
                  }
                  onBlur={(e) => {
                    const v = Math.max(1, Math.min(60, +e.target.value || 5));
                    setForm({ ...form, pomodoro: { ...form.pomodoro, breakInterval: v } });
                  }}
                  className="w-full mt-1 px-3 py-1.5 bg-stone-800 border border-stone-700 rounded-lg text-sm"
                />
              </div>
            </div>
            <div className="mt-3 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={form.pomodoro?.autoStartBreak ?? true}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      pomodoro: { ...form.pomodoro, autoStartBreak: e.target.checked },
                    })
                  }
                  className="rounded border-stone-600 bg-stone-800 text-amber-500 focus:ring-amber-500/20"
                />
                <span className="text-stone-300">Auto-start break</span>
                <span className="text-[11px] text-stone-500">(30s grace period to skip)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={form.pomodoro?.notifications ?? true}
                  onChange={(e) => {
                    const enabled = e.target.checked;
                    setForm({
                      ...form,
                      pomodoro: { ...form.pomodoro, notifications: enabled },
                    });
                    if (enabled && typeof Notification !== "undefined" && Notification.permission === "default") {
                      Notification.requestPermission().then((result) => {
                        if (result === "denied") {
                          showToast("Browser notifications blocked. Enable in browser settings.", "warning");
                        }
                      });
                    }
                  }}
                  className="rounded border-stone-600 bg-stone-800 text-amber-500 focus:ring-amber-500/20"
                />
                <span className="text-stone-300">Browser notifications + sound</span>
              </label>
            </div>
          </div>
```

- [ ] **Step 2: Ensure SettingsModal form initializes with pomodoro defaults**

The SettingsModal already initializes form from `data.settings`:

```javascript
const [form, setForm] = useState(data.settings);
```

Since `data.settings` now includes `pomodoro` (from `DEFAULT_DATA` + `sanitizeData`), the form will have it. But add a safety check — in case `data.settings.pomodoro` is somehow undefined. Find the `const [form, setForm]` line and ensure it merges:

```javascript
  const [form, setForm] = useState(() => ({
    ...data.settings,
    pomodoro: {
      workInterval: 25,
      breakInterval: 5,
      autoStartBreak: true,
      notifications: true,
      ...data.settings?.pomodoro,
    },
  }));
```

- [ ] **Step 3: Run lint**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/App.jsx
git commit -m "feat(pomodoro): add pomodoro settings section to SettingsModal"
```

---

### Task 11: Integration Verification

**Files:**
- Verify: `src/App.jsx`

- [ ] **Step 1: Run lint across the entire project**

Run: `npm run lint`
Expected: PASS with zero errors

- [ ] **Step 2: Run existing tests**

Run: `npm run test`
Expected: All existing tests pass (pomodoro code doesn't affect syncEngine tests)

- [ ] **Step 3: Start dev server and verify**

Run: `npm run dev`

Manual verification checklist:

1. **Free timer still works:** Navigate to Timer view. Start a free work session. Pause, resume, stop. Confirm no regressions.
2. **Mode toggle appears:** When no session is active, the "Free Timer" / "🍅 Pomodoro" toggle should be visible in the timer header.
3. **Pomodoro start:** Click "🍅 Pomodoro" toggle, then "Start Pomodoro". Confirm session starts with `"pomodoro"` tag (visible in session details).
4. **Countdown display:** Timer ring shows countdown (25:00 → 24:59...) with "Work" label. Progress ring fills as time passes. Elapsed shown below.
5. **Pomodoro counter:** After completing a work interval, pips appear below the timer.
6. **Grace period:** When work interval ends (test with 1-minute interval in settings), grace period UI appears with 30s countdown, "Start Break Now" and "Skip Break" buttons.
7. **Auto-break:** Let grace expire. Break session auto-starts with countdown.
8. **Break → work prompt:** After break ends, toast notification fires, and "Start Pomodoro" button reappears.
9. **Skip Break:** Start pomodoro, let work complete, during break click "Skip Break". Confirm break ends, prompt for next pomodoro.
10. **Extend Work:** During work interval, click "+5 min". Confirm countdown target increases.
11. **Settings:** Open Settings, verify Pomodoro section with interval inputs, auto-start toggle, notifications toggle. Change values and save. Confirm they persist after reload.
12. **Manual stop:** During pomodoro work, click Stop. Confirm session completes, phase resets, mode stays pomodoro.
13. **Page refresh:** Start pomodoro, refresh page. Confirm timer recovers with correct phase and remaining time.

- [ ] **Step 4: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "feat(pomodoro): integration fixes from manual testing"
```

---

## Spec Coverage Check

| Spec Section | Task |
|---|---|
| 1. Data Model (settings, ui, state hooks) | Tasks 1, 3 |
| 2. Timer Display (toggle, countdown, ring, counter, badge) | Tasks 7, 8 |
| 3. Auto-Cycling (transition, tick, grace, recovery) | Tasks 4, 5 |
| 4. User Controls (skip, extend, pause rules) | Tasks 4, 9 |
| 5. Settings UI | Task 10 |
| 6. Notifications (toast, browser, sound) | Task 4 |
| 7. Dashboard (no changes) | N/A |
| 8. Props to TimerView | Task 6 |
| 9. Edge Cases | Handled in Tasks 3 (mount recovery), 5 (grace auto-start), 4 (manual stop) |
| 10. Files Changed | All addressed |
| 11. No New Dependencies | Confirmed |

---

*Plan complete. Ready for execution.*
