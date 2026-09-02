<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This repository uses Next.js 16.2.12. APIs, conventions, and file structure may differ from training data.

Before changing Next.js code, read the relevant guide in `node_modules/next/dist/docs/` and follow its deprecation notices.
<!-- END:nextjs-agent-rules -->

# ProjePlano Agent Guide

This file applies to the entire repository. A more specific nested `AGENTS.md` may add local instructions if one is added later.

A nested guide must not silently relax the non-negotiable rules below. Direct user instructions always take priority.

## Start every task here

Perform these steps in order before editing:

1. Restate the requested outcome and define the smallest relevant scope.
2. Run `git status --short`. Treat every existing change as user-owned unless the current task clearly created it.
3. Read the target file completely, then inspect its direct callers, dependencies, types, styles, and relevant checks.
4. Read nearby equivalent code and reuse its established pattern.
5. For any Next.js behavior, read the relevant version-matched guide in `node_modules/next/dist/docs/` before writing code.
6. Decide how the change will be verified before implementing it.

Do not start by scanning the whole repository.

## Non-negotiable rules

### 1. Keep Git operations local and non-destructive

- Never commit or push.
- Never create, switch, rename, or delete a branch or Git worktree.
- Never reset, discard, overwrite, clean, or reformat unrelated user changes.
- Make only the edits required for the current request.

### 2. Do not change dependencies without approval

- Never install, remove, upgrade, or replace a dependency without explicit user approval.
- Do not edit `package.json` or `package-lock.json` for dependency changes before approval.
- First try the platform APIs and packages already installed. If they are insufficient, explain exactly why a new dependency is needed and wait for the user.

### 3. Fix errors honestly

- Never hide an error to make a command pass.
- Do not disable ESLint or add an unjustified `eslint-disable`.
- Do not weaken TypeScript or use an unsafe cast to suppress a real type error.
- Do not skip a required check, swallow an exception, or remove failing coverage.
- Reproduce the error, identify its root cause, and fix the source of the problem while preserving intended behavior.
- Fix errors caused by the requested change and errors inside its direct scope.
- If an unrelated pre-existing error blocks verification, do not silently expand the task. Report it precisely and ask before changing unrelated code.
- Every error report must state:
  1. the command or behavior that exposed it;
  2. the exact file and relevant function, component, symbol, or syntax;
  3. the root cause;
  4. the implemented or recommended solution; and
  5. the verification result after the fix.

### 4. Leave no dead artifacts

- Remove unused imports, variables, functions, types, components, files, folders, styles, debug output, comments, and abandoned implementations introduced or made obsolete by the task.
- Do not rely on tree-shaking to hide unused code.
- Before deleting an existing symbol or path, use a targeted repository-wide search for that exact symbol or path and check relevant framework conventions.
- Do not delete unrelated pre-existing code merely because it looks unused. Removal must be proven safe and relevant to the task.

### 5. Match the existing codebase

- Match current directory ownership, naming, formatting, import style, component APIs, Tailwind tokens, and TypeScript patterns.
- Prefer existing components and utilities over duplicate implementations.
- Prefer direct, readable code and focused helpers over speculative abstractions or overengineering.
- Keep directly affected types, callers, styles, checks, and documentation consistent with the changed contract.

### 6. Keep investigation focused

- For a fix, inspect only the target behavior and its direct dependency surface: definition, callers, types, styles, checks, and required framework documentation.
- A targeted repository-wide `rg` search for a specific symbol is allowed and is not the same as broadly reading unrelated modules.
- Expand the investigation only when concrete evidence shows that the behavior crosses another boundary.
- Do not include unrelated cleanup or refactoring without explicit approval.

### 7. Explore large areas in controlled chunks

- When asked to explore a project or folder, inspect `package.json` and relevant root configuration first.
- Use that metadata to identify the framework, scripts, aliases, package manager, generated directories, and available checks.
- Use `rg --files` or targeted directory listings. Exclude `.git`, `.next`, `node_modules`, generated output, caches, and binaries.
- Split a large codebase into coherent chunks. For each chunk, record its path, responsibility, important entry points, and relationship to already inspected areas.
- Record only validated findings in the file requested by the user.
- If no file is named, add durable repository-wide guidance to this `AGENTS.md` or a relevant existing document. Keep temporary observations in the final report instead of creating a throwaway file.
- Compare each new chunk with earlier findings and correct contradictions before presenting the final map.

## Project snapshot

ProjePlano is an early-stage project and workspace management UI. The current dashboard contains workspace, project, editable table, rich-text document, Kanban, and Calendar prototypes.

Current screens primarily use local mock data or component state. Do not assume a backend, authentication system, or persistence layer exists unless the current source proves it.

### Technology

- Next.js 16.2.12 App Router and React 19.2.4.
- Strict TypeScript with the root-based `@/*` import alias.
- Tailwind CSS 4 with shared theme rules in `app/globals.css`.
- shadcn-compatible UI primitives backed by Base UI.
- Tiptap for the document editor, dnd-kit for the Kanban and Calendar prototypes, and Lucide React for icons.
- Windows/PowerShell is the primary environment. Use `npm.cmd` and `npx.cmd` rather than their extensionless wrappers.

### Available commands

