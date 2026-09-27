# ProjePlano

A personal project planning interface for developers. Workspaces group projects;
projects bring tasks, Work views, and documents together.

This is a single-user frontend prototype without members or task assignees.
Dashboard data stays in memory while navigating and resets after a full page
reload. Export/import JSON backups manually to keep a copy or move your work.
There is no automatic browser storage, database, backend, account system,
invitation delivery, or realtime collaboration. PostgreSQL is planned for a
later phase.

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
| Board | A Kanban canvas containing user-created Boards and their tasks | Dashboard session; manual JSON backup |
| Calendar | All project Board tasks grouped by due date; mobile agenda or desktop month grid | Dashboard session; manual JSON backup |
| Table | Independent editable rows and columns, stored per Work view | Dashboard session; manual JSON backup |

A project has at most one Board Work view. Its Boards share a label catalog.
Tasks derive status from their owning Board's stage; renaming a Board does not
change the stage. Enable **Completed board** in Board creation/settings to count
its tasks as done. Move tasks into it to complete them, or into an unfinished
Board to reopen them. Clearing the checkbox reopens that Board as `todo`.
Progress, overdue counts, and dependency blockers follow the same Board stage.
Task dependencies can cross Boards within a project. Documents
can link to several tasks; unlinking does not delete document content.

Table and Calendar Work views can be repeated. Calendar projects Board-owned
tasks and does not create its own task records.

Create workspaces from **New workspace**. Workspace menus edit the name and
description or delete the workspace after confirmation. Project menus edit the
name, description, and status; archive/restore; or delete after confirmation.
Archived projects appear under **Archived** in their workspace and retain their
contents and status. They are hidden from the regular project list and sidebar.
Project status is managed separately from task completion.

Deleting a project removes all its views, Boards, tasks, documents, milestones,
and Tables. Deleting a workspace removes all its projects as well. These actions
have no undo; an earlier JSON backup can restore the saved snapshot.

## Routes and ownership

| Route | Purpose |
| --- | --- |
| `/dashboard` | Workspaces |
| `/dashboard/workspaces/[workspaceId]` | Workspace overview and projects |
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
| `features/workspace/` | Workspace presentation, creation and action dialogs |
| `features/work-item/` | Task validation, forms, View/Edit flow, relationships and shared metadata |
| `features/kanban/`, `features/calendar/` | Controlled task presentations and drag interactions |
| `features/table/` | Independent editable-table state and presentation |
| `features/document/` | Tiptap editor, document save UI, linked-task backlinks |
| `hooks/`, `lib/` | Shared hooks and framework-independent utilities |

The dashboard layout mounts one `ProjectStoreProvider`. Feature cards receive
typed records and callbacks; they do not read the store themselves. Table owns
its data model and editing actions; snapshots live in the dashboard store and
never create hidden normalized tasks.

## JSON backups

Use **Backup** in the dashboard header to export or import a JSON file.
The file contains `app`, `schemaVersion`, `exportedAt`, and `data`.
Data includes workspace records/order, project archive flags, Board order, task relationships, labels,
document HTML, and Table columns, rows, status options, and attachments.

Import first validates the entire file and shows record counts. **Replace data**
then replaces all current dashboard data and discards unsaved drafts; it does
not merge. Export current data from the confirmation dialog if you want to keep
it. Cancel and invalid input leave the current data untouched. Imports return
to Workspaces and remount editors so old drafts cannot overwrite restored data.
Exports use schema version 2. Version 1 backups with the original workspace
definitions are also accepted: import migrates those workspaces into the store
and marks legacy projects as unarchived before validating all relationships.

There is no automatic save across reloads. Export before reloading or closing
the page, and import the file to resume work. Documents still require **Save**
before export; unfinished forms and unsaved document drafts are excluded.
Created/edited workspaces and archived projects are included in version 2 backups.

Table uploads embed file bytes in the backup, with a 2 MiB limit per file and
10 MiB per selection. JSON files are limited to 20 MiB. Reduce attachments if the
backup exceeds 20 MiB. External links store the
URL, not a downloaded copy of the linked website.

JSON backups are unencrypted, so store them as carefully as the documents and
files they contain. The versioned file format is separate from the store actions;
a later PostgreSQL integration can keep these import/export boundaries.

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
navigation, dialog focus/scrolling, task forms, document saves, date
edits, dragging, and table editing in a browser when changing those surfaces.
