/**
 * DevTrack Export Engine
 * Generates professional, enterprise-grade Excel and CSV exports
 * with full styling, formatting, and multiple analysis sheets.
 *
 * Uses xlsx-js-style (SheetJS fork with styling support) for
 * cell-level formatting including fonts, fills, borders, and alignment.
 */

import XLSX from "xlsx-js-style";

// ─── Theme & Style Constants ─────────────────────────────────────────────

const COLORS = {
  // Brand palette
  amber500: "FFD97706",
  amber600: "FFB45309",
  amber700: "FF92400E",
  amber100: "FFFEF3C7",
  amber50: "FFFFFBEB",

  // Slate palette (matching app dark theme)
  slate900: "FF0F172A",
  slate800: "FF1E293B",
  slate700: "FF334155",
  slate600: "FF475569",
  slate500: "FF64748B",
  slate400: "FF94A3B8",
  slate300: "FFCBD5E1",
  slate200: "FFE2E8F0",
  slate100: "FFF1F5F9",
  slate50: "FFF8FAFC",

  // Semantic
  white: "FFFFFFFF",
  black: "FF000000",
  green500: "FF22C55E",
  green100: "FFDCFCE7",
  red500: "FFEF4444",
  red100: "FFFEE2E2",
  blue500: "FF3B82F6",
  blue100: "FFDBEAFE",
  emerald500: "FF10B981",
};

const FONT = {
  calibri: "Calibri",
  arial: "Arial",
};

// Reusable style presets
const STYLES = {
  // ── Title section ──
  titleCell: {
    font: { name: FONT.calibri, sz: 18, bold: true, color: { rgb: COLORS.white } },
    fill: { patternType: "solid", fgColor: { rgb: COLORS.slate800 } },
    alignment: { horizontal: "center", vertical: "center" },
  },
  subtitleCell: {
    font: { name: FONT.calibri, sz: 11, color: { rgb: COLORS.slate400 } },
    fill: { patternType: "solid", fgColor: { rgb: COLORS.slate800 } },
    alignment: { horizontal: "center", vertical: "center" },
  },

  // ── Section headers ──
  sectionHeader: {
    font: { name: FONT.calibri, sz: 13, bold: true, color: { rgb: COLORS.white } },
    fill: { patternType: "solid", fgColor: { rgb: COLORS.amber600 } },
    alignment: { horizontal: "left", vertical: "center" },
    border: {
      bottom: { style: "medium", color: { rgb: COLORS.amber700 } },
    },
  },

  // ── Column headers ──
  columnHeader: {
    font: { name: FONT.calibri, sz: 10, bold: true, color: { rgb: COLORS.white } },
    fill: { patternType: "solid", fgColor: { rgb: COLORS.slate700 } },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: {
      top: { style: "thin", color: { rgb: COLORS.slate600 } },
      bottom: { style: "thin", color: { rgb: COLORS.slate600 } },
      left: { style: "thin", color: { rgb: COLORS.slate600 } },
      right: { style: "thin", color: { rgb: COLORS.slate600 } },
    },
  },

  // ── Data rows ──
  dataCell: {
    font: { name: FONT.calibri, sz: 10, color: { rgb: COLORS.slate900 } },
    alignment: { vertical: "center" },
    border: {
      bottom: { style: "hair", color: { rgb: COLORS.slate200 } },
      left: { style: "hair", color: { rgb: COLORS.slate200 } },
      right: { style: "hair", color: { rgb: COLORS.slate200 } },
    },
  },
  dataCellAlt: {
    font: { name: FONT.calibri, sz: 10, color: { rgb: COLORS.slate900 } },
    fill: { patternType: "solid", fgColor: { rgb: COLORS.slate50 } },
    alignment: { vertical: "center" },
    border: {
      bottom: { style: "hair", color: { rgb: COLORS.slate200 } },
      left: { style: "hair", color: { rgb: COLORS.slate200 } },
      right: { style: "hair", color: { rgb: COLORS.slate200 } },
    },
  },

  // ── Summary/Total rows ──
  totalRow: {
    font: { name: FONT.calibri, sz: 10, bold: true, color: { rgb: COLORS.slate900 } },
    fill: { patternType: "solid", fgColor: { rgb: COLORS.amber100 } },
    alignment: { horizontal: "center", vertical: "center" },
    border: {
      top: { style: "double", color: { rgb: COLORS.amber500 } },
      bottom: { style: "medium", color: { rgb: COLORS.amber500 } },
      left: { style: "thin", color: { rgb: COLORS.amber500 } },
      right: { style: "thin", color: { rgb: COLORS.amber500 } },
    },
  },
  grandTotalRow: {
    font: { name: FONT.calibri, sz: 11, bold: true, color: { rgb: COLORS.white } },
    fill: { patternType: "solid", fgColor: { rgb: COLORS.amber600 } },
    alignment: { horizontal: "center", vertical: "center" },
    border: {
      top: { style: "double", color: { rgb: COLORS.amber700 } },
      bottom: { style: "double", color: { rgb: COLORS.amber700 } },
      left: { style: "thin", color: { rgb: COLORS.amber700 } },
      right: { style: "thin", color: { rgb: COLORS.amber700 } },
    },
  },

  // ── Metric card styles ──
  metricLabel: {
    font: { name: FONT.calibri, sz: 9, color: { rgb: COLORS.slate500 } },
    alignment: { horizontal: "center", vertical: "bottom" },
  },
  metricValue: {
    font: { name: FONT.calibri, sz: 16, bold: true, color: { rgb: COLORS.slate800 } },
    alignment: { horizontal: "center", vertical: "center" },
  },
  metricValueHighlight: {
    font: { name: FONT.calibri, sz: 16, bold: true, color: { rgb: COLORS.amber600 } },
    alignment: { horizontal: "center", vertical: "center" },
  },

  // ── Status indicators ──
  statusMet: {
    font: { name: FONT.calibri, sz: 10, bold: true, color: { rgb: "FF166534" } },
    fill: { patternType: "solid", fgColor: { rgb: COLORS.green100 } },
    alignment: { horizontal: "center", vertical: "center" },
  },
  statusMissed: {
    font: { name: FONT.calibri, sz: 10, bold: true, color: { rgb: "FF991B1B" } },
    fill: { patternType: "solid", fgColor: { rgb: COLORS.red100 } },
    alignment: { horizontal: "center", vertical: "center" },
  },

  // ── Spacer row ──
  spacer: {
    font: { name: FONT.calibri, sz: 6 },
  },
};

