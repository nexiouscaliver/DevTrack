# Pomodoro Mode — Design Specification

**Date:** 2026-06-08
**Status:** Approved
**Approach:** Mode toggle inside existing TimerView (Approach A)

---

## Overview

Add a Pomodoro timer mode to DevTrack that auto-cycles between configurable work and break intervals. Activated via a toggle inside the existing TimerView — no new navigation tabs. Every pomodoro work and break period is a real session stored in `data.sessions`, auto-tagged with `"pomodoro"`, and fully visible in SessionsView, Analytics, and Exports.

---

## 1. Data Model

### New Settings Fields

Added to `data.settings` in `DEFAULT_DATA`:

```javascript
pomodoro: {
  workInterval: 25,        // minutes (min 1, max 120)
  breakInterval: 5,        // minutes (min 1, max 60)
  autoStartBreak: true,    // auto-start break with 30s grace period
  notifications: true,     // browser notifications + sound
}
```

### New UI Preference

Added to `data.ui`:

```javascript
timerMode: "free",  // "free" | "pomodoro"
```

### New App State Hooks

Non-persisted state in `App()`:

```javascript
const [pomodoroCycle, setPomodoroCycle] = useState(0);   // completed work intervals today
const [pomodoroPhase, setPomodoroPhase] = useState(null); // null | "work" | "break" | "grace"
```

- `pomodoroCycle` resets when a new day is detected (same pattern as dashboard stats)
- `pomodoroPhase` derived from active session when recovering from page refresh

### Session Model

No new fields on the session object. Pomodoro sessions are regular sessions with:
- `type: "work"` or `type: "break"` (existing field)
- `tags: ["pomodoro", ...userTags]` — auto-tagged
- No migration needed for existing sessions

---

## 2. Timer Display

### Mode Toggle

A segmented control at the top of TimerView replacing the current subtitle area:

```
[ Free Timer ]  [ Pomodoro ]
```

- Active segment: amber gradient (`from-amber-500 to-orange-600`)
- Inactive segment: `bg-stone-800` with `text-stone-400`
- Only visible when no session is active — hidden while running/paused
- When switching to pomodoro mode with no session, the start button changes to "Start Pomodoro"

### Countdown Display

When pomodoro is active, the timer ring shows countdown instead of elapsed:

**Main number:** Remaining time (`target - elapsed`) formatted as `HH:MM:SS`
- Label below: "Work" or "Break" instead of "Elapsed"/"Ready"
- During grace period: shows the 30-second grace countdown

**Secondary line:** `Elapsed: HH:MM:SS` in `text-xs text-stone-500` below the ring

**Progress ring:** Fills inward as time passes
- Work intervals: amber gradient (existing `timerGrad`)
- Break intervals: sky gradient (existing `timerBreakGrad`)
- Calculation: `elapsed / targetDuration * circumference`

### Pomodoro Counter

Below the timer ring, a row of small circle pips:

- Filled (`bg-amber-400`, `w-2.5 h-2.5 rounded-full`) = completed work interval today
- Empty (`bg-stone-700`) = remaining
- Shows up to 8 pips; beyond 8 shows a count badge: `● ● ● ● ● +3`
- Framer Motion animation when a new pip fills

### Status Badge

Existing badge gains a small tomato emoji prefix:
- `🍅 Working` (green/emerald styling)
- `🍅 Break` (sky/blue styling)

---

## 3. Auto-Cycling Logic

### Cycle Flow

```
Start Pomodoro
  → create work session (workInterval * 60000 ms target)
  → tick each second: check elapsed vs target
  → interval completes
    → stop current session via stopSession()
    → show notification (toast + browser + sound)
    → enter grace phase (30 seconds)
    → grace expires with no user action → auto-start break session
    → OR user clicks "Start Break Now" → immediate break
    → OR user clicks "Skip Break" → skip, prompt next pomodoro
Break completes
  → stop break session via stopSession()
  → show notification
  → prompt user: "Start next pomodoro?" (NO auto-start for work)
  → user clicks "Start Work" → cycle repeats
```

