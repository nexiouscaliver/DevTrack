import { describe, it, expect } from "vitest";
import {
  computeDiff,
  applyPush,
  applyPull,
  applyMerge,
  previewSync,
  formatDiffSummary,
} from "./syncEngine.js";

// ─── Test data factories ────────────────────────────────────────────────────

function makeSession(overrides = {}) {
  return {
    id: "s1",
    type: "work",
    start: "2026-06-01T09:00:00.000Z",
    end: "2026-06-01T17:00:00.000Z",
    duration: 28800000,
    tags: ["dev"],
    notes: "",
    status: "completed",
    pauses: [],
    checkpoints: [],
    totalWorkTime: 28800000,
    totalBreakTime: 0,
    ...overrides,
  };
}

function makeCommit(overrides = {}) {
  return {
    sha: "abc123",
    message: "feat: add feature",
    repo: "devtrack",
    repoPath: "/home/user/devtrack",
    timestamp: "2026-06-01T10:30:00.000Z",
    author: "Shahil",
    authorEmail: "shahil@example.com",
    branch: "main",
    source: "local",
    filesChanged: 3,
    insertions: 45,
    deletions: 12,
    ...overrides,
  };
}

function makeData(overrides = {}) {
  return {
    sessions: [],
    commits: [],
    settings: {
      dailyGoal: 8,
      trackedRepos: [],
      gitAuthors: { identities: [], autoDetected: null },
    },
    ui: { view: "dashboard" },
    ...overrides,
  };
}

// ─── computeDiff ────────────────────────────────────────────────────────────

describe("computeDiff", () => {
  it("reports identical data sources", () => {
    const data = makeData({ sessions: [makeSession()] });
    const diff = computeDiff(data, data);
    expect(diff.summary.localOnlyCount).toBe(0);
    expect(diff.summary.serverOnlyCount).toBe(0);
    expect(diff.summary.conflictCount).toBe(0);
    expect(diff.summary.identicalCount).toBe(1);
  });

  it("detects local-only sessions", () => {
    const local = makeData({ sessions: [makeSession()] });
    const server = makeData();
    const diff = computeDiff(local, server);
    expect(diff.summary.localOnlyCount).toBe(1);
    expect(diff.sessions.localOnly).toHaveLength(1);
    expect(diff.sessions.localOnly[0].id).toBe("s1");
  });

  it("detects server-only sessions", () => {
    const local = makeData();
    const server = makeData({ sessions: [makeSession()] });
    const diff = computeDiff(local, server);
    expect(diff.summary.serverOnlyCount).toBe(1);
    expect(diff.sessions.serverOnly).toHaveLength(1);
  });

  it("detects session conflicts when fields differ", () => {
    const local = makeData({ sessions: [makeSession({ duration: 1000 })] });
    const server = makeData({ sessions: [makeSession({ duration: 2000 })] });
    const diff = computeDiff(local, server);
    expect(diff.sessions.conflicts).toHaveLength(1);
    expect(diff.sessions.conflicts[0].id).toBe("s1");
    expect(diff.sessions.conflicts[0].fields.length).toBeGreaterThanOrEqual(1);
  });

  it("detects local-only commits using composite key", () => {
    const local = makeData({ commits: [makeCommit()] });
    const server = makeData();
    const diff = computeDiff(local, server);
    expect(diff.commits.localOnly).toHaveLength(1);
    expect(diff.summary.localOnlyCount).toBe(1);
  });

  it("distinguishes commits by sha::repo::timestamp even with same sha", () => {
    const commit1 = makeCommit({ sha: "same", repo: "repo-a", timestamp: "T1" });
    const commit2 = makeCommit({ sha: "same", repo: "repo-b", timestamp: "T1" });
    const local = makeData({ commits: [commit1] });
    const server = makeData({ commits: [commit2] });
    const diff = computeDiff(local, server);
    expect(diff.summary.localOnlyCount).toBe(1);
    expect(diff.summary.serverOnlyCount).toBe(1);
  });

  it("detects settings conflicts for dailyGoal", () => {
    const local = makeData({ settings: { dailyGoal: 6, trackedRepos: [], gitAuthors: { identities: [], autoDetected: null } } });
    const server = makeData({ settings: { dailyGoal: 8, trackedRepos: [], gitAuthors: { identities: [], autoDetected: null } } });
    const diff = computeDiff(local, server);
    expect(diff.settings.conflicts.length).toBeGreaterThanOrEqual(1);
    const goal = diff.settings.conflicts.find((c) => c.key === "dailyGoal");
    expect(goal).toBeDefined();
    expect(goal.localValue).toBe(6);
    expect(goal.serverValue).toBe(8);
  });

  it("detects UI preference conflicts", () => {
    const local = makeData({ ui: { view: "dashboard" } });
    const server = makeData({ ui: { view: "timer" } });
    const diff = computeDiff(local, server);
    expect(diff.ui.conflicts.length).toBeGreaterThanOrEqual(1);
  });

  it("returns correct totals in summary", () => {
    const local = makeData({
      sessions: [makeSession({ id: "s1" }), makeSession({ id: "s2" })],
      commits: [makeCommit({ sha: "a" })],
    });
    const server = makeData({
      sessions: [makeSession({ id: "s1" }), makeSession({ id: "s3" })],
      commits: [makeCommit({ sha: "b" })],
    });
    const diff = computeDiff(local, server);
    expect(diff.summary.localTotal).toBe(3);
    expect(diff.summary.serverTotal).toBe(3);
    expect(diff.summary.identicalCount).toBe(1); // s1 is identical
    expect(diff.sessions.localOnly).toHaveLength(1); // s2
    expect(diff.sessions.serverOnly).toHaveLength(1); // s3
    expect(diff.commits.localOnly).toHaveLength(1); // a
    expect(diff.commits.serverOnly).toHaveLength(1); // b
  });
});