// ─── Utility Functions ──────────────────────────────────────────────────

function formatDate(ts) {
  const d = new Date(ts);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

function dayName(ts) {
  return new Date(ts).toLocaleDateString([], { weekday: "short" });
}

function startOfDay(ts) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function formatDurationHMS(ms) {
  if (!ms || ms <= 0) return "0:00";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  return `${h}:${String(m).padStart(2, "0")}`;
}

function msToExcelDuration(ms) {
  // Convert ms to fractional days for Excel [hh]:mm format
  return ms / 86400000;
}

function sanitizeCell(val) {
  if (val == null) return "";
  const s = String(val);
  if (/^[=+\-@\t\r]/.test(s)) return "'" + s;
  return s;
}

function colLetter(idx) {
  let s = "";
  let i = idx;
  while (i >= 0) {
    s = String.fromCharCode(65 + (i % 26)) + s;
    i = Math.floor(i / 26) - 1;
  }
  return s;
}

function cellRef(r, c) {
  return `${colLetter(c)}${r + 1}`;
}

// ─── Core Sheet Builder Helpers ─────────────────────────────────────────

function createSheet() {
  return { "!ref": undefined };
}

function setCell(ws, r, c, value, style, numFmt) {
  const ref = cellRef(r, c);
  if (!ws[ref]) ws[ref] = { t: "s", v: "" };
  if (typeof value === "number") {
    ws[ref].t = "n";
    ws[ref].v = value;
  } else {
    ws[ref].t = "s";
    ws[ref].v = sanitizeCell(value ?? "");
  }
  if (style) ws[ref].s = style;
  if (numFmt) ws[ref].z = numFmt;
}

function setTitleHeader(ws, row, colSpan, title, subtitle) {
  // Merge title row
  const merges = ws["!merges"] || [];
  merges.push({ s: { r: row, c: 0 }, e: { r: row, c: colSpan - 1 } });
  ws["!merges"] = merges;

  setCell(ws, row, 0, title, STYLES.titleCell);

  if (subtitle) {
    const subMerges = ws["!merges"] || [];
    subMerges.push({ s: { r: row + 1, c: 0 }, e: { r: row + 1, c: colSpan - 1 } });
    ws["!merges"] = subMerges;
    setCell(ws, row + 1, 0, subtitle, STYLES.subtitleCell);
  }

  // Set row heights
  if (!ws["!rows"]) ws["!rows"] = [];
  ws["!rows"][row] = { hpx: 36 };
  if (subtitle) ws["!rows"][row + 1] = { hpx: 20 };
}

function setSectionHeader(ws, row, colSpan, title) {
  const merges = ws["!merges"] || [];
  merges.push({ s: { r: row, c: 0 }, e: { r: row, c: colSpan - 1 } });
  ws["!merges"] = merges;
  setCell(ws, row, 0, title, STYLES.sectionHeader);
  if (!ws["!rows"]) ws["!rows"] = [];
  ws["!rows"][row] = { hpx: 26 };
}

function setColumnHeaders(ws, row, headers) {
  headers.forEach((h, i) => {
    setCell(ws, row, i, h, STYLES.columnHeader);
  });
  if (!ws["!rows"]) ws["!rows"] = [];
  ws["!rows"][row] = { hpx: 28 };
}

function setTotalRow(ws, row, values, isGrand) {
  const style = isGrand ? STYLES.grandTotalRow : STYLES.totalRow;
  values.forEach((val, i) => {
    setCell(ws, row, i, val, style);
  });
  if (!ws["!rows"]) ws["!rows"] = [];
  ws["!rows"][row] = { hpx: 24 };
}

function finalizeSheet(ws, colWidths, freezeRef, autoFilterRef) {
  // Column widths
  ws["!cols"] = colWidths.map((w) => ({ wch: w }));

  // Auto-filter
  if (autoFilterRef) {
    ws["!autofilter"] = { ref: autoFilterRef };
  }

  // Freeze panes
  if (freezeRef) {
    ws["!freeze"] = freezeRef;
  }

  // Print margins
  ws["!margins"] = {
    left: 0.5,
    right: 0.5,
    top: 0.6,
    bottom: 0.6,
    header: 0.3,
    footer: 0.3,
  };
}

// ─── Data Preparation ───────────────────────────────────────────────────

function prepareData(data, days) {
  const cutoff = Date.now() - days * 86400000;
  const sessions = (data.sessions || [])
    .filter((s) => s.status === "completed" && s.start >= cutoff)
    .filter((s) => !s.id.startsWith("demo_"));
  const commits = (data.commits || []).filter((c) => c.timestamp >= cutoff);

  // Group sessions by day
  const byDay = {};
  for (let d = days - 1; d >= 0; d--) {
    const dayStart = startOfDay(Date.now()) - d * 86400000;
    const dayEnd = dayStart + 86400000;
    const dayKey = formatDate(dayStart);
    const daySessions = sessions.filter(
      (s) => s.start >= dayStart && s.start < dayEnd
    );
    const workSessions = daySessions.filter((s) => s.type === "work");
    const dayCommits = commits.filter(
      (c) => c.timestamp >= dayStart && c.timestamp < dayEnd
    );
    byDay[dayKey] = {
      date: dayStart,
      dayName: dayName(dayStart),
      sessions: daySessions,
      workSessions,
      commits: dayCommits,
    };
  }

  // Compute tag stats
  const tagMap = {};
  sessions
    .filter((s) => s.type === "work")
    .forEach((s) => {
      (s.tags || []).forEach((tag) => {
        if (!tagMap[tag]) {
          tagMap[tag] = { tag, totalMs: 0, count: 0, first: s.start, last: s.start };
        }
        tagMap[tag].totalMs += s.totalWorkTime || s.duration || 0;
        tagMap[tag].count++;
        if (s.start < tagMap[tag].first) tagMap[tag].first = s.start;
        if (s.start > tagMap[tag].last) tagMap[tag].last = s.start;
      });
    });

  // Overall totals
  const totalWorkMs = sessions
    .filter((s) => s.type === "work")
    .reduce((a, s) => a + (s.totalWorkTime || s.duration || 0), 0);
  const totalBreakMs = sessions
    .filter((s) => s.type === "work")
    .reduce((a, s) => {
      const breakMs = (s.pauses || []).reduce(
        (sum, p) => sum + ((p.end || 0) - p.start),
        0
      );
      return a + breakMs;
    }, 0);
  const workSessions = sessions.filter((s) => s.type === "work");

  // Find most productive day
  let bestDay = null;
  let bestDayHours = 0;
  Object.values(byDay).forEach((d) => {
    const hrs =
      d.workSessions.reduce(
        (a, s) => a + (s.totalWorkTime || s.duration || 0),
        0
      ) / 3600000;
    if (hrs > bestDayHours) {
      bestDayHours = hrs;
      bestDay = d;
    }
  });

  // Find longest session
  const longestSession = workSessions.reduce(
    (best, s) => {
      const dur = s.totalWorkTime || s.duration || 0;
      return dur > best.dur ? { session: s, dur } : best;
    },
    { session: null, dur: 0 }
  );

  return {
    sessions,
    commits,
    byDay,
    tagMap,
    totalWorkMs,
    totalBreakMs,
    workSessions,
    bestDay,
    bestDayHours,
    longestSession,
    days,
    cutoff,
  };
}

// ─── Sheet Builders ─────────────────────────────────────────────────────

/**
 * Sheet 1: Dashboard — Executive Summary
 */
function buildDashboardSheet(prep, settings) {
  const ws = createSheet();
  const COLS = 6;
  let r = 0;

  // Title
  setTitleHeader(
    ws, r, COLS,
    "DevTrack — Performance Dashboard",
    `Report Period: ${formatDate(prep.cutoff)} → ${formatDate(Date.now())}  |  Generated: ${new Date().toLocaleString()}`
  );
  r += 3;

  // ── Key Metrics Section ──
  setSectionHeader(ws, r, COLS, "KEY METRICS");
  r++;
  r++; // spacer

  const dailyGoal = settings?.dailyGoal || 8;
  const avgDailyHrs = prep.totalWorkMs / 3600000 / prep.days;
  const goalPct = Math.round((avgDailyHrs / dailyGoal) * 100);
  const workBreakRatio =
    prep.totalBreakMs > 0
      ? (prep.totalWorkMs / prep.totalBreakMs).toFixed(1) + ":1"
      : "N/A";

  // Metric cards (2 rows of 3)
  const metrics = [
    { label: "Total Work Hours", value: formatDurationHMS(prep.totalWorkMs), highlight: true },
    { label: "Total Sessions", value: prep.workSessions.length, highlight: false },
    { label: "Total Commits", value: prep.commits.length, highlight: false },
    { label: "Avg Hours/Day", value: avgDailyHrs.toFixed(1) + "h", highlight: true },
    { label: "Goal Completion", value: goalPct + "%", highlight: goalPct >= 100 },
    { label: "Work:Break Ratio", value: workBreakRatio, highlight: false },
  ];

  // Row of labels
  metrics.forEach((m, i) => {
    setCell(ws, r, i * 2, m.label, STYLES.metricLabel);
    setCell(ws, r, i * 2 + 1, "", STYLES.metricLabel);
  });
  ws["!merges"] = ws["!merges"] || [];
  metrics.forEach((m, i) => {
    ws["!merges"].push({ s: { r, c: i * 2 }, e: { r, c: i * 2 + 1 } });
  });
  if (!ws["!rows"]) ws["!rows"] = [];
  ws["!rows"][r] = { hpx: 16 };
  r++;

  // Row of values
  metrics.forEach((m, i) => {
    const st = m.highlight ? STYLES.metricValueHighlight : STYLES.metricValue;
    setCell(ws, r, i * 2, m.value, st);
    setCell(ws, r, i * 2 + 1, "", st);
    ws["!merges"].push({ s: { r, c: i * 2 }, e: { r, c: i * 2 + 1 } });
  });
  ws["!rows"][r] = { hpx: 32 };
  r++;

  // Additional metrics row
  r++;
  const extraMetrics = [
    { label: "Most Productive Day", value: prep.bestDay ? `${prep.bestDay.dayName} (${prep.bestDayHours.toFixed(1)}h)` : "N/A" },
    { label: "Longest Session", value: prep.longestSession.session ? formatDurationHMS(prep.longestSession.dur) : "N/A" },
    { label: "Total Break Hours", value: formatDurationHMS(prep.totalBreakMs) },
  ];
  extraMetrics.forEach((m, i) => {
    setCell(ws, r, i * 2, m.label, { ...STYLES.metricLabel, alignment: { horizontal: "left", vertical: "bottom" } });
    setCell(ws, r, i * 2 + 1, "", STYLES.metricLabel);
    ws["!merges"].push({ s: { r, c: i * 2 }, e: { r, c: i * 2 + 1 } });
  });
  ws["!rows"][r] = { hpx: 16 };
  r++;
  extraMetrics.forEach((m, i) => {
    setCell(ws, r, i * 2, m.value, { ...STYLES.metricValue, font: { ...STYLES.metricValue.font, sz: 13 } });
    setCell(ws, r, i * 2 + 1, "", { ...STYLES.metricValue, font: { ...STYLES.metricValue.font, sz: 13 } });
    ws["!merges"].push({ s: { r, c: i * 2 }, e: { r, c: i * 2 + 1 } });
  });
  ws["!rows"][r] = { hpx: 26 };
  r += 2;

  // ── Tag Distribution Section ──
  const tags = Object.values(prep.tagMap).sort((a, b) => b.totalMs - a.totalMs);
  if (tags.length > 0) {
    setSectionHeader(ws, r, COLS, "TAG / PROJECT DISTRIBUTION");
    r++;
    const tagHeaders = ["Tag", "Hours", "Sessions", "Avg Duration", "% of Total", "Last Used"];
    setColumnHeaders(ws, r, tagHeaders);
    r++;

    tags.forEach((t, i) => {
      const pct = prep.totalWorkMs > 0 ? ((t.totalMs / prep.totalWorkMs) * 100).toFixed(1) : "0.0";
      const avgDur = t.count > 0 ? formatDurationHMS(t.totalMs / t.count) : "0:00";
      const isAlt = i % 2 === 1;
      setCell(ws, r, 0, t.tag, isAlt ? STYLES.dataCellAlt : STYLES.dataCell);
      setCell(ws, r, 1, formatDurationHMS(t.totalMs), isAlt ? STYLES.dataCellAlt : STYLES.dataCell, null);
      setCell(ws, r, 2, t.count, isAlt ? STYLES.dataCellAlt : STYLES.dataCell, null);
      setCell(ws, r, 3, avgDur, isAlt ? STYLES.dataCellAlt : STYLES.dataCell, null);
      setCell(ws, r, 4, pct + "%", isAlt ? STYLES.dataCellAlt : STYLES.dataCell, null);
      setCell(ws, r, 5, formatDate(t.last), isAlt ? STYLES.dataCellAlt : STYLES.dataCell, null);
      r++;
    });

    // Tag total
    setTotalRow(ws, r, [
      "TOTAL", formatDurationHMS(prep.totalWorkMs),
      prep.workSessions.length, "", "100%", ""
    ]);
    r++;
  }

  r++;
  // Footer
  setCell(ws, r, 0, "Generated by DevTrack — Developer Time Tracker", {
    font: { name: FONT.calibri, sz: 8, italic: true, color: { rgb: COLORS.slate400 } },
    alignment: { horizontal: "center" },
  });
  ws["!merges"].push({ s: { r, c: 0 }, e: { r, c: COLS - 1 } });

  finalizeSheet(ws, [22, 14, 12, 16, 14, 16], "A4", null);
  return ws;
}

/**
 * Sheet 2: Timesheet — Professional enterprise grid
 */
function buildTimesheetSheet(prep, settings) {
  const ws = createSheet();
  const headers = [
    "Date", "Day", "Clock In", "Clock Out",
    "Gross Hours", "Break Hours", "Net Work",
    "Sessions", "Overtime?", "Tags", "Notes"
  ];
  const COLS = headers.length;
  let r = 0;

  // Title
  setTitleHeader(
    ws, r, COLS,
    "DevTrack — Timesheet",
    `Period: ${formatDate(prep.cutoff)} → ${formatDate(Date.now())}  |  Daily Goal: ${settings?.dailyGoal || 8}h`
  );
  r += 3;

  setColumnHeaders(ws, r, headers);
  const headerRow = r;
  r++;

  let grandTotalGross = 0;
  let grandTotalBreak = 0;
  let grandTotalWork = 0;
  let grandTotalSessions = 0;

  const dayEntries = Object.values(prep.byDay);
  dayEntries.forEach((day, idx) => {
    const work = day.workSessions;
    if (work.length === 0) return;

    const firstStart = work[0].start;
    const lastEnd = work[work.length - 1].end;
    const grossMs = lastEnd - firstStart;
    const workMs = work.reduce((a, s) => a + (s.totalWorkTime || s.duration || 0), 0);
    const breakMs = work.reduce((a, s) => {
      return a + (s.pauses || []).reduce((sum, p) => sum + ((p.end || 0) - p.start), 0);
    }, 0);
    const sessionsCount = work.length;
    const allTags = [...new Set(work.flatMap((s) => s.tags || []))];
    const allNotes = work.map((s) => s.notes).filter(Boolean).join("; ");
    const dailyGoal = (settings?.dailyGoal || 8) * 3600000;
    const isOvertime = workMs > dailyGoal;

    grandTotalGross += grossMs;
    grandTotalBreak += breakMs;
    grandTotalWork += workMs;
    grandTotalSessions += sessionsCount;

    const isAlt = idx % 2 === 1;
    const baseStyle = isAlt ? STYLES.dataCellAlt : STYLES.dataCell;
    const overtimeStyle = isOvertime ? STYLES.statusMissed : STYLES.statusMet;

    setCell(ws, r, 0, formatDate(day.date), baseStyle);
    setCell(ws, r, 1, day.dayName, { ...baseStyle, alignment: { horizontal: "center", vertical: "center" } });
    setCell(ws, r, 2, formatTime(firstStart), { ...baseStyle, alignment: { horizontal: "center", vertical: "center" } });
    setCell(ws, r, 3, formatTime(lastEnd), { ...baseStyle, alignment: { horizontal: "center", vertical: "center" } });
    setCell(ws, r, 4, msToExcelDuration(grossMs), baseStyle, "[hh]:mm");
    setCell(ws, r, 5, msToExcelDuration(breakMs), baseStyle, "[hh]:mm");
    setCell(ws, r, 6, msToExcelDuration(workMs), baseStyle, "[hh]:mm");
    setCell(ws, r, 7, sessionsCount, { ...baseStyle, alignment: { horizontal: "center", vertical: "center" } });
    setCell(ws, r, 8, isOvertime ? "⚠ Overtime" : "✓ On Track", overtimeStyle);
    setCell(ws, r, 9, sanitizeCell(allTags.join(", ")), baseStyle);
    setCell(ws, r, 10, sanitizeCell(allNotes), { ...baseStyle, alignment: { wrapText: true, vertical: "center" } });
    r++;
  });

  // Grand total
  setTotalRow(ws, r, [
    "GRAND TOTAL", "",
    "", "",
    formatDurationHMS(grandTotalGross),
    formatDurationHMS(grandTotalBreak),
    formatDurationHMS(grandTotalWork),
    grandTotalSessions, "", "",
  ], true);
  r++;

  r++;
  setCell(ws, r, 0, "Generated by DevTrack", {
    font: { name: FONT.calibri, sz: 8, italic: true, color: { rgb: COLORS.slate400 } },
    alignment: { horizontal: "center" },
  });
  ws["!merges"] = ws["!merges"] || [];
  ws["!merges"].push({ s: { r, c: 0 }, e: { r, c: COLS - 1 } });

  const lastDataRow = r - 2;
  const autoFilterRange = `A${headerRow + 1}:${colLetter(COLS - 1)}${lastDataRow + 1}`;

  finalizeSheet(
    ws,
    [14, 7, 11, 11, 12, 12, 12, 10, 13, 24, 36],
    `A${headerRow + 2}`,
    autoFilterRange
  );
  return ws;
}

/**
 * Sheet 3: Daily Summary — day-by-day breakdown with goal tracking
 */
function buildDailySummarySheet(prep, settings) {
  const ws = createSheet();
  const headers = [
    "Date", "Day", "Work Hours", "Break Hours",
    "Sessions", "Commits", "Tags Used",
    "Daily Goal", "Goal Met?", "Variance"
  ];
  const COLS = headers.length;
  let r = 0;

  setTitleHeader(
    ws, r, COLS,
    "DevTrack — Daily Summary",
    `Goal: ${settings?.dailyGoal || 8} hours/day  |  ${prep.days}-day period`
  );
  r += 3;

  setColumnHeaders(ws, r, headers);
  const headerRow = r;
  r++;

  let totalWorkHrs = 0;
  let totalBreakHrs = 0;
  let totalSessions = 0;
  let totalCommits = 0;
  let daysMetGoal = 0;

  Object.values(prep.byDay).forEach((day, idx) => {
    const workMs = day.workSessions.reduce(
      (a, s) => a + (s.totalWorkTime || s.duration || 0), 0
    );
    const breakMs = day.workSessions.reduce((a, s) => {
      return a + (s.pauses || []).reduce((sum, p) => sum + ((p.end || 0) - p.start), 0);
    }, 0);
    const workHrs = workMs / 3600000;
    const breakHrs = breakMs / 3600000;
    const goalHrs = settings?.dailyGoal || 8;
    const metGoal = workHrs >= goalHrs;
    const variance = workHrs - goalHrs;
    const tags = [...new Set(day.workSessions.flatMap((s) => s.tags || []))];

    totalWorkHrs += workHrs;
    totalBreakHrs += breakHrs;
    totalSessions += day.workSessions.length;
    totalCommits += day.commits.length;
    if (metGoal) daysMetGoal++;

    const isAlt = idx % 2 === 1;
    const baseStyle = isAlt ? STYLES.dataCellAlt : STYLES.dataCell;

    setCell(ws, r, 0, formatDate(day.date), baseStyle);
    setCell(ws, r, 1, day.dayName, { ...baseStyle, alignment: { horizontal: "center", vertical: "center" } });
    setCell(ws, r, 2, +workHrs.toFixed(2), baseStyle, "0.00");
    setCell(ws, r, 3, +breakHrs.toFixed(2), baseStyle, "0.00");
    setCell(ws, r, 4, day.workSessions.length, { ...baseStyle, alignment: { horizontal: "center", vertical: "center" } });
    setCell(ws, r, 5, day.commits.length, { ...baseStyle, alignment: { horizontal: "center", vertical: "center" } });
    setCell(ws, r, 6, sanitizeCell(tags.join(", ")), baseStyle);
    setCell(ws, r, 7, goalHrs, { ...baseStyle, alignment: { horizontal: "center", vertical: "center" } }, "0.00");
    setCell(ws, r, 8, metGoal ? "✓ Met" : "✗ Missed", metGoal ? STYLES.statusMet : STYLES.statusMissed);
    setCell(ws, r, 9, (variance >= 0 ? "+" : "") + variance.toFixed(1) + "h",
      variance >= 0
        ? { ...baseStyle, font: { ...baseStyle.font, color: { rgb: "FF166534" } } }
        : { ...baseStyle, font: { ...baseStyle.font, color: { rgb: "FF991B1B" } } }
    );
    r++;
  });

  // Summary totals
  setTotalRow(ws, r, [
    `TOTAL (${prep.days} days)`, "",
    +totalWorkHrs.toFixed(2),
    +totalBreakHrs.toFixed(2),
    totalSessions, totalCommits, "",
    `${daysMetGoal}/${prep.days} days`, "",
    ((totalWorkHrs / prep.days) - (settings?.dailyGoal || 8)) >= 0 ? "Above Avg" : "Below Avg",
  ]);

  const lastDataRow = r;
  const autoFilterRange = `A${headerRow + 1}:${colLetter(COLS - 1)}${lastDataRow + 1}`;

  finalizeSheet(
    ws,
    [14, 7, 12, 12, 10, 10, 24, 11, 12, 12],
    `A${headerRow + 2}`,
    autoFilterRange
  );
  return ws;
}

/**
 * Sheet 4: Tag Analysis — project/tag breakdown
 */
function buildTagAnalysisSheet(prep) {
  const ws = createSheet();
  const headers = [
    "Tag / Project", "Total Hours", "Sessions",
    "Avg Duration", "First Used", "Last Used",
    "% of Total"
  ];
  const COLS = headers.length;
  let r = 0;

  setTitleHeader(ws, r, COLS, "DevTrack — Tag & Project Analysis", "Breakdown of time by tag/project");
  r += 3;

  setColumnHeaders(ws, r, headers);
  const headerRow = r;
  r++;

  const tags = Object.values(prep.tagMap).sort((a, b) => b.totalMs - a.totalMs);

  tags.forEach((t, i) => {
    const hrs = t.totalMs / 3600000;
    const avgDur = t.count > 0 ? t.totalMs / t.count : 0;
    const pct = prep.totalWorkMs > 0 ? (t.totalMs / prep.totalWorkMs) * 100 : 0;
    const isAlt = i % 2 === 1;
    const baseStyle = isAlt ? STYLES.dataCellAlt : STYLES.dataCell;

    setCell(ws, r, 0, t.tag, baseStyle);
    setCell(ws, r, 1, +hrs.toFixed(2), baseStyle, "0.00");
    setCell(ws, r, 2, t.count, { ...baseStyle, alignment: { horizontal: "center", vertical: "center" } });
    setCell(ws, r, 3, formatDurationHMS(avgDur), baseStyle);
    setCell(ws, r, 4, formatDate(t.first), baseStyle);
    setCell(ws, r, 5, formatDate(t.last), baseStyle);
    setCell(ws, r, 6, +pct.toFixed(1), baseStyle, "0.0");
    r++;
  });

  // Total row
  const totalHrs = prep.totalWorkMs / 3600000;
  setTotalRow(ws, r, [
    "TOTAL",
    +totalHrs.toFixed(2),
    prep.workSessions.length,
    prep.workSessions.length > 0
      ? formatDurationHMS(prep.totalWorkMs / prep.workSessions.length)
      : "0:00",
    "", "", 100.0
  ], true);

  const lastDataRow = r;
  const autoFilterRange = `A${headerRow + 1}:${colLetter(COLS - 1)}${lastDataRow + 1}`;

  finalizeSheet(
    ws,
    [24, 14, 10, 14, 14, 14, 12],
    `A${headerRow + 2}`,
    autoFilterRange
  );
  return ws;
}

/**
 * Sheet 5: Git Activity — commit data (conditional)
 */
function buildGitActivitySheet(prep) {
  const ws = createSheet();
  const headers = [
    "Date", "Time", "Repository", "Branch",
    "Author", "SHA", "Message",
    "Files Changed", "+Lines", "-Lines", "Source"
  ];
  const COLS = headers.length;
  let r = 0;

  setTitleHeader(
    ws, r, COLS,
    "DevTrack — Git Activity",
    `${prep.commits.length} commits across ${new Set(prep.commits.map((c) => c.repo)).size} repositories`
  );
  r += 3;

  if (prep.commits.length === 0) {
    setCell(ws, r, 0, "No git commits recorded during this period.", {
      font: { name: FONT.calibri, sz: 11, italic: true, color: { rgb: COLORS.slate400 } },
      alignment: { horizontal: "center", vertical: "center" },
    });
    ws["!merges"] = ws["!merges"] || [];
    ws["!merges"].push({ s: { r, c: 0 }, e: { r, c: COLS - 1 } });
    finalizeSheet(ws, headers.map(() => 14), null, null);
    return ws;
  }

  setColumnHeaders(ws, r, headers);
  const headerRow = r;
  r++;

  // Sort by date descending
  const sortedCommits = [...prep.commits].sort((a, b) => b.timestamp - a.timestamp);

  sortedCommits.forEach((c, i) => {
    const isAlt = i % 2 === 1;
    const baseStyle = isAlt ? STYLES.dataCellAlt : STYLES.dataCell;

    setCell(ws, r, 0, formatDate(c.timestamp), baseStyle);
    setCell(ws, r, 1, formatTime(c.timestamp), { ...baseStyle, alignment: { horizontal: "center", vertical: "center" } });
    setCell(ws, r, 2, sanitizeCell(c.repo), baseStyle);
    setCell(ws, r, 3, sanitizeCell(c.branch || ""), { ...baseStyle, alignment: { horizontal: "center", vertical: "center" } });
    setCell(ws, r, 4, sanitizeCell(c.author || ""), baseStyle);
    setCell(ws, r, 5, c.sha ? c.sha.substring(0, 7) : "", { ...baseStyle, font: { name: "Consolas", sz: 9, color: { rgb: COLORS.slate900 } } });
    setCell(ws, r, 6, sanitizeCell(c.message), { ...baseStyle, alignment: { wrapText: true, vertical: "center" } });
    setCell(ws, r, 7, c.filesChanged ?? "", { ...baseStyle, alignment: { horizontal: "center", vertical: "center" } });
    setCell(ws, r, 8, c.insertions ?? "", { ...baseStyle, alignment: { horizontal: "center", vertical: "center" } });
    setCell(ws, r, 9, c.deletions ?? "", { ...baseStyle, alignment: { horizontal: "center", vertical: "center" } });
    setCell(ws, r, 10, c.source || "manual", { ...baseStyle, alignment: { horizontal: "center", vertical: "center" } });
    r++;
  });

  // Summary row
  const totalFiles = prep.commits.reduce((a, c) => a + (c.filesChanged || 0), 0);
  const totalInsertions = prep.commits.reduce((a, c) => a + (c.insertions || 0), 0);
  const totalDeletions = prep.commits.reduce((a, c) => a + (c.deletions || 0), 0);
  setTotalRow(ws, r, [
    `TOTAL (${prep.commits.length} commits)`, "", "", "", "", "", "",
    totalFiles, totalInsertions, totalDeletions, ""
  ]);

  const lastDataRow = r;
  const autoFilterRange = `A${headerRow + 1}:${colLetter(COLS - 1)}${lastDataRow + 1}`;

  finalizeSheet(
    ws,
    [14, 10, 20, 14, 16, 10, 40, 13, 10, 10, 10],
    `A${headerRow + 2}`,
    autoFilterRange
  );
  return ws;
}

/**
 * Sheet 6: Raw Data — unformatted data export
 */
function buildRawDataSheet(prep) {
  const ws = createSheet();

  // ── Sessions section ──
  const sessionHeaders = [
    "ID", "Type", "Start", "End", "Duration (min)",
    "Work Time (min)", "Break Time (min)", "Pauses",
    "Tags", "Notes", "Status"
  ];
  const S_COLS = sessionHeaders.length;
  let r = 0;

  setTitleHeader(ws, r, S_COLS, "Sessions — Raw Data", `${prep.sessions.length} records`);
  r += 3;

  setColumnHeaders(ws, r, sessionHeaders);
  r++;

  prep.sessions.forEach((s, i) => {
    const breakMs = (s.pauses || []).reduce((sum, p) => sum + ((p.end || 0) - p.start), 0);
    const workMs = s.totalWorkTime || s.duration || 0;
    const isAlt = i % 2 === 1;
    const baseStyle = isAlt ? STYLES.dataCellAlt : STYLES.dataCell;

    setCell(ws, r, 0, s.id, { ...baseStyle, font: { name: "Consolas", sz: 9 } });
    setCell(ws, r, 1, s.type, baseStyle);
    setCell(ws, r, 2, new Date(s.start).toISOString(), baseStyle);
    setCell(ws, r, 3, s.end ? new Date(s.end).toISOString() : "", baseStyle);
    setCell(ws, r, 4, +((s.duration || 0) / 60000).toFixed(1), baseStyle, "0.0");
    setCell(ws, r, 5, +(workMs / 60000).toFixed(1), baseStyle, "0.0");
    setCell(ws, r, 6, +(breakMs / 60000).toFixed(1), baseStyle, "0.0");
    setCell(ws, r, 7, (s.pauses || []).filter((p) => p.end).length, baseStyle);
    setCell(ws, r, 8, sanitizeCell((s.tags || []).join("; ")), baseStyle);
    setCell(ws, r, 9, sanitizeCell(s.notes || ""), { ...baseStyle, alignment: { wrapText: true, vertical: "center" } });
    setCell(ws, r, 10, s.status, baseStyle);
    r++;
  });

  r += 2;

  // ── Commits section ──
  if (prep.commits.length > 0) {
    const commitHeaders = [
      "SHA", "Date", "Repository", "Branch",
      "Author", "Email", "Message",
      "Files Changed", "Insertions", "Deletions", "Source"
    ];
    const C_COLS = commitHeaders.length;

    setSectionHeader(ws, r, C_COLS, `Commits — Raw Data (${prep.commits.length} records)`);
    r++;
    setColumnHeaders(ws, r, commitHeaders);
    r++;

    prep.commits.forEach((c, i) => {
      const isAlt = i % 2 === 1;
      const baseStyle = isAlt ? STYLES.dataCellAlt : STYLES.dataCell;

      setCell(ws, r, 0, c.sha, { ...baseStyle, font: { name: "Consolas", sz: 9 } });
      setCell(ws, r, 1, new Date(c.timestamp).toISOString(), baseStyle);
      setCell(ws, r, 2, sanitizeCell(c.repo), baseStyle);
      setCell(ws, r, 3, sanitizeCell(c.branch || ""), baseStyle);
      setCell(ws, r, 4, sanitizeCell(c.author || ""), baseStyle);
      setCell(ws, r, 5, sanitizeCell(c.authorEmail || ""), baseStyle);
      setCell(ws, r, 6, sanitizeCell(c.message), { ...baseStyle, alignment: { wrapText: true, vertical: "center" } });
      setCell(ws, r, 7, c.filesChanged ?? "", baseStyle);
      setCell(ws, r, 8, c.insertions ?? "", baseStyle);
      setCell(ws, r, 9, c.deletions ?? "", baseStyle);
      setCell(ws, r, 10, c.source || "manual", baseStyle);
      r++;
    });
  }

  finalizeSheet(
    ws,
    [16, 8, 22, 12, 14, 14, 14, 10, 34, 36, 10],
    "A4",
    null
  );
  return ws;
}

// ─── Main Export Functions ───────────────────────────────────────────────

/**
 * Generate a professional Excel report with 6 styled sheets.
 * @param {Object} data - The full app data object { sessions, commits, settings }
 * @param {string} period - "day" | "week" | "month" | "year"
 * @returns {void} Triggers file download
 */
export function generateExcelReport(data, period) {
  const days = period === "day" ? 1 : period === "week" ? 7 : period === "month" ? 30 : 365;
  const prep = prepareData(data, days);

  const wb = XLSX.utils.book_new();

  // Sheet 1: Dashboard
  XLSX.utils.book_append_sheet(wb, buildDashboardSheet(prep, data.settings), "Dashboard");

  // Sheet 2: Timesheet
  XLSX.utils.book_append_sheet(wb, buildTimesheetSheet(prep, data.settings), "Timesheet");

  // Sheet 3: Daily Summary
  XLSX.utils.book_append_sheet(wb, buildDailySummarySheet(prep, data.settings), "Daily Summary");

  // Sheet 4: Tag Analysis
  XLSX.utils.book_append_sheet(wb, buildTagAnalysisSheet(prep), "Tag Analysis");

  // Sheet 5: Git Activity
  XLSX.utils.book_append_sheet(wb, buildGitActivitySheet(prep), "Git Activity");

  // Sheet 6: Raw Data
  XLSX.utils.book_append_sheet(wb, buildRawDataSheet(prep), "Raw Data");

  // Download
  const periodLabel = period.charAt(0).toUpperCase() + period.slice(1);
  XLSX.writeFile(
    wb,
    `DevTrack_Report_${periodLabel}_${formatDate(Date.now()).replace(/\s/g, "-")}.xlsx`
  );
}

/**
 * Generate an enhanced CSV export with metadata headers and computed fields.
 * @param {Object} data - The full app data object { sessions, commits, settings }
 * @param {string} period - "day" | "week" | "month" | "year"
 * @returns {void} Triggers file download
 */
export function generateCSVReport(data, period) {
  const days = period === "day" ? 1 : period === "week" ? 7 : period === "month" ? 30 : 365;
  const cutoff = Date.now() - days * 86400000;

  const sessions = (data.sessions || [])
    .filter((s) => s.status === "completed" && s.start >= cutoff)
    .filter((s) => !s.id.startsWith("demo_"));
  const commits = (data.commits || []).filter((c) => c.timestamp >= cutoff);

  const totalWorkHrs = sessions
    .filter((s) => s.type === "work")
    .reduce((a, s) => a + (s.totalWorkTime || s.duration || 0), 0) / 3600000;

  const periodLabel = period.charAt(0).toUpperCase() + period.slice(1);

  // Build CSV with metadata header
  const rows = [];

  // Metadata header
  rows.push(`# DevTrack Time Tracking Report`);
  rows.push(`# Period: ${periodLabel} (${formatDate(cutoff)} to ${formatDate(Date.now())})`);
  rows.push(`# Generated: ${new Date().toLocaleString()}`);
  rows.push(`# Total Work Hours: ${totalWorkHrs.toFixed(2)}`);
  rows.push(`# Total Sessions: ${sessions.filter((s) => s.type === "work").length}`);
  rows.push(`# Total Commits: ${commits.length}`);
  rows.push(`#`);

  // Column headers
  rows.push([
    "Date", "Day", "Start", "End",
    "Duration (min)", "Work Time (min)", "Break Time (min)",
    "Breaks", "Type", "Tags", "Notes",
    "Daily Goal (hrs)", "Goal Met?"
  ].map((h) => `"${h}"`).join(","));

  // Group by day for goal tracking
  const dailyGoal = data.settings?.dailyGoal || 8;

  sessions.forEach((s) => {
    const breakMs = (s.pauses || []).reduce((sum, p) => sum + ((p.end || 0) - p.start), 0);
    const workMs = s.totalWorkTime || s.duration || 0;
    const dayStart = startOfDay(s.start);
    const dayWorkMs = sessions
      .filter((ds) => ds.type === "work" && ds.start >= dayStart && ds.start < dayStart + 86400000)
      .reduce((a, ds) => a + (ds.totalWorkTime || ds.duration || 0), 0);
    const dayGoalMet = (dayWorkMs / 3600000) >= dailyGoal;

    const row = [
      formatDate(s.start),
      dayName(s.start),
      formatTime(s.start),
      s.end ? formatTime(s.end) : "",
      +((s.duration || 0) / 60000).toFixed(1),
      +(workMs / 60000).toFixed(1),
      +(breakMs / 60000).toFixed(1),
      (s.pauses || []).filter((p) => p.end).length,
      s.type,
      (s.tags || []).join("; "),
      (s.notes || "").replace(/"/g, '""'),
      dailyGoal,
      dayGoalMet ? "Yes" : "No",
    ];
    rows.push(row.map((c) => `"${sanitizeCell(c).replace(/"/g, '""')}"`).join(","));
  });

  // Add summary footer
  rows.push(`#`);
  rows.push(`# --- Git Commits (${commits.length}) ---`);
  rows.push(`# Date,Time,Repository,Branch,Author,SHA,Message,Files Changed,+Lines,-Lines`);

  commits.forEach((c) => {
    const row = [
      formatDate(c.timestamp),
      formatTime(c.timestamp),
      c.repo,
      c.branch || "",
      c.author || "",
      c.sha,
      (c.message || "").replace(/"/g, '""'),
      c.filesChanged ?? "",
      c.insertions ?? "",
      c.deletions ?? "",
    ];
    rows.push(row.map((v) => `"${sanitizeCell(v).replace(/"/g, '""')}"`).join(","));
  });

  // BOM for Excel UTF-8 compatibility
  const bom = "﻿";
  const csv = bom + rows.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `DevTrack_${periodLabel}_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Get export preview data for UI display.
 * Returns counts and date range for the selected period.
 */
export function getExportPreview(data, period) {
  const days = period === "day" ? 1 : period === "week" ? 7 : period === "month" ? 30 : 365;
  const cutoff = Date.now() - days * 86400000;

  const sessions = (data.sessions || [])
    .filter((s) => s.status === "completed" && s.start >= cutoff)
    .filter((s) => !s.id.startsWith("demo_"));
  const workSessions = sessions.filter((s) => s.type === "work");
  const commits = (data.commits || []).filter((c) => c.timestamp >= cutoff);
  const tags = [...new Set(workSessions.flatMap((s) => s.tags || []))];
  const repos = [...new Set(commits.map((c) => c.repo))];
  const totalHrs = workSessions.reduce(
    (a, s) => a + (s.totalWorkTime || s.duration || 0), 0
  ) / 3600000;

  return {
    totalSessions: workSessions.length,
    totalCommits: commits.length,
    totalHours: +totalHrs.toFixed(1),
    tags,
    tagCount: tags.length,
    repos,
    repoCount: repos.length,
    dateRange: `${formatDate(cutoff)} → ${formatDate(Date.now())}`,
    days,
  };
}
