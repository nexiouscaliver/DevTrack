# Contributing to DevTrack

Thanks for your interest. Here is how to get started.

## Development Setup

```bash
git clone https://github.com/nexiouscaliver/devtrack.git
cd devtrack
npm install
npm run dev
```

Open http://localhost:9000 — the app is ready.

## Code Style

- **Plain JSX** — no TypeScript (intentional, not an oversight)
- **ESLint** flat config — run `npm run lint` before submitting
- **Tailwind CSS** — stone palette dark theme, no custom CSS files
- **Inline SVGs** — use the `Icon` component, no icon libraries
- **Conventional commits** — `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`

## Pull Request Process

1. Fork and create a feature branch from `main`
2. Make your changes
3. Run `npm run lint` and `npm run test` — fix any errors
4. Run `npm run build` — ensure the build passes
5. Submit a PR with a clear description

## Reporting Bugs

Use the [Bug Report template](https://github.com/nexiouscaliver/devtrack/issues/new?template=bug_report.yml).

## Suggesting Features

Use the [Feature Request template](https://github.com/nexiouscaliver/devtrack/issues/new?template=feature_request.yml).
