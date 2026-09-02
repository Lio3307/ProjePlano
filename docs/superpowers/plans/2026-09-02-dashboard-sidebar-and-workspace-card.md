# Dashboard Sidebar and Workspace Card Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace broken placeholder sidebar navigation with a compact workspace-first shell and separate the workspace card navigation target from its ellipsis action menu.

**Architecture:** Keep `app/dashboard/layout.tsx` as the Server Component data-selection boundary and pass serializable workspace/project navigation records into the client-owned `AppSidebar`. Keep all visual composition inside the existing shadcn-compatible sidebar and card primitives; fix the card root cause by rendering its Next.js link and Base UI dropdown as sibling interactive controls.

**Tech Stack:** Next.js 16.2.12 App Router, React 19.2.4, strict TypeScript, Tailwind CSS 4, shadcn-compatible Base UI primitives, Lucide React, and the Node 24 built-in test runner.

**Execution status (2026-09-02):** Implementation, automated checks, production build, source audits, and live HTML verification passed. Interactive browser QA is pending because the browser runtime failed twice with `failed to write kernel assets: The system cannot find the path specified. (os error 3)`.

## Global Constraints

- Preserve every pre-existing staged and unstaged worktree change as user-owned.
- Do not commit, push, create or switch branches, or create a worktree.
- Do not install, remove, upgrade, or replace dependencies.
- Keep `/dashboard`, `/dashboard/workspaces/[workspaceId]`, and `/dashboard/workspaces/[workspaceId]/projects/[projectId]` as the only sidebar destinations.
- Keep project type as data rather than adding type-specific URL segments.
- Pass only serializable strings and project-type values from the Server Component layout to the client sidebar.
- Do not modify `components/ui/sidebar.tsx`, project/workspace records, route files, global theme tokens, or feature data contracts.
- Keep the workspace Edit and Delete menu items frontend-only and behaviorless.
- Use current sidebar, background, foreground, muted, primary, border, and ring tokens.
- Preserve desktop expanded/icon-collapsed modes, the mobile sheet, tooltips, `Ctrl+B`, and Calendar/Kanban horizontal scrolling.
- Generic commit steps are intentionally omitted because repository instructions prohibit commits.

---

## File map

**Create:**

- `components/layout/app-sidebar.integration.test.mjs` - live HTML contract tests for valid sidebar links and exact active state.
- `features/workspace/workspace-list.integration.test.mjs` - live HTML regression test proving card navigation and dropdown actions are sibling controls.

**Modify:**

- `components/layout/app-sidebar.tsx` - product identity, Overview, workspace overview, project-type navigation, active state, and collapse rail.
- `app/dashboard/layout.tsx` - serializable sidebar data composition and aligned top bar.
- `features/workspace/components/workspace-list.tsx` - valid sibling structure for card navigation and action menu.
- `docs/superpowers/specs/2026-09-02-dashboard-sidebar-and-workspace-card-design.md` - final implementation status after verification.
- `docs/superpowers/plans/2026-09-02-dashboard-sidebar-and-workspace-card.md` - execution progress and browser-QA note.

---

### Task 1: Add live HTML regression coverage

**Files:**

- Create: `components/layout/app-sidebar.integration.test.mjs`
- Create: `features/workspace/workspace-list.integration.test.mjs`

**Interfaces:**

- Consumes: a running ProjePlano development server at `DASHBOARD_TEST_URL` or `http://localhost:3000`.
- Produces: Node tests for valid sidebar destinations, exact active state, workspace card links, and non-nested dropdown triggers.

- [x] **Step 1: Confirm the active development-server owner**

Run:

```powershell
Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue | Select-Object LocalAddress, LocalPort, OwningProcess
```

If port 3000 is already serving this repository, reuse it and do not stop it. If no server is running, start one in an owned terminal with:

```powershell
npm.cmd run dev
```

Expected: the server reports Next.js 16.2.12 and a local URL. Record a non-3000 URL in `DASHBOARD_TEST_URL` before running tests:

```powershell
$env:DASHBOARD_TEST_URL = "http://localhost:3001"
```

- [x] **Step 2: Add the failing sidebar integration test**

Create `components/layout/app-sidebar.integration.test.mjs`:

