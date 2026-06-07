/**
 * syncEngine.js — Pure diff/merge engine for DevTrack data sync.
 *
 * Computes diffs between localStorage data and server data, provides three
 * merge strategies (push, pull, merge), and generates dry-run previews.
 *
 * No React dependencies. No side effects. All functions are pure.
 */

// ─── Identity keys ───────────────────────────────────────────────────────────

function sessionKey(s) {
  return s.id;
}

function commitKey(c) {
  // Manual commits share sha="manual", so sha alone is ambiguous.
  // repo + timestamp disambiguates.
  return `${c.sha}::${c.repo}::${c.timestamp}`;
}

// ─── Field-level diff helpers ────────────────────────────────────────────────

function diffFields(localObj, serverObj) {
  const allKeys = new Set([
    ...Object.keys(localObj || {}),
    ...Object.keys(serverObj || {}),
  ]);
  const differing = [];
  for (const key of allKeys) {
    const lv = localObj?.[key];
    const sv = serverObj?.[key];
    if (JSON.stringify(lv) !== JSON.stringify(sv)) {
      differing.push({ key, localValue: lv, serverValue: sv });
    }
  }
  return differing;
}

// Compare two arrays of objects by a key function.
// Returns { localOnly, serverOnly, conflicts, identicalItems }
// identicalItems is an array (not a count) for direct use in merge.
function diffArrays(localArr, serverArr, keyFn) {
  const localMap = new Map(localArr.map((item) => [keyFn(item), item]));
  const serverMap = new Map(serverArr.map((item) => [keyFn(item), item]));

  const localOnly = [];
  const serverOnly = [];
  const conflicts = [];
  const identicalItems = [];

  // Find local-only, conflicts, and identical items
  for (const item of localArr) {
    const key = keyFn(item);
    if (!serverMap.has(key)) {
      localOnly.push(item);
    } else {
      const serverItem = serverMap.get(key);
      if (JSON.stringify(item) === JSON.stringify(serverItem)) {
        identicalItems.push(item);
      } else {
        const fields = diffFields(item, serverItem);
        conflicts.push({ id: key, local: item, server: serverItem, fields });
      }
    }
  }

  // Find server-only
  for (const item of serverArr) {
    const key = keyFn(item);
    if (!localMap.has(key)) {
      serverOnly.push(item);
    }
  }

  return { localOnly, serverOnly, conflicts, identicalItems };
}

// Diff settings object — field-by-field with special handling for nested structures
function diffSettings(localSettings, serverSettings) {
  const conflicts = [];

  // Primitive fields
  const primitiveFields = ["dailyGoal"];
  for (const field of primitiveFields) {
    const lv = localSettings?.[field];
    const sv = serverSettings?.[field];
    if (JSON.stringify(lv) !== JSON.stringify(sv)) {
      conflicts.push({ key: field, localValue: lv, serverValue: sv });
    }
  }

  // trackedRepos — compare by repo.id
  const localRepos = localSettings?.trackedRepos || [];
  const serverRepos = serverSettings?.trackedRepos || [];
  const repoDiff = diffArrays(localRepos, serverRepos, (r) => r.id);
  if (repoDiff.localOnly.length || repoDiff.serverOnly.length || repoDiff.conflicts.length) {
    conflicts.push({
      key: "trackedRepos",
      localValue: localRepos,
      serverValue: serverRepos,
      _detail: {
        localOnly: repoDiff.localOnly,
        serverOnly: repoDiff.serverOnly,
        conflictCount: repoDiff.conflicts.length,
      },
    });
  }

  // gitAuthors — compare identities by email
  const localGA = localSettings?.gitAuthors || { identities: [], autoDetected: null };
  const serverGA = serverSettings?.gitAuthors || { identities: [], autoDetected: null };

  const localIdentities = localGA.identities || [];
  const serverIdentities = serverGA.identities || [];

  const identityDiff = diffArrays(localIdentities, serverIdentities, (id) =>
    (id.email || "").toLowerCase()
  );
  const autoDetectedDiff =
    JSON.stringify(localGA.autoDetected) !== JSON.stringify(serverGA.autoDetected);

  if (
    identityDiff.localOnly.length ||
    identityDiff.serverOnly.length ||
    identityDiff.conflicts.length ||
    autoDetectedDiff
  ) {
    conflicts.push({
      key: "gitAuthors",
      localValue: localGA,
      serverValue: serverGA,
      _detail: {
        identitiesLocalOnly: identityDiff.localOnly.length,
        identitiesServerOnly: identityDiff.serverOnly.length,
        identitiesConflicts: identityDiff.conflicts.length,
        autoDetectedDiffers: autoDetectedDiff,
      },
    });
  }

  return {
    conflicts,
    identical: conflicts.length === 0,
  };
}

