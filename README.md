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

Open a task in Board or Calendar and select **Duplicate** to prepare an editable
copy. Title, description, type, priority, estimate, labels and document links are
copied; checklist progress, start/due dates and dependencies are reset. **Create
task** saves a separate task at the end of the same Board; **Cancel** returns to
the original without saving. The copy inherits its Board's stage, including
`done` on a completed Board. Linked documents remain shared, not duplicated.

Table and Calendar Work views can be repeated. Calendar projects Board-owned
tasks and does not create its own task records.

Board and Calendar support title search plus one label, priority, and status
filter each. Search ignores case and surrounding spaces; selected criteria
combine. Status comes from the owning Board. **Clear filters** restores all
tasks, and the result count covers the whole project, including other Calendar
months and unscheduled tasks. An empty result does not delete any records.
Hidden dependencies still count as blockers, and drag positions use the complete
Board order. Filters reset when switching Work views/projects or restoring a
backup; they are not saved or exported. Table has its own independent records.

Create workspaces from **New workspace**. Workspace menus edit the name and
description or delete the workspace after confirmation. Project menus edit the
name, description, and status; archive/restore; or delete after confirmation.
Archived projects appear under **Archived** in their workspace and retain their
contents and status. They are hidden from the regular project list and sidebar.
Project status is managed separately from task completion.

Deleting a project removes all its views, Boards, tasks, documents, milestones,
and Tables. Deleting a workspace removes all its projects as well. These actions
have no undo; an earlier JSON backup can restore the saved snapshot.

Deleting a task offers **Undo** below the dashboard header, even after navigating
to another page. It restores the last deleted task at its original Board position
(or the end if the Board is now shorter), including links and incoming
dependencies, without rolling back subsequent edits. If changed references or a
dependency cycle prevent a valid restore, Undo reports an error and changes
nothing. A newer task deletion replaces the previous Undo. Reload, successful
backup import, demo reset, or deletion of the owning project/workspace clears it.
Undo history is not included in JSON backups.

## Routes and ownership

**Today** lists unfinished Board tasks across all workspaces and unarchived
projects, grouped into **Overdue** and **Due today** using the browser's local
date. It excludes undated/future tasks and completed Boards. Results sort by
oldest due date, then priority (urgent first), then task ID. Each task includes
workspace/project/Board context and **Open board** links to its Board Work view.
Click a task title to open its details, then **Edit task** to change dates,
checklist or other fields directly in Today. The dialog stays open if an edit
moves the task out of Today's date range. Duplicate, Delete and document actions
use the same dialog as Board/Calendar. On close, focus returns to the task title
or the Today list if that task is no longer visible.
Lists update from the shared in-memory store. The local date refreshes within a
minute of midnight and when the tab regains focus or visibility. Table rows and
project status do not determine task completion.

**Upcoming** lists unfinished tasks due tomorrow through seven days from today,
across all workspaces and unarchived projects. It groups tasks by due date,
earliest first, then priority and task ID within each date. Today, overdue,
undated tasks and completed Boards are excluded. It uses the same browser-local
date refresh, task details/edit dialog and focus return as Today; editing a task
out of the range updates the list without closing its dialog. Both pages share
`features/project/components/task-agenda-dashboard.tsx` and the existing store.

In Today and Upcoming, **Complete** moves a task to the end of its project's
Completed Board. With multiple Completed Boards, choose the destination from the
menu. With none, Complete is disabled; **Open board** remains available. Completion
updates agenda lists, project progress and dependency blockers through Board stage.
**Undo completion** restores the latest completed task to its original Board and
position (or the end if that Board is now shorter), preserving subsequent edits.
The notice is available on both agenda pages during the dashboard session. Undo
refuses changed source/destination stages or invalid references without changing
data. A newer completion replaces the previous Undo; moving/deleting that task,
deleting its project/workspace, importing a backup, resetting or reloading clears
it. Completion history is separate from deletion Undo and is not exported.

**Search tasks** searches titles across all workspaces and unarchived projects,
including tasks without a deadline or with a distant deadline. Matching ignores
case and surrounding spaces. An empty search lists all unfinished tasks; enable
**Include completed tasks** to include completed Boards. Results show workspace,
project, Board and status, sorted by title then task ID. Click a title to use the
same live View/Edit dialog. Search and its checkbox reset when leaving the page.

Today, Upcoming and Search tasks also provide **Workspace**, **Project** and
**Priority** filters. Criteria combine with the page's date range or search;
existing result ordering is preserved. Project options show active projects,
grouped by workspace, including projects with no matching tasks. Changing
workspace clears the project filter. Removed/archived selections show as
unavailable and return no results until cleared. **Clear filters** resets these
dropdowns and the dependency/deadline checkboxes; search text, sort order and the
completed-task checkbox remain unchanged.
Filters reset when leaving the page or restoring a backup and are not exported.