```js
import assert from "node:assert/strict"
import test from "node:test"

const BASE_URL =
  process.env.DASHBOARD_TEST_URL ?? "http://localhost:3000"

const VALID_SIDEBAR_HREFS = [
  "/dashboard",
  "/dashboard/workspaces/project-alpha",
  "/dashboard/workspaces/project-alpha/projects/1",
  "/dashboard/workspaces/project-alpha/projects/2",
  "/dashboard/workspaces/project-alpha/projects/3",
  "/dashboard/workspaces/project-alpha/projects/4",
  "/dashboard/workspaces/project-alpha/projects/5",
  "/dashboard/workspaces/project-alpha/projects/6",
]

const UNSUPPORTED_SIDEBAR_HREFS = [
  "/dashboard/tasks",
  "/dashboard/team",
  "/dashboard/calendar",
  "/dashboard/messages",
  "/dashboard/settings",
]

const ACTIVE_ROUTES = [
  { pathname: "/dashboard", href: "/dashboard" },
  {
    pathname: "/dashboard/workspaces/project-alpha",
    href: "/dashboard/workspaces/project-alpha",
  },
  {
    pathname: "/dashboard/workspaces/project-alpha/projects/6",
    href: "/dashboard/workspaces/project-alpha/projects/6",
  },
]

test("renders only implemented sidebar destinations", async () => {
  const html = await getHtml("/dashboard")
  const sidebarAnchors = getSidebarAnchors(html)

  for (const href of VALID_SIDEBAR_HREFS) {
    assert.ok(
      sidebarAnchors.some((anchor) => hasHref(anchor, href)),
      "Missing sidebar destination: " + href
    )
  }

  for (const href of UNSUPPORTED_SIDEBAR_HREFS) {
    assert.equal(
      sidebarAnchors.some((anchor) => hasHref(anchor, href)),
      false,
      "Unsupported sidebar destination: " + href
    )
  }
})

test("marks exactly one canonical destination active", async () => {
  for (const route of ACTIVE_ROUTES) {
    const html = await getHtml(route.pathname)
    const activeAnchors = getSidebarAnchors(html).filter((anchor) =>
      /\sdata-active(?:=""|(?=\s|>))/.test(anchor)
    )

    assert.equal(activeAnchors.length, 1, route.pathname)
    assert.equal(hasHref(activeAnchors[0], route.href), true)
    assert.equal(activeAnchors[0].includes('aria-current="page"'), true)
  }
})

async function getHtml(pathname) {
  const response = await fetch(new URL(pathname, BASE_URL))

  assert.equal(response.status, 200, pathname)

  return response.text()
}

function getSidebarAnchors(html) {
  return getAnchors(html).filter((anchor) =>
    anchor.includes('data-sidebar="menu-button"')
  )
}

function getAnchors(html) {
  return html.match(/<a\b[^>]*>[\s\S]*?<\/a>/g) ?? []
}

function hasHref(anchor, href) {
  return anchor.includes('href="' + href + '"')
}
```

- [x] **Step 3: Add the failing workspace-card integration test**

Create `features/workspace/workspace-list.integration.test.mjs`:

```js
import assert from "node:assert/strict"
import test from "node:test"

const BASE_URL =
  process.env.DASHBOARD_TEST_URL ?? "http://localhost:3000"

const WORKSPACE_HREFS = [
  "/dashboard/workspaces/project-alpha",
  "/dashboard/workspaces/project-beta",
  "/dashboard/workspaces/project-gamma",
  "/dashboard/workspaces/project-delta",
  "/dashboard/workspaces/project-echo",
  "/dashboard/workspaces/project-foxtrot",
]

test("keeps workspace actions outside workspace navigation links", async () => {
  const html = await getHtml("/dashboard")
  const workspaceCardLinks = getWorkspaceCardLinks(html)
  const workspaceActionButtons = getWorkspaceActionButtons(html)

  assert.equal(workspaceCardLinks.length, WORKSPACE_HREFS.length)
  assert.equal(workspaceActionButtons.length, WORKSPACE_HREFS.length)

  for (const href of WORKSPACE_HREFS) {
    const link = workspaceCardLinks.find((anchor) =>
      anchor.includes('href="' + href + '"')
    )

    assert.ok(link, "Missing workspace card link: " + href)
    assert.equal(
      link.includes('aria-haspopup="menu"'),
      false,
      "Dropdown trigger is nested inside: " + href
    )
  }
})

async function getHtml(pathname) {
  const response = await fetch(new URL(pathname, BASE_URL))

  assert.equal(response.status, 200, pathname)

  return response.text()
}

function getWorkspaceCardLinks(html) {
  return getAnchors(html).filter(
    (anchor) =>
      /href="\/dashboard\/workspaces\/[^"/]+"/.test(anchor) &&
      anchor.includes('data-slot="card"')
  )
}

function getWorkspaceActionButtons(html) {
  return (
    html.match(
      /<button\b[^>]*aria-label="Open actions for [^"]+"[^>]*aria-haspopup="menu"[^>]*>/g
    ) ?? []
  )
}

function getAnchors(html) {
  return html.match(/<a\b[^>]*>[\s\S]*?<\/a>/g) ?? []
}
```