// Diff UI preferences — flat field-by-field
function diffUi(localUi, serverUi) {
  const conflicts = diffFields(localUi || {}, serverUi || {});
  return {
    conflicts,
    identical: conflicts.length === 0,
  };
}

// ─── Main diff function ──────────────────────────────────────────────────────

export function computeDiff(localData, serverData) {
  const sessions = diffArrays(
    localData?.sessions || [],
    serverData?.sessions || [],
    sessionKey
  );

  const commits = diffArrays(
    localData?.commits || [],
    serverData?.commits || [],
    commitKey
  );

  const settings = diffSettings(localData?.settings || {}, serverData?.settings || {});

  const ui = diffUi(localData?.ui || {}, serverData?.ui || {});

  // Counts for array items only (sessions + commits)
  const localOnlyCount =
    sessions.localOnly.length +
    commits.localOnly.length;

  const serverOnlyCount =
    sessions.serverOnly.length +
    commits.serverOnly.length;

  const conflictCount =
    sessions.conflicts.length +
    commits.conflicts.length +
    settings.conflicts.length +
    ui.conflicts.length;

  const identicalCount = sessions.identicalItems.length + commits.identicalItems.length;

  return {
    sessions,
    commits,
    settings,
    ui,
    summary: {
      localOnlyCount,
      serverOnlyCount,
      conflictCount,
      identicalCount,
      settingsDiffs: settings.conflicts.length,
      uiDiffs: ui.conflicts.length,
      localTotal: (localData?.sessions || []).length + (localData?.commits || []).length,
      serverTotal: (serverData?.sessions || []).length + (serverData?.commits || []).length,
    },
  };
}

// ─── Merge strategies ────────────────────────────────────────────────────────

export function applyPush(localData) {
  return localData;
}

export function applyPull(serverData) {
  return serverData;
}

export function applyMerge(localData, serverData, diffResult, resolutions) {
  const sessionResolutions = resolutions?.sessions || {};
  const commitResolutions = resolutions?.commits || {};
  const settingsResolution = resolutions?.settings || {};
  const uiResolution = resolutions?.ui || {};

  // Sessions: union of local-only + server-only + resolved conflicts + identical items
  const mergedSessions = [
    ...diffResult.sessions.localOnly,
    ...diffResult.sessions.serverOnly,
    ...diffResult.sessions.conflicts.map((c) =>
      sessionResolutions[c.id] === "server" ? c.server : c.local
    ),
    ...diffResult.sessions.identicalItems,
  ];

  // Commits: same union approach
  const mergedCommits = [
    ...diffResult.commits.localOnly,
    ...diffResult.commits.serverOnly,
    ...diffResult.commits.conflicts.map((c) =>
      commitResolutions[c.id] === "server" ? c.server : c.local
    ),
    ...diffResult.commits.identicalItems,
  ];

  // Settings: pick resolved values or keep local (as base) for non-conflicting fields
  const mergedSettings = { ...(localData?.settings || {}) };
  for (const conflict of diffResult.settings.conflicts) {
    const pick = settingsResolution[conflict.key];
    if (pick === "server") {
      mergedSettings[conflict.key] = conflict.serverValue;
    }
    // else keep local (already in mergedSettings via spread)
  }

  // UI: pick resolved values or keep local
  const mergedUi = { ...(localData?.ui || {}) };
  for (const conflict of diffResult.ui.conflicts) {
    const pick = uiResolution[conflict.key];
    if (pick === "server") {
      mergedUi[conflict.key] = conflict.serverValue;
    }
  }

  return {
    sessions: mergedSessions,
    commits: mergedCommits,
    settings: mergedSettings,
    ui: mergedUi,
  };
}

// ─── Dry-run preview ─────────────────────────────────────────────────────────

