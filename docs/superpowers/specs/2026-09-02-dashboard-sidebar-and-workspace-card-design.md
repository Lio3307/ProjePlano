# Dashboard Sidebar and Workspace Card Design

Date: 2026-09-02
Status: Implemented; browser QA pending

## Objective

Make the dashboard shell easier to scan and navigate while fixing the workspace card action menu so its trigger opens the menu without navigating to the workspace.

The change must keep the current frontend-only architecture, shadcn-compatible primitives, canonical routes, mock data, and collapsible mobile and desktop sidebar behavior.

## Approved outcomes

The user approved these product decisions:

- use a compact workspace-first sidebar;
- remove navigation links whose routes do not exist;
- expose the active mock workspace and all of its projects;
- give each project a recognizable icon based on its type;
- preserve the existing collapsed icon mode and mobile drawer;
- make the sidebar header and dashboard top bar visually clearer;
- keep the workspace card body navigable;
- make the workspace card ellipsis trigger open its menu without changing the URL; and
- keep the implementation readable, local, and free of new dependencies.

## Current evidence

The dashboard currently exposes only these routes:

- `/dashboard`;
- `/dashboard/workspaces/[workspaceId]`; and
- `/dashboard/workspaces/[workspaceId]/projects/[projectId]`.

The current sidebar also links to `/dashboard/tasks`, `/dashboard/team`, `/dashboard/calendar`, `/dashboard/messages`, and `/dashboard/settings`. Those routes do not exist. The `Recent Projects` group takes the first three mock projects, so it hides later records including the Calendar project and does not represent actual recency.

The sidebar is already built from `components/ui/sidebar.tsx`, which provides the collapsible desktop sidebar, mobile sheet, tooltips, active menu styling, keyboard shortcut, and rail primitive. The shared primitive does not need to change.

The workspace grid currently wraps each complete `Card` in a Next.js `Link`. Its Base UI dropdown trigger is rendered inside that link. This creates nested interactive controls, so activating the ellipsis can also activate the parent link and navigate away.

## Considered sidebar approaches

### Workspace-first compact sidebar

Show the product identity, an Overview link, one active workspace context, and every project belonging to that workspace.

Advantages:

- all links resolve to current routes;
- every implemented project type remains discoverable;
- active state maps directly to the canonical route;
- type icons remain useful in collapsed mode; and
- the structure stays explicit and small.

Trade-off:

- it presents one workspace context rather than a general workspace switcher.

### Workspace switcher

Place a workspace selector in the header and show projects for the selected workspace.

Advantages:

- scales to many populated workspaces; and
- keeps one project list visible at a time.

Trade-offs:

- only Project Alpha currently has project records;
- selection state would add behavior not required by the current mockup; and
- empty workspaces would make the sidebar appear incomplete.

### Minimal recent-project list

Show Overview and only a small number of recent projects.

Advantages:

- visually compact; and
- requires little data shaping.

Trade-offs:

- the mock data has no real recency signal;
- useful project types can remain hidden; and
- the current problem would return when more projects are added.

## Sidebar decision

Use the workspace-first compact sidebar.

This is the smallest truthful navigation model for the routes and data that exist today. A workspace switcher can be introduced later if multiple workspaces own real project records.

## Sidebar information architecture

### Product header

The header contains:

- a compact primary-colored product mark containing `P`;
- the `ProjePlano` wordmark; and
- a subdued `Project workspace` description.

The mark remains visible when collapsed. The wordmark and description hide through the existing sidebar collapse state. The header is a link to `/dashboard` and retains a tooltip in icon mode.

### Overview group

Render one `Overview` item linked to `/dashboard`.

It is active only on the exact dashboard route. Removing the placeholder Tasks, Team, Calendar, Messages, and Settings links prevents navigation to known 404 pages.

### Workspace group

Render a group labeled `Project Alpha` using current mock data rather than duplicated display strings.

The first item is `Workspace overview`, linked to `/dashboard/workspaces/project-alpha`.