- [x] **Step 4: Run both tests and verify the red state**

Run:

```powershell
node --test "components/layout/app-sidebar.integration.test.mjs" "features/workspace/workspace-list.integration.test.mjs"
```

Expected: exit 1. The sidebar test reports missing canonical workspace/project destinations or unsupported placeholder destinations, and the workspace test reports a dropdown trigger nested inside a workspace link.

---

### Task 2: Separate workspace navigation from the action menu

**Files:**

- Modify: `features/workspace/components/workspace-list.tsx`
- Test: `features/workspace/workspace-list.integration.test.mjs`

**Interfaces:**

- Consumes: `Workspace[]`, Next.js `Link`, shared `Button`, `Card`, and `DropdownMenu` primitives.
- Produces: one full-card workspace link and one sibling dropdown trigger per workspace.

- [x] **Step 1: Re-read the live workspace list before editing**

Run:

```powershell
Get-Content -Raw -LiteralPath "features/workspace/components/workspace-list.tsx"
```

Confirm the current `Link > Card > DropdownMenuTrigger` nesting is still present and preserve unrelated user changes.

- [x] **Step 2: Replace the nested interaction with sibling controls**

Replace `features/workspace/components/workspace-list.tsx` with:

```tsx
import { EllipsisVertical, Pencil, Trash2 } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import type { Workspace } from "../types"
import { WorkspacePagination } from "./workspace-pagination"

type WorkspaceListProps = {
  workspaces: Workspace[]
}

export function WorkspaceList({ workspaces }: WorkspaceListProps) {
  if (workspaces.length === 0) {
    return (
      <div className="flex items-center justify-center">
        <p className="text-lg text-muted-foreground">No workspaces found</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {workspaces.map((workspace) => (
          <div key={workspace.id} className="relative">
            <Link
              href={`/dashboard/workspaces/${workspace.id}`}
              aria-label={"Open " + workspace.title}
              className="block h-full rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Card className="h-full transition-colors hover:bg-muted/40">
                <CardHeader className="pr-12">
                  <CardTitle>{workspace.title}</CardTitle>
                  <CardDescription>{workspace.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    BY {workspace.author}
                  </p>
                </CardContent>
              </Card>
            </Link>

            <div className="absolute top-2 right-2 z-10">
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={"Open actions for " + workspace.title}
                    />
                  }
                >
                  <EllipsisVertical aria-hidden="true" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Pencil /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem variant="destructive">
                    <Trash2 /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>
      <WorkspacePagination />
    </>
  )
}
```

- [x] **Step 3: Run the workspace-card test and verify green**

Run:

```powershell
node --test "features/workspace/workspace-list.integration.test.mjs"
```

Expected: 1 test passes, 0 fail. The rendered dashboard contains six workspace card links and six dropdown triggers, with no trigger inside a card link.

- [x] **Step 4: Run focused ESLint for the workspace change**

Run:

```powershell
node node_modules/eslint/bin/eslint.js "features/workspace/components/workspace-list.tsx"
```

Expected: exit 0 with no ESLint errors.

---

### Task 3: Implement the workspace-first sidebar shell

**Files:**

- Modify: `components/layout/app-sidebar.tsx`
- Modify: `app/dashboard/layout.tsx`
- Test: `components/layout/app-sidebar.integration.test.mjs`

**Interfaces:**

- Consumes: `ProjectType`, serializable `workspace` and `projects` props, `usePathname`, Next.js `Link`, and the current sidebar primitives.
- Produces: `AppSidebar({ workspace, projects })`, valid canonical links, exact `aria-current` state, type icons, product identity, and collapse rail.