- `npm.cmd run dev` - start the Next.js development server.
- `npm.cmd run lint` - run repository-wide ESLint.
- `npm.cmd run build` - create a production build.
- `npm.cmd run start` - serve an existing production build.
- There is no automated test script in `package.json`. Never claim tests passed unless a real test command exists and was run.

## Repository map

- `app/` - App Router routes, layouts, metadata, and global styles.
  - `app/page.tsx` - minimal root route.
  - `app/dashboard/` - shared dashboard shell and workspace overview.
  - `app/dashboard/workspaces/[workspaceId]/` - workspace detail route.
  - `app/dashboard/workspaces/[workspaceId]/projects/[projectId]/` - canonical project route; project data selects the table, document, Kanban, or Calendar renderer.
- `features/` - domain-owned frontend code and typed mock boundaries.
  - `features/workspace/` - workspace types, mock data, list, and pagination.
  - `features/project/` - project types, mock data, list, and renderer selection.
  - `features/table/` - editable-table model, fixtures, state, cells, and view.
  - `features/document/` - Tiptap editor and document view.
  - `features/kanban/` - dnd-kit Kanban prototype.
  - `features/calendar/` - month-grid Calendar model, date utilities, mock tasks, local state, drag interactions, and read-only task details.
- `components/layout/` - reusable application-shell UI such as the dashboard sidebar.
- `components/ui/` - reusable low-level UI primitives. Check all consumers before changing a shared contract.
- `hooks/` - shared React hooks.
- `lib/` - framework-independent shared utilities.
- `docs/superpowers/` - existing design specifications and implementation plans.
- Root configuration - `package.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `postcss.config.mjs`, and `components.json` define project behavior and conventions.
- `.next/` and `node_modules/` are generated or dependency directories. Do not explore or edit them, except for reading `node_modules/next/dist/docs/` as required above.

## Architecture conventions

- This project uses the App Router. A folder defines a URL segment, `page.tsx` exposes a route, and `layout.tsx` supplies shared UI.
- Pages and layouts are Server Components by default. Add `"use client"` only when state, effects, event handlers, browser APIs, or a client-only library require it.
- Keep route files focused on route parameters, data selection, not-found handling, and composition.
- Use `/dashboard/workspaces/[workspaceId]` and `/dashboard/workspaces/[workspaceId]/projects/[projectId]` as the canonical entity routes. Project type is data, not a URL segment.
- Put domain UI, types, mock data, and feature-local state in the owning `features/<feature>/` folder.
- Feature presentation components receive records through typed props; they do not import their own workspace or project mock records.
- Put reusable application-shell UI in `components/layout`, domain-agnostic primitives in `components/ui`, genuinely cross-feature hooks in `hooks`, and framework-independent shared helpers in `lib`.
- Keep table, document, Kanban, and Calendar internals inside their respective features. `features/project` may select their renderer but must not absorb their implementation.
- Do not add speculative `api`, `services`, `repositories`, or feature folders. Create a folder only when it owns real code required by the current task.
- Reuse current UI primitives and design tokens before creating alternatives.

## Workflow by task type

### Bug fix

1. Reproduce the reported behavior or failing command.
2. Trace the smallest relevant call path to the root cause.
3. Compare with a working local pattern or the version-matched documentation.
4. Apply the smallest complete fix, including directly affected contracts.
5. Run a focused regression check, then the broader relevant checks.

### Feature or behavior change

1. Identify the owning route, component, state, and data boundary.
2. Inspect sibling implementations before choosing a pattern.
3. Confirm expected behavior and verification evidence.
4. Implement without speculative infrastructure.
5. Remove superseded code and verify direct consumers.

### Cleanup or deletion

1. Search for the exact symbol or path across the repository.
2. Check indirect use through framework conventions, configuration, dynamic imports, and exports.
3. Delete only after use is disproven.
4. Run the checks that could expose a broken reference.

### Project or folder exploration

1. Read package and root configuration first.
2. Establish exclusions and divide the scope into chunks.
3. Inspect entry points before implementation details.
4. Record validated findings after each chunk.
5. Reconcile contradictions and label uncertain findings explicitly.

## Verification rules

- Match checks to the change. A documentation-only change needs content review and diff checks; it does not prove application behavior.
- Start with the narrowest meaningful check for affected files. Run `npm.cmd run lint` and `npm.cmd run build` when the scope or risk warrants repository-wide validation.
- Run `git diff --check` and inspect the final diff for unintended edits, dead artifacts, debug output, and scope drift.
- Re-read every changed file after editing. Confirm that each explicit user requirement is represented by current evidence.
- Never claim lint, build, tests, runtime behavior, responsive behavior, browser QA, or manual QA unless that exact check completed successfully.

## Required final report

Every final report must include:

- **Changed:** exact files and material behavior or documentation changes.
- **Why:** the root cause or requirement addressed.
- **Verified:** exact commands or inspections run and their results.
- **Errors:** each encountered error using the five-part format from rule 3.
- **Remaining:** unverified behavior, pre-existing blockers, or follow-up work. Say `None` when nothing remains.

## Definition of done

A task is complete only when all statements below are true:

- The requested outcome is present in the current worktree.
- Direct callers, types, styles, and documentation agree with the changed behavior.
- No task-created or task-obsoleted dead artifacts remain.
- Relevant verification completed and its actual result was reviewed.
- The final diff contains no unintended or unrelated edits.
- No commit, push, branch, worktree, or unapproved dependency operation occurred.