// ─── applyPush / applyPull ──────────────────────────────────────────────────

describe("applyPush / applyPull", () => {
  it("applyPush returns local data unchanged", () => {
    const local = makeData({ sessions: [makeSession()] });
    const result = applyPush(local);
    expect(result).toBe(local);
  });

  it("applyPull returns server data unchanged", () => {
    const server = makeData({ sessions: [makeSession()] });
    const result = applyPull(server);
    expect(result).toBe(server);
  });
});

// ─── applyMerge ─────────────────────────────────────────────────────────────

describe("applyMerge", () => {
  it("merges local-only and server-only sessions", () => {
    const local = makeData({ sessions: [makeSession({ id: "s1" })] });
    const server = makeData({ sessions: [makeSession({ id: "s2" })] });
    const diff = computeDiff(local, server);
    const result = applyMerge(local, server, diff, {});
    const ids = result.sessions.map((s) => s.id).sort();
    expect(ids).toEqual(["s1", "s2"]);
  });

  it("defaults to local version for unresolved conflicts", () => {
    const local = makeData({ sessions: [makeSession({ id: "s1", duration: 1000 })] });
    const server = makeData({ sessions: [makeSession({ id: "s1", duration: 2000 })] });
    const diff = computeDiff(local, server);
    const result = applyMerge(local, server, diff, {});
    expect(result.sessions[0].duration).toBe(1000);
  });

  it("picks server version when resolution says so", () => {
    const local = makeData({ sessions: [makeSession({ id: "s1", duration: 1000 })] });
    const server = makeData({ sessions: [makeSession({ id: "s1", duration: 2000 })] });
    const diff = computeDiff(local, server);
    const result = applyMerge(local, server, diff, { sessions: { s1: "server" } });
    expect(result.sessions.find((s) => s.id === "s1").duration).toBe(2000);
  });

  it("merges commits from both sides", () => {
    const local = makeData({ commits: [makeCommit({ sha: "a" })] });
    const server = makeData({ commits: [makeCommit({ sha: "b" })] });
    const diff = computeDiff(local, server);
    const result = applyMerge(local, server, diff, {});
    expect(result.commits).toHaveLength(2);
  });

  it("resolves settings conflicts using resolution map", () => {
    const local = makeData({ settings: { dailyGoal: 6, trackedRepos: [], gitAuthors: { identities: [], autoDetected: null } } });
    const server = makeData({ settings: { dailyGoal: 10, trackedRepos: [], gitAuthors: { identities: [], autoDetected: null } } });
    const diff = computeDiff(local, server);
    const result = applyMerge(local, server, diff, { settings: { dailyGoal: "server" } });
    expect(result.settings.dailyGoal).toBe(10);
  });

  it("keeps local settings when no resolution provided", () => {
    const local = makeData({ settings: { dailyGoal: 6, trackedRepos: [], gitAuthors: { identities: [], autoDetected: null } } });
    const server = makeData({ settings: { dailyGoal: 10, trackedRepos: [], gitAuthors: { identities: [], autoDetected: null } } });
    const diff = computeDiff(local, server);
    const result = applyMerge(local, server, diff, {});
    expect(result.settings.dailyGoal).toBe(6);
  });
});