**Key asymmetry:** Work → break is auto (with grace period). Break → work requires manual confirmation.

### Timer Tick Integration

No new `setInterval`. The existing 1-second tick `useEffect` (line 1031) gains a check:

```javascript
if (pomodoroPhase === "work" || pomodoroPhase === "break") {
  const target = pomodoroPhase === "work"
    ? data.settings.pomodoro.workInterval * 60000
    : data.settings.pomodoro.breakInterval * 60000;

  if (elapsed >= target) {
    handlePomodoroIntervalComplete();
  }
}
```

`handlePomodoroIntervalComplete()` is a new function in `App()` managing the phase transition.

### Grace Period (30 seconds)

Triggered when a work interval completes and `autoStartBreak` is `true`:

1. Toast: `"🍅 Work interval complete! Break in 30s..."`
2. Browser notification + sound
3. Timer displays 30-second grace countdown
4. Two action buttons appear:
   - **"Start Break Now"** — immediately starts break session
   - **"Skip Break"** — skips break, shows prompt for next pomodoro
5. After 30s with no action → auto-start break session

If `autoStartBreak` is `false`, the grace period is skipped entirely — user must manually click "Start Break".

### State Recovery on Page Refresh

When `App()` mounts with an active session and `ui.timerMode === "pomodoro"`:

1. Check session tags for `"pomodoro"`
2. Derive `pomodoroPhase` from session type (`"work"` or `"break"`)
3. Calculate remaining time: `target - elapsed`
4. Resume ticking — if elapsed already past target, immediately trigger `handlePomodoroIntervalComplete()`
5. Re-derive `pomodoroCycle` by counting today's completed work sessions with `"pomodoro"` tag

### Manual Stop During Pomodoro

User clicks "Stop" mid-interval:
1. Session completes normally via `stopSession()`
2. `pomodoroPhase` resets to `null`
3. Mode stays as "pomodoro" — ready for fresh start
4. No auto-cycling triggers

---

## 4. User Controls

### New Actions

| Action | When Available | Behavior |
|--------|---------------|----------|
| **Skip Break** | During break or grace period | Ends break immediately, prompts next pomodoro |
| **Extend Work** | During work interval | Adds 5 minutes to current target duration. Can be clicked multiple times. |
| **Start Break Now** | During grace period | Immediately starts break session |

### Existing Controls in Pomodoro Mode

| Control | Behavior |
|---------|----------|
| **Pause** | Works normally during work interval. Not available during break (breaks are already rest). |
| **Resume** | Works normally after manual pause during work. |
| **Stop** | Ends current interval, resets phase to `null`. Mode stays "pomodoro". |

---

## 5. Settings UI

### New Section in SettingsModal

Inserted between "Daily Work Goal" and "My Git Identities", separated by `border-t border-stone-800 pt-4`:

| Field | Type | Default | Validation |
|-------|------|---------|------------|
| Work Interval | `number` input | 25 | Min 1, max 120 minutes |
| Break Interval | `number` input | 5 | Min 1, max 60 minutes |
| Auto-start break | Checkbox | `true` | Enables 30s grace period |
| Browser notifications | Checkbox | `true` | Triggers `Notification.requestPermission()` on first enable |

Section header: `"POMODORO TIMER"` in `text-xs text-stone-400 uppercase tracking-wide`

Validation: clamp inputs to valid range on blur. Show inline hint if out of bounds. No `alert()` or `confirm()`.

---

## 6. Notifications

### Three-Layer System

Fires when any pomodoro interval (work or break) completes:

**Layer 1 — In-App Toast** (always fires):
- Work complete: `"🍅 Work interval complete! Break in 30s..."` (type: `"success"`)
- Break complete: `"Break over — ready for the next pomodoro?"` (type: `"info"`)
- Uses existing `showToast(msg, type)` — no toast changes needed

