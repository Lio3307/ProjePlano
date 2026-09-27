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
- Apply SOLID pragmatically: give each module a focused responsibility, separate domain calculations from UI composition, and pass only the typed data and callbacks each consumer needs.
- Prefer existing components and utilities over duplicate implementations. Apply DRY to repeated behavior with real callers; keep distinct domain workflows independent.
- Use descriptive domain names and direct control flow. Use early returns and named helpers when they make a function easier to follow; comments should explain non-obvious decisions.
- Extract a component, helper, or file when it has a clear responsibility or actual reuse. Keep local helpers near their consumers and prefer composition over extra inheritance, wrappers, or configuration layers.
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

ProjePlano is an early-stage personal project and workspace management UI. The current dashboard contains workspace, project, editable project documents, a feature-local editable Table, a user-configurable Kanban canvas, a project-wide Calendar projection, and Project Overview prototypes.

The dashboard uses a dashboard-scoped in-memory project store initialized from local mock adapters, with manual JSON backup/restore. It owns normalized projects, Work views, explicit `TaskBoard` records, Board-owned work items, shared Kanban labels, and project documents. A project may own at most one Board Work view; that view is the routable Kanban canvas and owns an ordered list of any number of user-created Boards plus one shared eight-color label catalog. Each Board owns its title, description, workflow stage, position, and task order. Every normalized `WorkItem` requires a same-project Board ID and does not store duplicate status; presentation derives status from the owning Board's stage. Dependencies may cross Boards inside the same project and Kanban view, while state validation rejects foreign or cyclic relationships. Calendar and Overview aggregate Board-owned tasks across the project, and Board/Calendar cards receive resolved stage, label, and unfinished-blocker data through controlled props. Existing tasks open in a read-only View before explicit Edit, and task forms expose start/due dates plus links to project documents. Documents may be shared across tasks on different Boards and show backlinks to each related Board and task. Projects may also own repeated Table and Calendar Work views and ordered Document resources whose saved HTML lives separately in the same store. Table keeps its feature-owned columns and rows in dashboard-store snapshots keyed by Work view ID and does not seed hidden normalized work items. The primary Work area remains available when a project has no Work views and then renders a local empty state. Saved Board, task, label, document, and Table state remains frontend-only and non-realtime, with versioned manual JSON backup/restore. Data resets after reload; automatic browser storage is deferred while PostgreSQL is planned for a later phase. This is a single-user application without member directories, roles, task assignees, or invitation transport. Do not assume a backend, authentication system, server persistence layer, or realtime transport exists unless the current source proves it.

### Technology

- Next.js 16.2.12 App Router and React 19.2.4.
- Strict TypeScript with the root-based `@/*` import alias.
- Tailwind CSS 4 with shared theme rules in `app/globals.css`.
- shadcn-compatible UI primitives backed by Base UI.
- Zustand vanilla stores with React context for dashboard-scoped project state.
- Tiptap for the document editor, dnd-kit for the Kanban and Calendar prototypes, and Lucide React for icons.
- The root package declares `"type": "module"` so direct Node tests can import TypeScript ES modules without typeless-package reparsing warnings.
- Windows/PowerShell is the primary environment. Use `npm.cmd` and `npx.cmd` rather than their extensionless wrappers.

### Available commands

- `npm.cmd run dev` - start the Next.js development server.
- `npm.cmd run lint` - run repository-wide ESLint.
- `.\node_modules\.bin\tsc.cmd --noEmit --incremental false` - check TypeScript without a production build or compiler cache writes.
- `npm.cmd run build` - create a production build.
- `npm.cmd run start` - serve an existing production build.
- `node --test "path/to/file.test.mjs"` - run a focused model or source-contract test.
- `node --test "path/to/file.integration.test.mjs"` - run a focused live-HTML contract; these checks default to `http://localhost:3000` and may use `DASHBOARD_TEST_URL` when the test supports it.
- `node --test "package-module.test.mjs"` - verify direct TypeScript imports remain warning-free under the root ESM package boundary.
- There is no automated test script in `package.json`. Never claim tests passed unless a real test command exists and was run.

## Repository map

- `app/` - App Router routes, layouts, metadata, and global styles.
  - `app/page.tsx` - redirects to the dashboard workspace list.
  - `app/dashboard/` - shared dashboard shell, the single project-store provider boundary, and workspace overview.
  - `app/dashboard/workspaces/[workspaceId]/` - workspace detail, normalized project list, and project-creation entry point.
  - `app/dashboard/workspaces/[workspaceId]/projects/[projectId]/` - canonical project route; query state selects Overview, the Work area, Board, Table, Calendar, or a Document resource.