- [x] **Step 1: Re-read both live shell files immediately before editing**

Run:

```powershell
Get-Content -Raw -LiteralPath "components/layout/app-sidebar.tsx"
Get-Content -Raw -LiteralPath "app/dashboard/layout.tsx"
```

Confirm no newer user changes overlap the planned blocks.

- [x] **Step 2: Replace placeholder navigation with the workspace-first sidebar**

Replace `components/layout/app-sidebar.tsx` with:

```tsx
"use client"

import type { LucideIcon } from "lucide-react"
import {
  CalendarDays,
  Columns3,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Table2,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import type { ProjectType } from "@/features/project/types"

const PROJECT_TYPE_ICONS: Record<ProjectType, LucideIcon> = {
  document: FileText,
  kanban: Columns3,
  table: Table2,
  calendar: CalendarDays,
}

interface SidebarWorkspace {
  title: string
  url: string
}

interface SidebarProject {
  title: string
  type: ProjectType
  url: string
}

interface AppSidebarProps {
  workspace: SidebarWorkspace | null
  projects: SidebarProject[]
}

export function AppSidebar({ workspace, projects }: AppSidebarProps) {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip="ProjePlano"
              render={
                <Link href="/dashboard" aria-label="ProjePlano dashboard" />
              }
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-xs font-semibold text-sidebar-primary-foreground">
                P
              </span>
              <span className="grid min-w-0 flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate text-sm font-semibold">
                  ProjePlano
                </span>
                <span className="truncate text-[10px] text-sidebar-foreground/60">
                  Project workspace
                </span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="py-1">
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarNavigationItem
                title="Overview"
                url="/dashboard"
                icon={LayoutDashboard}
                isActive={pathname === "/dashboard"}
              />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {workspace ? (
          <SidebarGroup>
            <SidebarGroupLabel>{workspace.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarNavigationItem
                  title="Workspace overview"
                  url={workspace.url}
                  icon={FolderKanban}
                  isActive={pathname === workspace.url}
                />
                {projects.map((project) => (
                  <SidebarNavigationItem
                    key={project.url}
                    title={project.title}
                    url={project.url}
                    icon={PROJECT_TYPE_ICONS[project.type]}
                    isActive={pathname === project.url}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  )
}

function SidebarNavigationItem({
  icon: Icon,
  isActive,
  title,
  url,
}: {
  icon: LucideIcon
  isActive: boolean
  title: string
  url: string
}) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        tooltip={title}
        isActive={isActive}
        render={
          <Link
            href={url}
            aria-current={isActive ? "page" : undefined}
          />
        }
      >
        <Icon aria-hidden="true" />
        <span>{title}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}
```

- [x] **Step 3: Pass serializable navigation data and align the top bar**

Replace `app/dashboard/layout.tsx` with:

```tsx
import { AppSidebar } from "@/components/layout/app-sidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { getProjectsByWorkspaceId } from "@/features/project/mock-data"
import { getWorkspaceById } from "@/features/workspace/mock-data"

const PRIMARY_WORKSPACE_ID = "project-alpha"
const primaryWorkspace = getWorkspaceById(PRIMARY_WORKSPACE_ID)

const sidebarWorkspace = primaryWorkspace
  ? {
      title: primaryWorkspace.title,
      url: `/dashboard/workspaces/${primaryWorkspace.id}`,
    }
  : null

const sidebarProjects = primaryWorkspace
  ? getProjectsByWorkspaceId(primaryWorkspace.id).map((project) => ({
      title: project.title,
      type: project.type,
      url: `/dashboard/workspaces/${project.workspaceId}/projects/${project.id}`,
    }))
  : []

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <SidebarProvider>
      <AppSidebar
        workspace={sidebarWorkspace}
        projects={sidebarProjects}
      />
      <main className="flex min-h-svh min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-12 shrink-0 items-center border-b bg-background px-3">
          <SidebarTrigger />
        </header>
        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </main>
    </SidebarProvider>
  )
}
```

- [x] **Step 4: Run the sidebar test and verify green**

Run:

```powershell
node --test "components/layout/app-sidebar.integration.test.mjs"
```

Expected: 2 tests pass, 0 fail. The HTML contains Overview, the workspace overview, all six projects, no unsupported placeholder routes, and exactly one `aria-current="page"` item on each tested route.