**Layer 2 — Browser Notification** (when setting enabled + permission granted):
- Title: `"DevTrack — Pomodoro"`
- Body: `"Work interval complete"` or `"Break is over"`
- `silent: true` (own sound played separately)
- Click action: `window.focus()` to bring DevTrack tab to front
- Permission flow: call `Notification.requestPermission()` on first toggle. If denied, toast explains how to re-enable in browser settings. Don't re-prompt if already denied.

**Layer 3 — Sound** (tied to notifications toggle):
- Web Audio API — no audio file dependency
- 440Hz sine wave, 200ms duration, gentle fade-out
- Generated via `AudioContext` on-the-fly
- Only plays when browser notifications setting is enabled

### Toast Strategy

One toast on interval complete, another when the next phase actually starts. No updating toast every second during grace — the countdown is already visible on the timer display.

---

## 7. Dashboard

No changes. The pomodoro counter lives in TimerView only (per design decision). Pomodoro sessions appear naturally in the Dashboard's Recent Activity list as regular sessions tagged `"pomodoro"`.

---

## 8. Props Added to TimerView

```javascript
// New props
pomodoroPhase,        // null | "work" | "break" | "grace"
pomodoroCycle,        // number — completed work intervals today
pomodoroTarget,       // current target duration in ms (or null)
timerMode,            // "free" | "pomodoro"
graceRemaining,       // seconds remaining in grace period (or null)
setTimerMode,         // (mode: "free" | "pomodoro") => void
skipBreak,            // () => void
extendWork,           // () => void — adds 5 min to current target
```

---

## 9. Edge Cases

| Scenario | Behavior |
|----------|----------|
| Manual stop mid-work | Session completes. Phase resets. Mode stays pomodoro. |
| Switch mode mid-session | Toggle hidden while session active. Must stop first. |
| Page refresh mid-pomodoro | Recover phase from session type + "pomodoro" tag. Re-derive cycle count. If past target, trigger completion immediately. |
| Interval crosses midnight | Existing stale-session logic (line 759) auto-completes at midnight. Cycle resets next day. |
| Repeated skip breaks | Each skip increments cycle counter. No forced breaks. |
| Extend work multiple times | Each click adds 5 min to target. Countdown adjusts. |
| Grace period + navigate away | Break auto-starts — logic in App() useEffect, not TimerView. |
| Notification permission denied | Falls back to toast + sound. No errors. |
| Pomodoro on, no session | Shows "Start Pomodoro" button. Mode toggle visible. |

---

## 10. Files Changed

| File | Change |
|------|--------|
| `src/App.jsx` — `DEFAULT_DATA` (line 420) | Add `pomodoro` to settings, `timerMode` to ui |
| `src/App.jsx` — `ICONS` (line 40) | Add `skipForward` icon |
| `src/App.jsx` — `sanitizeData` (line 458) | Handle new pomodoro settings fields |
| `src/App.jsx` — `App()` state (line 785) | Add `pomodoroCycle`, `pomodoroPhase`, `graceRemaining` hooks |
| `src/App.jsx` — Timer tick (line 1031) | Add countdown check against pomodoro target |
| `src/App.jsx` — New functions | `handlePomodoroIntervalComplete`, `skipBreak`, `extendWork`, `setTimerMode`, `playNotificationSound` |
| `src/App.jsx` — `TimerView` (line 2205) | Mode toggle, countdown display, pomodoro counter, skip/extend buttons, grace period UI |
| `src/App.jsx` — `SettingsModal` (line 4719) | New Pomodoro settings section |
| `src/App.jsx` — `Dashboard` props (line 1908) | No changes needed |
| `package.json` | No new dependencies |

---

## 11. No New Dependencies

All functionality uses browser-native APIs:
- `Notification` API — system notifications
- `AudioContext` — notification sound
- Existing libraries: React, Framer Motion, Tailwind CSS

---

*Design approved on 2026-06-08. Ready for implementation planning.*