**Blocked by dependencies** on all three pages shows tasks with unfinished
dependencies, even when the blocking tasks are hidden by search, dates or filters.
Each matching row shows its blocker count. Completing or reopening a dependency
updates this projection. **No deadline** in Search tasks shows undated tasks;
it combines with the other filters and the completed-task checkbox. Search also
supports **Title A–Z**, **Earliest deadline** (undated tasks last), and **Highest
priority** (urgent first), with title and task ID as stable tie-breakers. Sorting
does not change Board order. Changing sort order clears selection; leaving the
page or importing a backup resets it to title order.

**New task** in Today/Upcoming first selects an active project and unfinished
Board, then opens the existing Create task form. The initial deadline is today
in Today and tomorrow in Upcoming; edit or clear it before saving. Empty Boards
are valid destinations. If the project has no unfinished Boards, **Open project**
opens its Work area. Cancel saves nothing; successful creation shows confirmation.

In Today, Upcoming and Search tasks, select unfinished tasks individually or use
**Select all unfinished tasks**, then **Apply deadline** to set one date for the
visible selection. Start dates and other task fields are preserved. Every record
is validated before one atomic store update: missing/completed/archived tasks,
invalid dates, invalid references or a deadline before any selected start date
reject the entire operation. Changing search/filter clears selection. Hidden
tasks are excluded, and a successful update clears selection and refreshes the
lists. Changes remain in memory and JSON backups;
no automatic persistence or backend is introduced.

The same visible unfinished-task selection supports **Apply priority** across
projects and **Move tasks** within one project. Changing any filter clears the
selection. Priority updates preserve other task fields. Moving appends tasks in
their visible list order to the chosen Board and closes gaps in the source
Boards; selected tasks already in the destination keep their positions. Board
options identify Completed Boards, where moved tasks count as done. Mixed-project
selections disable moving but still allow priority and deadline changes. Missing,
completed, archived or invalid tasks reject the entire batch without partial
writes. Success clears selection and updates the lists, project progress and
backup data. Moving a task covered by an earlier completion Undo clears that
stale completion Undo. No backup format change is required.

**Add label** and **Remove label** apply one existing shared label to the visible
selection within a single project, preserving other labels and task fields.
Mixed-project selections disable label actions. Empty catalogs show an empty
state; labels are managed through the Board's existing **Set labels** control.
Missing/foreign labels, invalid relationships, archived projects and completed
tasks reject the entire batch. Reapplying the same label operation changes nothing.

**Undo bulk change** is available on Today, Upcoming and Search tasks for the
latest successful bulk deadline, priority, Board or label change, across navigation.
It restores only affected fields and keeps later edits to other fields. Board
Undo restores original source positions, clamped to the current Board length,
without replacing entire Board lists. If affected fields, Board stages or required
references have changed, or restored dates would be invalid, Undo refuses the
whole operation. A newer successful bulk action replaces the previous history;
failed/no-op actions preserve it. Deleting an affected task or its project/workspace,
successful backup import, reset or reload clears it. History is not exported.

| Route | Purpose |
| --- | --- |
| `/dashboard` | Workspaces |
| `/dashboard/today` | Due-today and overdue tasks across projects |
| `/dashboard/upcoming` | Tasks due tomorrow through the next seven days |
| `/dashboard/search` | Title search across project tasks, regardless of deadline |
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
`features/project/components/project-work-item-dialog.tsx` connects the shared
task dialog to live project records and store actions for Board, Calendar, Today,
Upcoming and Search tasks, including agenda task creation.

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

After saved dashboard data changes, closing/reloading the page or navigating away
from the app requests the browser's native leave-page warning. Internal dashboard
navigation does not trigger it. The warning clears when a backup download starts
without an error, after a valid import, or after resetting the demo. Creating JSON
alone, failed/oversized exports and invalid imports do not clear it. A later edit
enables it again; undoing edits may still require another export. Unfinished forms
are not tracked. The open document separately warns on reload/close while its
content differs from the saved version, including after a failed Save or after
exporting store data. Saving or reverting the draft clears that document warning;
saved but unexported store changes still warn. Internal navigation away from a
document discards its draft and removes its warning. The browser
controls the warning text and may not show it on mobile or after a crash. Download
completion/cancellation cannot be detected, so confirm the JSON file was saved.

The header beside **Backup** shows **Changes not exported** when store data has
changed, otherwise the local time the last download started, or **No changes to
export** before a download. It tracks store data, not document drafts. Download
time remains across dashboard navigation and resets on reload, valid import or
demo reset; failed/oversized exports do not update it. It is not saved in backups
and does not confirm that the file was written to disk.

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