Render every Project Alpha project below it as a flat menu item. A flat list is preferred over `SidebarMenuSub` because the existing sub-menu primitive hides its contents in collapsed mode.

Project icon mapping:

- document: file-text icon;
- Kanban: columns icon;
- table: table icon; and
- Calendar: calendar-days icon.

Every project link uses its canonical URL:

`/dashboard/workspaces/<workspaceId>/projects/<projectId>`

No project type becomes a route segment.

### Footer and collapse control

Remove the non-functional Settings footer link. Do not invent account, authentication, billing, or persistence status.

Add the existing `SidebarRail` to make desktop collapsing discoverable while preserving the current top-bar trigger and `Ctrl+B` behavior supplied by the shared primitive.

## Active-state behavior

Use exact path matching so only one destination is active at a time:

- `/dashboard` activates Overview;
- `/dashboard/workspaces/project-alpha` activates Workspace overview; and
- a canonical project URL activates only its project item.

Each active link also receives `aria-current="page"`. Tooltips remain available when collapsed.

The sidebar does not add a second active parent marker because simultaneous highlighted rows would weaken orientation rather than improve it.

## Dashboard top bar

Keep the top bar inside `app/dashboard/layout.tsx`, but give it a consistent compact height, bottom border, and aligned horizontal padding. The sidebar trigger remains accessible and visible on mobile.

Do not introduce dynamic breadcrumbs, a page-title store, or a new layout abstraction in this pass.

## Data and component boundaries

`app/dashboard/layout.tsx` remains responsible for selecting serializable workspace and project display records from the existing mock boundaries and passing them to `AppSidebar`.

`components/layout/app-sidebar.tsx` owns only application-shell presentation and pathname-based active state. It must not import or mutate mock records directly.

The sidebar project prop contains only the display fields it needs: title, canonical URL, and project type. The workspace prop contains its title and canonical URL.

The implementation must not modify `components/ui/sidebar.tsx`, project records, workspace records, or route files.

## Workspace card root cause

The current interaction hierarchy is effectively:

```text
Link
  Card
    Dropdown trigger
```

The dropdown trigger is therefore nested inside the workspace navigation link. Stopping event propagation alone would leave invalid interactive nesting and make keyboard behavior fragile.

## Considered workspace card fixes

### Separate navigation and action siblings

Use a relative wrapper as the grid item. Render the workspace link and card as one child, then position the dropdown action as a sibling above the card surface.

Advantages:

- valid interactive structure;
- the full card body remains clickable;
- the dropdown never inherits link navigation;
- keyboard focus remains separate; and
- no client event workaround is required.

Trade-off:

- the card header reserves a small amount of space for the overlaid action.

### Stop propagation inside the current link

Keep the existing nesting and cancel click propagation from the trigger.

Advantage:

- very small source edit.

Trade-offs:

- retains nested interactive elements;
- behavior can still differ across keyboard and pointer activation; and
- treats the symptom instead of the structure causing it.

### Make only the title a link

Remove the card-level link and link only the workspace title.

Advantage:

- simplest valid markup.

Trade-off:

- substantially reduces the expected clickable target of the card.

## Workspace card decision

Use separate navigation and action siblings.

The wrapper becomes the grid child. A block link wraps the card body, while the dropdown sits in an absolutely positioned sibling container. The card header reserves space so long titles cannot overlap the action.

The link receives a clear accessible name and whole-card focus ring. The dropdown trigger reuses the existing shadcn-compatible button and Base UI menu foundations, receives an `Open actions for <workspace>` label, and keeps its own focus ring.

Selecting the ellipsis or its menu items must not navigate. Selecting the card body, title, description, or author area must navigate to the workspace.

The Edit and Delete menu items remain frontend-only placeholders. This task does not add CRUD behavior.

## Visual treatment

