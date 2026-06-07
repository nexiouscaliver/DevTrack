# ADR 002: Local-first with companion server

## Context

DevTrack needs persistent storage that survives browser data clearing. The options were: cloud backend, IndexedDB, or a local companion server.

## Decision

Use localStorage as the primary store (instant, always available) with a local Express companion server as the disk backup layer. The server runs on `127.0.0.1:9001` and is proxied through Vite during development.

## Consequences

**Benefits:**
- Zero cloud dependency — no accounts, no API keys, no network requirements
- Instant reads from localStorage — no async storage API overhead
- Disk durability via companion server — survives browser data clearing
- Simple deployment — `npm run dev` starts everything

**Costs:**
- Two sources of truth — requires a sync engine to reconcile
- Server must be running for disk backup — if only the client runs, data lives in localStorage only
- No multi-device sync — by design, but limits use cases

**Why not IndexedDB:** More complex API, larger storage but same vulnerability to browser data clearing, no path to file-system-level durability without a server.
