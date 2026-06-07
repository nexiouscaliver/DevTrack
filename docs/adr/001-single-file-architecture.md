# ADR 001: Single-file frontend architecture

## Context

DevTrack's frontend is a single `App.jsx` file (~6,000 lines) containing all components, state, and utilities. This is unconventional for a React application.

## Decision

Keep all frontend code in a single file during the initial development phase. The application is a solo-developer SPA with no shared component library, no external consumers, and a single deployment target.

## Consequences

**Benefits:**
- Zero import resolution overhead — every component has full context
- Fastest possible iteration — no file switching during feature development
- Trivial git blame — every change is in one file
- No circular dependency risk between components

**Costs:**
- Poor code navigation — finding a specific component requires search
- Larger PR diffs — changes touch the same file
- Onboarding friction — new contributors must orient in a large file

**When to split:** When a second contributor joins, or when a component is reused across views, or when the file exceeds 10,000 lines. Extraction priority: utility functions first, then shared components, then view components.