export function previewSync(strategy, localData, serverData, diffResult, resolutions) {
  const description = [];
  const resultSummary = { sessionsCount: 0, commitsCount: 0, changes: [] };

  if (strategy === "push") {
    const result = applyPush(localData);
    resultSummary.sessionsCount = result.sessions.length;
    resultSummary.commitsCount = result.commits.length;

    if (diffResult.summary.serverOnlyCount > 0) {
      description.push(
        `⚠ ${diffResult.commits.serverOnly.length} server-only commit(s) and ${diffResult.sessions.serverOnly.length} server-only session(s) will be lost.`
      );
    }
    if (diffResult.summary.settingsDiffs > 0) {
      description.push(
        `⚠ ${diffResult.summary.settingsDiffs} settings field(s) will be overwritten with local values.`
      );
    }
    if (diffResult.summary.uiDiffs > 0) {
      description.push(
        `⚠ ${diffResult.summary.uiDiffs} UI preference(s) will be overwritten with local values.`
      );
    }
    if (diffResult.summary.localOnlyCount > 0) {
      description.push(
        `✓ ${diffResult.sessions.localOnly.length} local session(s) and ${diffResult.commits.localOnly.length} local commit(s) will be written to disk.`
      );
    }
    if (diffResult.summary.conflictCount > 0) {
      description.push(
        `✓ ${diffResult.sessions.conflicts.length + diffResult.commits.conflicts.length} conflict(s) resolved using local version.`
      );
    }
    if (description.length === 0) {
      description.push("Disk data will be overwritten with identical local data.");
    }
    return { strategy, description, resultSummary, previewData: result };
  }

  if (strategy === "pull") {
    const result = applyPull(serverData);
    resultSummary.sessionsCount = result.sessions.length;
    resultSummary.commitsCount = result.commits.length;

    if (diffResult.summary.localOnlyCount > 0) {
      description.push(
        `⚠ ${diffResult.sessions.localOnly.length} local-only session(s) and ${diffResult.commits.localOnly.length} local-only commit(s) will be lost.`
      );
    }
    if (diffResult.summary.settingsDiffs > 0) {
      description.push(
        `⚠ ${diffResult.summary.settingsDiffs} settings field(s) will be overwritten with server values.`
      );
    }
    if (diffResult.summary.uiDiffs > 0) {
      description.push(
        `⚠ ${diffResult.summary.uiDiffs} UI preference(s) will be overwritten with server values.`
      );
    }
    if (diffResult.summary.serverOnlyCount > 0) {
      description.push(
        `✓ ${diffResult.sessions.serverOnly.length} server session(s) and ${diffResult.commits.serverOnly.length} server commit(s) will be loaded into browser.`
      );
    }
    if (description.length === 0) {
      description.push("Browser data will be overwritten with identical server data.");
    }
    return { strategy, description, resultSummary, previewData: result };
  }

  // Merge
  const result = applyMerge(localData, serverData, diffResult, resolutions || {});
  resultSummary.sessionsCount = result.sessions.length;
  resultSummary.commitsCount = result.commits.length;

  description.push(
    `✓ ${diffResult.sessions.localOnly.length} local-only session(s) added.`
  );
  description.push(
    `✓ ${diffResult.sessions.serverOnly.length} server-only session(s) added.`
  );
  description.push(
    `✓ ${diffResult.commits.localOnly.length} local-only commit(s) added.`
  );
  description.push(
    `✓ ${diffResult.commits.serverOnly.length} server-only commit(s) added.`
  );

  const sessionConflicts = diffResult.sessions.conflicts.length;
  const commitConflicts = diffResult.commits.conflicts.length;
  const settingsConflicts = diffResult.settings.conflicts.length;
  const uiConflicts = diffResult.ui.conflicts.length;

  if (sessionConflicts > 0) {
    const localPicks = diffResult.sessions.conflicts.filter(
      (c) => !resolutions?.sessions?.[c.id] || resolutions.sessions[c.id] === "local"
    ).length;
    const serverPicks = sessionConflicts - localPicks;
    description.push(
      `${sessionConflicts} session conflict(s) resolved — ${localPicks} local, ${serverPicks} server.`
    );
  }
  if (commitConflicts > 0) {
    const localPicks = diffResult.commits.conflicts.filter(
      (c) => !resolutions?.commits?.[c.id] || resolutions.commits[c.id] === "local"
    ).length;
    const serverPicks = commitConflicts - localPicks;
    description.push(
      `${commitConflicts} commit conflict(s) resolved — ${localPicks} local, ${serverPicks} server.`
    );
  }
  if (settingsConflicts > 0) {
    description.push(`${settingsConflicts} settings field(s) resolved.`);
  }
  if (uiConflicts > 0) {
    description.push(`${uiConflicts} UI preference(s) resolved.`);
  }

  return { strategy, description, resultSummary, previewData: result };
}

// ─── Human-readable summary ──────────────────────────────────────────────────

export function formatDiffSummary(diffResult) {
  const lines = [];
  const { summary } = diffResult;

  if (summary.localOnlyCount > 0) {
    lines.push(`${summary.localOnlyCount} item(s) only in browser`);
  }
  if (summary.serverOnlyCount > 0) {
    lines.push(`${summary.serverOnlyCount} item(s) only on disk`);
  }
  if (summary.conflictCount > 0) {
    lines.push(`${summary.conflictCount} conflict(s) need resolution`);
  }
  if (summary.identicalCount > 0) {
    lines.push(`${summary.identicalCount} item(s) match perfectly`);
  }

  if (lines.length === 0) {
    lines.push("Both sources are identical.");
  }

  return lines;
}
