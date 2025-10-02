# AGENTS.md

## Dos and Don'ts
- use React with TypeScript and ensure compatibility with version 19.1.0
- use React Context and hooks for state management
- style only with Tailwind CSS classes, avoid hard-coding styles
- default to small, focused components and small diffs
- do not add new dependencies without approval
- do not hard-code colors, always use Tailwind classes
- do not copy legacy patterns from [none specified]

## Commands
- Type check a file: npx tsc --noEmit path/to/file.tsx
- Format a file: npm run lint -- path/to/file.tsx (uses ESLint for formatting)
- Lint a file: npm run lint -- path/to/file.tsx
- Run tests: [no test script available]
- Full build only if requested: npm run build

## Safety and Permissions
Allowed without prompt:
- read, list files
- single-file type check, lint, format
- Edit, create, and modify files
Ask first:
- install new packages
- delete files or folders
- push commits

## Project Structure
- Routes in src/App.tsx
- Components in src/components/
- Hooks in src/hooks/
- Utils in src/utils/
- Contexts in src/contexts/
- Functions in functions/api/
- Backend in backend/
- Assets in src/assets/
- Config in src/config.ts

## Examples
- Prefer functional components like src/components/pages/Home.tsx
- For auth, see src/contexts/AuthContext.tsx
- For hooks, see src/hooks/useFRCData.ts
- For API calls, see src/hooks/useMatchData.ts

## API Docs
- API functions in functions/api/
- Use fetch for API calls in hooks

## PR Checklist
- Lint, typecheck, build — all must be green
- Small, focused diff with summary
- Remove debug logs before PR

## When Stuck
- Ask a clarifying question or propose a short plan
- Never make large speculative changes

## Optional Test-First
- Write or update tests before new features (currently no test framework configured)