- [x] **Step 5: Run focused ESLint for the shell change**

Run:

```powershell
node node_modules/eslint/bin/eslint.js "components/layout/app-sidebar.tsx" "app/dashboard/layout.tsx"
```

Expected: exit 0 with no ESLint errors.

---

### Task 4: Verify the combined source contract

**Files:**

- Review: `components/layout/app-sidebar.integration.test.mjs`
- Review: `features/workspace/workspace-list.integration.test.mjs`
- Review: `components/layout/app-sidebar.tsx`
- Review: `app/dashboard/layout.tsx`
- Review: `features/workspace/components/workspace-list.tsx`

**Interfaces:**

- Produces: fresh focused integration, lint, and TypeScript evidence before repository-wide checks.

- [x] **Step 1: Run both live integration tests together**

Run:

```powershell
node --test "components/layout/app-sidebar.integration.test.mjs" "features/workspace/workspace-list.integration.test.mjs"
```

Expected: 3 tests pass, 0 fail, 0 skipped, and 0 cancelled.

- [x] **Step 2: Run focused ESLint over every changed source and test file**

Run:

```powershell
node node_modules/eslint/bin/eslint.js "components/layout/app-sidebar.integration.test.mjs" "features/workspace/workspace-list.integration.test.mjs" "components/layout/app-sidebar.tsx" "app/dashboard/layout.tsx" "features/workspace/components/workspace-list.tsx"
```

Expected: exit 0 with no ESLint errors.

- [x] **Step 3: Run the strict TypeScript compiler**

Run:

```powershell
npx.cmd tsc --noEmit
```

Expected: exit 0 with no TypeScript errors.

- [x] **Step 4: Audit the final source contract**

Run:

```powershell
rg -n "dashboard/(tasks|team|calendar|messages|settings)|Recent Projects|SidebarFooter|CardAction|className=\"contents\"|stopPropagation|preventDefault" "components/layout/app-sidebar.tsx" "features/workspace/components/workspace-list.tsx"
```

Expected: no output. The source contains no unsupported route, obsolete group/footer, nested-card workaround, or event-cancellation patch.

Run:

```powershell
rg -n "Workspace overview|PROJECT_TYPE_ICONS|SidebarRail|aria-current|Open actions for|focus-visible:ring" "components/layout/app-sidebar.tsx" "features/workspace/components/workspace-list.tsx"
```

Expected: each approved navigation, collapse, active-state, action-label, and focus contract is represented.

---

### Task 5: Run repository verification and close documentation status

**Files:**

- Review: every file listed in the plan file map.
- Modify after gates: `docs/superpowers/specs/2026-09-02-dashboard-sidebar-and-workspace-card-design.md`
- Modify after gates: `docs/superpowers/plans/2026-09-02-dashboard-sidebar-and-workspace-card.md`

**Interfaces:**

- Produces: repository-wide lint/build/diff evidence, live route evidence, available browser evidence, and an accurate documentation status.

- [x] **Step 1: Run repository-wide ESLint**

Run:

```powershell
npm.cmd run lint
```

Expected: exit 0. If an unrelated pre-existing error blocks the command, report its command, file/symbol, root cause, recommended solution, and actual result without expanding scope silently.

- [x] **Step 2: Run the production build**

Run:

```powershell
npm.cmd run build
```

Expected: exit 0 with `/dashboard`, `/dashboard/workspaces/[workspaceId]`, and `/dashboard/workspaces/[workspaceId]/projects/[projectId]` in the route output.

- [x] **Step 3: Run whitespace, dependency, hygiene, and scope checks**

Run:

```powershell
git diff --check
git diff -- package.json package-lock.json
rg -n "[T]ODO|[T]BD|console\.(log|debug)|eslint-disable|as unknown as" "components/layout/app-sidebar.tsx" "app/dashboard/layout.tsx" "features/workspace/components/workspace-list.tsx" "components/layout/app-sidebar.integration.test.mjs" "features/workspace/workspace-list.integration.test.mjs"
rg -n "[ \t]+$" "components/layout/app-sidebar.tsx" "app/dashboard/layout.tsx" "features/workspace/components/workspace-list.tsx" "components/layout/app-sidebar.integration.test.mjs" "features/workspace/workspace-list.integration.test.mjs"
git status --short
```