- Reuse current sidebar, background, foreground, muted, primary, border, and ring tokens.
- Keep menu rows compact and aligned to the existing sidebar primitive dimensions.
- Use type icons for information, not decorative badges or counts.
- Avoid new global CSS and avoid changing shared sidebar variants.
- Use restrained hover and active backgrounds already provided by `SidebarMenuButton`.
- Keep the workspace cards within the existing Card system; add only focused hover, focus, and action spacing styles.
- Preserve dark-mode token behavior.

## Accessibility

- Every link keeps meaningful visible text in expanded mode and a tooltip in collapsed mode.
- Active links expose `aria-current="page"`.
- The product link and every icon-only action have explicit accessible labels.
- The card navigation link and action button are siblings, eliminating nested interactive controls.
- Both the card link and ellipsis trigger have visible focus states.
- Mobile continues to use the accessible sidebar sheet supplied by the shared primitive.

## Responsive behavior

- Desktop retains expanded and icon-collapsed modes.
- Project icons remain available in collapsed mode.
- Text truncates rather than widening the sidebar.
- Mobile retains the existing sheet width and trigger.
- The top bar remains sticky without covering dashboard content.
- No sidebar change may interfere with the Calendar or Kanban horizontal scroll containers.

## Error and empty-state behavior

- If the selected sidebar workspace has no projects, render the workspace overview item without an empty project placeholder row.
- Do not generate project links for records outside the selected workspace.
- Do not render a link when its canonical data is unavailable.
- The current fixture supplies a valid workspace and projects, so no new runtime error state is required.

## Verification strategy

Before implementation, read the relevant Next.js 16.2.12 local documentation for `Link`, `usePathname`, and Server-to-Client Component props.

After implementation:

- run focused ESLint for `app/dashboard/layout.tsx`, `components/layout/app-sidebar.tsx`, and `features/workspace/components/workspace-list.tsx`;
- run `npm.cmd run lint`;
- run `npx.cmd tsc --noEmit`;
- run `npm.cmd run build`;
- run `git diff --check` and confirm dependency manifests are unchanged;
- inspect live HTML for the dashboard, workspace, and Calendar project routes;
- confirm every sidebar URL corresponds to a current route;
- confirm current route active-state rules from the source and rendered markup; and
- when browser tooling is available, verify expanded, collapsed, mobile, keyboard, ellipsis, menu, and card-navigation behavior interactively.

The workspace-card regression check must demonstrate both sides of the interaction:

1. activating the card body navigates to its workspace; and
2. activating the ellipsis opens the menu while the current URL remains unchanged.

If browser tooling remains unavailable, report the interaction and responsive QA gap explicitly. Lint, build, and live HTML do not prove pointer or keyboard interaction.

## Non-goals

- No new dashboard routes.
- No Tasks, Team, global Calendar, Messages, or Settings pages.
- No workspace switcher.
- No project search, favorites, recency tracking, or persistence.
- No account/profile menu or authentication.
- No workspace Edit or Delete implementation.
- No changes to the shared sidebar primitive or global theme tokens.
- No changes to project, workspace, Calendar, Kanban, table, or document data contracts.
- No dependency changes.
- No commit, push, branch, or worktree operation.

## Acceptance criteria

- The sidebar displays only destinations backed by current routes.
- The product identity remains legible when expanded and recognizable when collapsed.
- Overview, Workspace overview, and all six Project Alpha projects are visible when expanded.
- Document, Kanban, table, and Calendar projects use distinct type icons.
- Exactly one sidebar destination is active for each current route.
- Every collapsed sidebar item retains a meaningful tooltip.
- The mobile drawer continues to expose the same valid navigation.
- The top bar aligns the trigger within a stable bordered header.
- Clicking a workspace card body navigates to the correct canonical workspace URL.
- Clicking a workspace card ellipsis opens its menu without navigation.
- The card link and dropdown trigger are not nested interactive elements.
- Card and action controls remain keyboard accessible with visible focus.
- No placeholder route, backend, CRUD behavior, persistence layer, shared primitive change, or dependency is introduced.
- Focused checks, repository lint, typecheck, build, diff review, live HTML, and available browser QA are reported accurately.
