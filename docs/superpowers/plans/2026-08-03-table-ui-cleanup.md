# Table UI Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the editable table's useful UI behavior while removing speculative scrolling code and table-specific global CSS.

**Architecture:** The shared shadcn `Table` wrapper owns its scroll container and exposes only two optional container props. The dashboard table owns its editable state and sticky presentation, renders its small row list directly, and relies on Tailwind utilities rather than global component CSS.

**Tech Stack:** Next.js 16.2.12, React 19.2.4, TypeScript, Tailwind CSS 4, shadcn UI, Base UI

## Global Constraints

- Preserve editable rows, columns, status options, file uploads, embedded links, and attachment rename/remove actions.
- Keep horizontal scrolling, a sticky header, and the first data column visible while scrolling.
- Do not add dependencies or a generic data-grid abstraction.
- Do not commit, push, or create a branch.

---

### Task 1: Give the shared table a typed container API

**Files:**
- Modify: `components/ui/table.tsx`

**Interfaces:**
- Consumes: `React.ComponentProps<"table">`, `React.Ref<HTMLDivElement>`
- Produces: `TableProps` with optional `containerClassName` and `containerRef`

- [ ] **Step 1: Run the failing production type check**

Run:

```powershell
npm.cmd run build
```

Expected: FAIL because `table-type.tsx` passes unsupported container props.

- [ ] **Step 2: Add the minimal typed container API**

Use this implementation:

```tsx
type TableProps = React.ComponentProps<"table"> & {
  containerClassName?: string
  containerRef?: React.Ref<HTMLDivElement>
}

function Table({
  className,
  containerClassName,
  containerRef,
  ...props
}: TableProps) {
  return (
    <div
      ref={containerRef}
      data-slot="table-container"
      className={cn("relative w-full overflow-auto", containerClassName)}
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-xs", className)}
        {...props}
      />
    </div>
  )
}
```

- [ ] **Step 3: Run focused lint**

Run `npm.cmd run lint -- components/ui/table.tsx`.

Expected: PASS with no warnings or errors.

### Task 2: Simplify editable-table scrolling and CSS ownership

**Files:**
- Modify: `components/dashboard/table-type.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: `TableProps.containerClassName` from Task 1
- Produces: direct row rendering with sticky header/gutter/first column and no custom virtualization or global scrollbar class

- [ ] **Step 1: Confirm the unnecessary mechanisms currently exist**

```powershell
$source = Get-Content -Raw components/dashboard/table-type.tsx
$css = Get-Content -Raw app/globals.css
if ($source -notmatch "useVirtualWindow") { throw "Expected virtual scrolling before cleanup" }
if ($css -notmatch "scrollbar-thin") { throw "Expected global scrollbar rule before cleanup" }
```

Expected: PASS, proving both cleanup targets exist before implementation.

- [ ] **Step 2: Remove custom virtualization and render rows directly**

In `components/dashboard/table-type.tsx`:

- Remove `useEffect` and `RefObject` from the React import.
- Remove `ROW_HEIGHT`, `OVERSCAN`, `INITIAL_VISIBLE_ROWS`, `useVirtualWindow`, and `SpacerRow`.
- Remove `containerRef`, `start`, and `end` from `TableType`.
- Keep `containerClassName="max-h-[70vh] overscroll-y-contain"`.
- Remove `scrollbar-thin` from the status-option list.
- Render rows directly:

```tsx
{rows.map((row, index) => (
  <DataRow
    key={row.id}
    row={row}
    rowNumber={index + 1}
    columns={columns}
    statusOptionActions={statusOptionActions}
    onUpdateCell={(columnId, value) =>
      updateCell(row.id, columnId, value)
    }
    onDelete={() => deleteRow(row.id)}
  />
))}
```

- Keep comments only where they explain object URL handling, sticky offsets, or another non-obvious constraint.

- [ ] **Step 3: Remove table-only global scrollbar CSS**

Delete the complete `@layer components` block containing `.scrollbar-thin` from `app/globals.css`. Do not alter theme tokens, base rules, or rich-editor rules.

- [ ] **Step 4: Verify the cleanup assertions**

```powershell
$source = Get-Content -Raw components/dashboard/table-type.tsx
$css = Get-Content -Raw app/globals.css
if ($source -match "useVirtualWindow|SpacerRow|ROW_HEIGHT|OVERSCAN") { throw "Virtual scrolling remains" }
if ($css -match "scrollbar-thin") { throw "Table scrollbar CSS remains global" }
```

Expected: PASS with no output.

- [ ] **Step 5: Run focused lint**

Run `npm.cmd run lint -- components/dashboard/table-type.tsx components/ui/table.tsx`.

Expected: PASS with no warnings or errors.

- [ ] **Step 6: Run the production build**

Run `npm.cmd run build`.

Expected: PASS, including TypeScript validation and production bundling.

- [ ] **Step 7: Review the final workspace diff**

Run:

```powershell
git diff --check
git status --short
git diff --stat
```

Expected: no whitespace errors; only the target files plus the approved design/plan documents are changed; no branch, commit, or push is created.

### Task 3: Let the Name column scroll horizontally

**Files:**
- Modify: `components/dashboard/table-type.tsx`

**Interfaces:**
- Consumes: the existing `ColumnHeaderCell` and `DataRow` rendering paths
- Produces: vertically sticky headers with no horizontal sticky behavior on data columns

- [ ] **Step 1: Run a failing source assertion**

```powershell
$source = Get-Content -Raw components/dashboard/table-type.tsx
if ($source -match "frozen\??:|frozen=|sticky left-8") {
  throw "Name column is still horizontally sticky"
}
```

Expected: FAIL with `Name column is still horizontally sticky`.

- [ ] **Step 2: Remove only the Name-column freezing code**

- Delete the `frozen` property and conditional header classes from `ColumnHeaderCell`.
- Render every data cell with `className={DATA_CELL_CLASS}` instead of branching on `index === 0`.
- Stop passing `frozen={index === 0}` from `TableType`.
- Keep the vertical header selector `[&_th]:sticky [&_th]:top-0` and remove the row-action gutter's `sticky left-0` classes.

- [ ] **Step 3: Re-run the source assertion**

Run the command from Step 1.

Expected: PASS with no output.

- [ ] **Step 4: Verify the focused files**

```powershell
npm.cmd run lint -- components/dashboard/table-type.tsx components/ui/table.tsx
npm.cmd run build
git diff --check
git status --short
```

Expected: focused lint, production build, and diff check pass; the working tree remains uncommitted on the existing branch.