Expected: no whitespace error, no dependency diff, no task-created hygiene match, and only user-owned pre-existing changes plus the approved sidebar/card files and documents.

- [x] **Step 4: Re-read every task-owned file and audit acceptance criteria**

Read:

```text
components/layout/app-sidebar.integration.test.mjs
features/workspace/workspace-list.integration.test.mjs
components/layout/app-sidebar.tsx
app/dashboard/layout.tsx
features/workspace/components/workspace-list.tsx
docs/superpowers/specs/2026-09-02-dashboard-sidebar-and-workspace-card-design.md
docs/superpowers/plans/2026-09-02-dashboard-sidebar-and-workspace-card.md
```

Confirm exact route strings, project type icons, serializable props, active-state rules, interactive sibling structure, accessible labels, focus classes, responsive sidebar primitives, and documentation all agree. Confirm no shared primitive, route, feature data contract, global CSS, dependency manifest, or unrelated user file changed.

- [x] **Step 5: Verify live HTML on all representative routes**

With the development server running, request:

```powershell
$dashboard = Invoke-WebRequest -UseBasicParsing "http://localhost:3000/dashboard"
$workspace = Invoke-WebRequest -UseBasicParsing "http://localhost:3000/dashboard/workspaces/project-alpha"
$calendar = Invoke-WebRequest -UseBasicParsing "http://localhost:3000/dashboard/workspaces/project-alpha/projects/6"
[pscustomobject]@{
  DashboardStatus = $dashboard.StatusCode
  WorkspaceStatus = $workspace.StatusCode
  CalendarStatus = $calendar.StatusCode
  HasBrand = $dashboard.Content.Contains("ProjePlano")
  HasWorkspaceOverview = $dashboard.Content.Contains("Workspace overview")
  HasReleaseCalendar = $dashboard.Content.Contains("Release Calendar")
  HasWorkspaceAction = $dashboard.Content.Contains("Open actions for Project Alpha")
} | Format-List
```

Expected: every status is 200 and every content check is `True`.

- [ ] **Step 6: Run interactive browser verification when tooling is available**

Pending: the browser runtime failed twice with `failed to write kernel assets: The system cannot find the path specified. (os error 3)`. No pointer, keyboard, collapsed, or mobile claim is inferred from automated checks.

Verify:

1. Expanded desktop shows the product identity, Overview, Project Alpha, workspace overview, and all six projects.
2. No Tasks, Team, global Calendar, Messages, or Settings placeholder item appears.
3. Overview, workspace overview, and Release Calendar each become the only active item on their route.
4. Collapsed desktop shows a recognizable product mark and one icon per destination with tooltips.
5. The sidebar rail, top-bar trigger, and `Ctrl+B` toggle the sidebar.
6. The mobile trigger opens the sheet and all valid destinations remain usable.
7. Clicking any workspace card body navigates to its canonical workspace route.
8. Clicking a workspace ellipsis opens its menu and leaves the current URL unchanged.
9. Edit and Delete do not trigger workspace navigation.
10. Keyboard focus is visible on the card link, action trigger, sidebar links, and collapse trigger.
11. Calendar and Kanban horizontal scrolling remain contained after the shell change.

If browser tooling cannot initialize, capture the exact tool error and keep interaction/responsive QA pending. Do not substitute lint, build, tests, or live HTML for pointer and keyboard checks.

- [x] **Step 7: Update the spec status from actual evidence**

If all automated, live HTML, and interactive browser gates pass, replace:

```text
Status: Approved for implementation
```

with:

```text
Status: Implemented and verified
```

If browser verification is unavailable but every other gate passes, use:

```text
Status: Implemented; browser QA pending
```

- [x] **Step 8: Re-run documentation and final diff checks**

Run:

```powershell
rg -n "[T]BD|[T]ODO|[P]LACEHOLDER|[W]ritten-spec review pending" "docs/superpowers/specs/2026-09-02-dashboard-sidebar-and-workspace-card-design.md" "docs/superpowers/plans/2026-09-02-dashboard-sidebar-and-workspace-card.md"
git diff --check
git status --short
```

Expected: the documentation scan has no output, `git diff --check` exits 0, and final status contains no unintended scope expansion.

- [x] **Step 9: Stop only a development server started by this task**

Completed: the active development server was started by the user and remains running.

If Task 1 started the server, stop that owned process and verify its port no longer listens. If the server predated this task, leave it running.

---