- `features/` - domain-owned frontend code and typed mock boundaries.
  - `features/workspace/` - workspace types, mock data, navigable records, and the workspace overview header.
  - `features/project/` - normalized projects, routable Work views, explicit TaskBoards, shared Kanban-label configuration, task/document relationships, ordered Document resources, seed adapters, selectors, immutable transitions, Zustand store/provider, templates, Overview, two-level query navigation, creation flows, and renderer selection.
  - `features/work-item/` - normalized Board-owned task types and validation, project-local dependency calculations, form conversion, View/Edit/Create dialog states, shared-label and project-document selectors, and shared metadata and blocker presentation.
  - `features/table/` - Notion-style editable table model, fixtures, snapshot validation, editing actions, portable attachments, cell editors, and view. Table snapshots are stored per Work view; rows are not normalized project work items.
  - `features/document/` - Tiptap editor and per-resource document view with linked Board-task backlinks; editing starts from saved store HTML and saves through a typed project callback.
  - `features/kanban/` - controlled dnd-kit projection of user-created Boards and their `WorkItem` cards, Board create/edit presentation, the shared label manager, horizontal canvas behavior, and cross-Board drag interactions; its legacy mock columns are seed-adapter input only.
  - `features/calendar/` - controlled project-wide month-grid and mobile-agenda projections over Board-owned `WorkItem` records with Board-derived stages, shared labels, date utilities, Unscheduled presentation, and due-date drag interactions; its mock tasks are seed-adapter input only.
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
- Use the project route query string for the selected area: `view=overview`, `view=work`, `view=board`, `view=table`, `view=calendar`, or `view=documents&resource=<resourceId>`. A specific Work instance uses `view=<type>&workView=<viewId>`; a type-only URL selects the first owned instance of that type for backward compatibility. `view=work` selects the first owned supported Work view or the local empty Work state when none exists. Unknown, unsupported, unowned, or type-mismatched explicit Work views fall back to Overview; an explicitly missing Document resource renders the local missing-resource state.
- Validate the workspace in the project Server Component, but resolve the project from the client store. A client-created project is intentionally absent from the server seed, so adding a server-side project `notFound()` check would break same-provider navigation.
- Mount exactly one `ProjectStoreProvider` in the persistent dashboard layout. The store owns normalized project and work-item records. Project lists, the primary sidebar, creation flow, and project shell must read the normalized store through focused selectors rather than maintaining duplicate arrays or counters.
- Keep every derived selector passed to `useProjectStore` referentially stable for the same immutable store snapshot. `useShallow` may stabilize arrays or objects containing existing record references, but it does not stabilize freshly allocated nested wrapper records; cache those derived results by snapshot and selector key in `features/project/selectors.ts`.
- Keep the persistent sidebar workspace-aware: derive its workspace context from `/dashboard/workspaces/[workspaceId]`, show its overview and projects, and fall back to the first mock workspace only on routes without a workspace segment.
- Keep the workspace overview route server-owned for parameter validation and compose its interactive header through `features/workspace`. The header presents workspace details and keeps edit/delete actions disabled until real workspace mutations exist.
- Keep the product single-user: tasks belong to Boards without assignees, and workspace/project records do not carry people or member-management state.
- Keep project creation and capability additions frontend-only and memory-only, with manual JSON backups until the later PostgreSQL phase. The five current templates are Web Application, Mobile Application, API Service, Landing Page, and Empty Project.
- Phase 2 exposes at most one Board Work view, any number of Table and Calendar Work views, and ordered Document resources per project. The Board Work view is a routable Kanban canvas containing any number of explicit Boards; adding a Board creates exactly one container and never materializes implicit status columns. The primary Work tab is permanent, and its secondary strip always ends with an accessible `+` dropdown. That dropdown offers Board only until the Kanban view exists, while Table and Calendar remain repeatable with automatic per-type titles. Work-view, Board, label, and Document IDs are generated only from their client creation events; Work tabs use the exact `workView` query, saved Document HTML is keyed by resource ID, and saved data stays in memory until reload and can be exported/imported through JSON backups. Timeline and Canvas exist only as future model concepts and must not appear in current navigation or creation controls.
- Keep primary project areas and their Work/Document subnavigation as horizontally scrollable, connected rectangular tab strips with left/right borders and vertical separators. The root document, dashboard shell, and project workspace must remain width-contained: size the dashboard main with `w-0 min-w-0 flex-1`, do not hide horizontal overflow on its ancestors, and let only the inner Kanban Board strip scroll horizontally when Boards exceed the viewport. This keeps every Board reachable while the surrounding page chrome stays fixed to the viewport width. First-Board creation is available from the Work `+` menu and empty Work state. Once the Kanban view exists, its toolbar keeps `Set labels` immediately beside `Add board`; Board settings stay on each individual Board, and Calendar does not own Board creation. Overview lists every owned Work view and keeps Document creation with Pinned resources. The Documents subnavigation uses the shared Base UI-backed dropdown to select a canonical `resource` URL and the shared Dialog/Input/Button primitives to create a document.
- Put domain UI, types, mock data, and feature-local state in the owning `features/<feature>/` folder.
- Controlled feature presentation components receive records through typed props. Each Kanban Board receives only its own normalized tasks, while the Kanban view supplies the shared label catalog. Calendar and Overview receive project-wide task aggregates with Board-derived stages. The standalone Table receives a feature-owned snapshot and functional update callback through the project bridge. Its rows never seed hidden `WorkItem` records.
- Keep shared-label, project-local dependency, date-range, and project-document selection in the shared work-item experience. Existing tasks open in read-only View before explicit Edit; Create and Edit forms expose start and due dates and may link existing project documents, while new document creation is available only for an already-saved task. In an existing task's View state, manage project documents inline beneath the Linked documents section; keep + Add Docs out of the dialog footer and do not stack a second document dialog over the task dialog. The dialog receives project tasks, shared labels, and Board-stage lookups through typed props; work items store their owning `boardId`, and project state must reject missing or cross-project references. Dependency candidates may belong to another Board in the same project, the current task must be excluded, cyclic additions must be disabled in the UI, and project state validation remains the final safeguard. Label IDs must resolve through the owning Kanban view's shared controlled eight-color catalog. Documents remain project-local, may be shared by tasks on different Boards, and unlinking a document must not delete its content. Kanban and Calendar receive computed unfinished-blocker counts through typed props; their cards must not read the project store directly. Dependencies are informative in the mockup and do not prevent Board or due-date drag changes.
- Put reusable application-shell UI in `components/layout`, domain-agnostic primitives in `components/ui`, genuinely cross-feature hooks in `hooks`, and framework-independent shared helpers in `lib`.
- Keep `DialogPrimitive.Viewport` non-scrolling. Simple dialogs may use the shared popup's bounded `overflow-y-auto` fallback; long form dialogs must override the popup with `overflow-hidden p-0` and place exactly one `no-scrollbar min-h-0 flex-1 overflow-y-auto` body between shrink-free header and footer sections. This keeps scrolling inside the dialog content while its chrome and close control remain visible.
- Keep table, document, Kanban, and Calendar internals inside their respective features. `features/project/components/project-work-view.tsx` renders the standalone Table branch and is the store-connected bridge for the controlled Kanban and Calendar renderers; `features/project` owns normalized Work-view, TaskBoard, task, label, and document state but must not absorb feature presentation implementation. Task ordering is scoped by concrete `boardId`; Calendar and Overview may aggregate tasks project-wide, while document views show exact-Board backlinks for linked tasks.
- Keep the six workflow-stage values as internal mock data for Calendar, Overview, blocker, and status presentation, but do not expose Workflow Stage in the Board create/settings form. New Boards default internally to `todo`, and editing a Board preserves its existing stage. Do not generate six Boards automatically for newly created Kanban views. Users choose how many Boards exist. Cross-Board task moves are allowed only between Boards in the same project and Kanban view. Board deletion, custom stage values, Board reordering, and automatic task-dialog deep links are outside the current scope.
- Keep `PaginationLink` as a direct anchor styled with `buttonVariants`. Do not compose it through the Base UI-backed `Button`; that previously produced different server/client `data-slot` attributes and a hydration mismatch. Preserve `components/ui/pagination.test.mjs` when changing this contract.
- Do not add speculative `api`, `services`, `repositories`, or feature folders. Create a folder only when it owns real code required by the current task.
- Reuse current UI primitives and design tokens before creating alternatives.
- Use Geist for prose and controls and Geist Mono for code. Keep ordinary form controls readable and primary actions at least 44 px high; compact editable-table controls retain their feature-owned scale. Keep the product UI focused on records, actions, concise labels, and state feedback. Do not add tutorial steps, onboarding panels, usage guides, or instructional paragraphs without an explicit user request.
- Render one Calendar presentation at a time on mobile so hidden duplicate task/action triggers cannot receive focus. Calendar shares month state, task callbacks, and controlled metadata between its agenda and grid. Document state lifetime in README: dashboard and per-view Table data stays in memory until reload; use manual JSON backup/restore, and press Save on documents before export.

- Keep backup parsing and relationship validation in `features/project/backup.ts` and `backup-schema.ts`. Validate before atomic replacement, preserve store actions, and increment the data revision to remount editors after restore. Keep export/import manual; automatic browser storage is deferred for the planned PostgreSQL phase. Use `schemaVersion` for format evolution, keep fixed workspace definitions compatible, and include portable Table file bytes. See README for limits and recovery behavior.

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
- By default, the user runs the app and performs visual/manual checks. Do not start development or production servers or launch browser QA unless the user requests agent-run runtime verification. Complete applicable static checks and report the remaining runtime gap.
- Start with the narrowest meaningful check for affected files. Run `npm.cmd run lint` and `npm.cmd run build` when the scope or risk warrants repository-wide validation.
- Rerun successful checks only when new edits, failures, or unresolved concerns justify it. Test meaningful behavior and contracts; avoid tests that only mirror formatting or implementation details.
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