// ─── previewSync ────────────────────────────────────────────────────────────

describe("previewSync", () => {
  it("push strategy warns about server-only data loss", () => {
    const local = makeData();
    const server = makeData({ sessions: [makeSession()] });
    const diff = computeDiff(local, server);
    const preview = previewSync("push", local, server, diff);
    expect(preview.strategy).toBe("push");
    expect(preview.description.some((d) => d.includes("server-only"))).toBe(true);
  });

  it("pull strategy warns about local-only data loss", () => {
    const local = makeData({ sessions: [makeSession()] });
    const server = makeData();
    const diff = computeDiff(local, server);
    const preview = previewSync("pull", local, server, diff);
    expect(preview.strategy).toBe("pull");
    expect(preview.description.some((d) => d.includes("local-only"))).toBe(true);
  });

  it("merge strategy describes additions from both sides", () => {
    const local = makeData({ sessions: [makeSession({ id: "s1" })] });
    const server = makeData({ sessions: [makeSession({ id: "s2" })] });
    const diff = computeDiff(local, server);
    const preview = previewSync("merge", local, server, diff);
    expect(preview.strategy).toBe("merge");
    expect(preview.description.some((d) => d.includes("local-only session"))).toBe(true);
    expect(preview.description.some((d) => d.includes("server-only session"))).toBe(true);
  });

  it("push with identical data says so", () => {
    const data = makeData();
    const diff = computeDiff(data, data);
    const preview = previewSync("push", data, data, diff);
    expect(preview.description[0]).toContain("identical");
  });
});

// ─── formatDiffSummary ──────────────────────────────────────────────────────

describe("formatDiffSummary", () => {
  it("reports identical sources", () => {
    const data = makeData();
    const diff = computeDiff(data, data);
    const lines = formatDiffSummary(diff);
    expect(lines).toEqual(["Both sources are identical."]);
  });

  it("reports local-only items", () => {
    const local = makeData({ sessions: [makeSession()] });
    const server = makeData();
    const diff = computeDiff(local, server);
    const lines = formatDiffSummary(diff);
    expect(lines.some((l) => l.includes("only in browser"))).toBe(true);
  });

  it("reports conflicts", () => {
    const local = makeData({ sessions: [makeSession({ id: "s1", duration: 1000 })] });
    const server = makeData({ sessions: [makeSession({ id: "s1", duration: 2000 })] });
    const diff = computeDiff(local, server);
    const lines = formatDiffSummary(diff);
    expect(lines.some((l) => l.includes("conflict"))).toBe(true);
  });
});
