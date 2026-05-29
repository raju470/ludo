# Ludo Frontend

Frontend-only Ludo game built with Next.js.

## Project Scope

- This repository is configured as a frontend-only app.
- The backend server folder has been removed.

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Framer Motion

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. Open http://localhost:3000

## Available Scripts

```bash
npm run dev     # Start local dev server
npm run build   # Create production build
npm run start   # Run production build locally
npm run lint    # Run ESLint
```

## Project Structure

- src/app: App Router pages, layout, and global styles.
- src/pages: Additional route-based pages.
- src/components: Reusable UI components.
- public: Static assets.

## Development Workflow

1. Install dependencies.
2. Run the app in development mode.
3. Build before pushing changes.
4. Run lint checks and fix issues.

Recommended command sequence:

```bash
npm install
npm run dev
npm run lint
npm run build
```

## Routes

- / : Home page
- /game : Ludo game page

## Troubleshooting

- If development server does not start, remove node_modules and reinstall dependencies.
- If TypeScript errors appear after dependency changes, run a fresh build.
- If styles look stale, restart the dev server.
- If lint fails, run lint locally and fix warnings/errors before committing.
