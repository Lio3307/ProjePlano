# ProjePlano

A project planning interface for developers. Workspaces group projects and people;
projects bring tasks, Work views, and documents together.

This is a frontend prototype. Dashboard data stays in memory while navigating
and resets after a full page reload. There is no backend, account system,
invitation delivery, or realtime collaboration.

## Run locally

Use Node.js 24 and npm. Windows/PowerShell is the primary development environment.
On a fresh checkout, install the locked dependencies once, then start the app:

```powershell
npm.cmd ci
npm.cmd run dev
```

Open [localhost:3000](http://localhost:3000). The root route opens Workspaces.

## Data model

| Work view | Purpose | Data lifetime |
| --- | --- | --- |
| Board | A Kanban canvas containing user-created Boards and their tasks | Dashboard session |
| Calendar | All project Board tasks grouped by due date; mobile agenda or desktop month grid | Dashboard session |
| Table | Independent editable rows and columns; cells and column names are editable | Resets when that view unmounts, including when navigating away |

A project has at most one Board Work view. Its Boards share a label catalog.
Tasks derive status from their owning Board's stage; renaming a Board does not
change the stage. Task dependencies can cross Boards within a project. Documents
can link to several tasks; unlinking does not delete document content.

Table and Calendar Work views can be repeated. Calendar projects Board-owned
tasks and does not create its own task records.

## Routes and ownership

| Route | Purpose |
| --- | --- |
| `/dashboard` | Workspaces |
| `/dashboard/workspaces/[workspaceId]` | Workspace overview and projects |
| `/dashboard/workspaces/[workspaceId]/members` | Workspace member directory |
| `/dashboard/workspaces/[workspaceId]/projects/[projectId]` | Project shell |

Project query parameters select the area: `view=overview`, `view=work`,
`view=board`, `view=table`, `view=calendar`, or
`view=documents&resource=<documentId>`. A specific Work instance uses
`view=<type>&workView=<viewId>`.

| Path | Responsibility |
| --- | --- |
| `app/` | Next.js routes, server parameter validation, composition, metadata, theme |
| `components/layout/` | Dashboard navigation and shell UI |
| `components/ui/` | Shared Base UI-backed primitives and tokens |
| `features/project/` | Normalized store, selectors, transitions, query navigation, project composition |
| `features/workspace/`, `features/member/` | Workspace presentation and member management |
| `features/work-item/` | Task validation, forms, View/Edit flow, relationships and shared metadata |
| `features/kanban/`, `features/calendar/` | Controlled task presentations and drag interactions |
| `features/table/` | Independent editable-table state and presentation |
| `features/document/` | Tiptap editor, document save UI, linked-task backlinks |
| `hooks/`, `lib/` | Shared hooks and framework-independent utilities |

The dashboard layout mounts one `ProjectStoreProvider`. Feature cards receive
typed records and callbacks; they do not read the store themselves. Table owns
its local data and never seeds hidden normalized tasks. Member removal clears
related assignments atomically; roles are descriptive, not permissions.

Read [AGENTS.md](AGENTS.md) before changing code. This repository uses Next.js
16.2.12: consult its installed guides in `node_modules/next/dist/docs/` before
changing framework behavior. Follow existing ownership and component APIs.

## Verify changes

There is no `npm test` script. Run the relevant focused checks first:

```powershell
node --test features/project/project-work-navigation.test.mjs
node --test features/calendar/calendar.test.mjs
```

Full model/source suite and static checks:

```powershell
$tests = rg --files features components -g '*.test.mjs' -g '!*.integration.test.mjs'
node --test @tests
node --test package-module.test.mjs
.\node_modules\.bin\tsc.cmd --noEmit --incremental false
npm.cmd run lint
npm.cmd run build
git diff --check
```

With the development server running in another terminal:

```powershell
$integrationTests = rg --files features components -g '*.integration.test.mjs'
node --test @integrationTests
```

Live-HTML checks use `http://localhost:3000`; supported tests can override it with
`DASHBOARD_TEST_URL`. These checks do not prove browser interaction. Check mobile
navigation, dialog focus/scrolling, task and member forms, document saves, date
edits, dragging, and table editing in a browser when changing those surfaces.
