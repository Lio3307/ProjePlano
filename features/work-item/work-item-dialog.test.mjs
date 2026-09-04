import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const dialogSourceUrl = new URL(
  "./components/work-item-dialog.tsx",
  import.meta.url
)
const dialogPrimitiveSourceUrl = new URL(
  "../../components/ui/dialog.tsx",
  import.meta.url
)
const formSourceUrl = new URL(
  "./components/work-item-form.tsx",
  import.meta.url
)
const dependencyFieldSourceUrl = new URL(
  "./components/work-item-dependencies-field.tsx",
  import.meta.url
)
const assigneeFieldSourceUrl = new URL(
  "./components/work-item-assignee-field.tsx",
  import.meta.url
)
const blockedBadgeSourceUrl = new URL(
  "./components/work-item-blocked-badge.tsx",
  import.meta.url
)
const kanbanCardSourceUrl = new URL(
  "../kanban/components/kanban-card.tsx",
  import.meta.url
)
const calendarCardSourceUrl = new URL(
  "../calendar/components/calendar-task-card.tsx",
  import.meta.url
)
const calendarUnscheduledSourceUrl = new URL(
  "../calendar/components/calendar-unscheduled.tsx",
  import.meta.url
)

test("keeps project-store ownership outside the shared dialog", async () => {
  const source = await readFile(dialogSourceUrl, "utf8")

  assert.doesNotMatch(source, /useProjectStore|project\/store/)
  assert.match(source, /role="alert"/)
  assert.match(source, /Confirm delete/)
  assert.match(source, /Cancel delete/)
  assert.match(source, /haveSameEditableWorkItemFields/)
})

test("keeps task dialog chrome visible while its form content scrolls", async () => {
  const [source, primitiveSource] = await Promise.all([
    readFile(dialogSourceUrl, "utf8"),
    readFile(dialogPrimitiveSourceUrl, "utf8"),
  ])

  const headerIndex = source.indexOf("<DialogHeader")
  const scrollIndex = source.indexOf(
    'className="no-scrollbar min-h-0 flex-1 overflow-y-auto'
  )
  const footerIndex = source.indexOf("<DialogFooter")

  assert.match(primitiveSource, /function DialogFooter/)
  assert.match(primitiveSource, /data-slot="dialog-footer"/)
  assert.match(source, /flex max-w-3xl flex-col overflow-hidden p-0/)
  assert.doesNotMatch(source, /sticky top-0/)
  assert.equal(source.match(/overflow-y-auto/g)?.length, 1)
  assert.ok(headerIndex >= 0)
  assert.ok(scrollIndex > headerIndex)
  assert.ok(footerIndex > scrollIndex)
  assert.match(source, /<DialogHeader[^>]*shrink-0/)
  assert.match(source, /<DialogFooter[^>]*shrink-0/)
})

test("uses native accessible task controls", async () => {
  const source = await readFile(formSourceUrl, "utf8")

  assert.equal(source.match(/<select\b/g)?.length, 3)
  assert.match(source, /type="date"/)
  assert.match(source, /type="number"/)
  assert.match(source, /type="checkbox"/)
})

test("uses a controlled workspace-member assignee picker", async () => {
  const [dialogSource, formSource, assigneeSource] =
    await Promise.all([
      readFile(dialogSourceUrl, "utf8"),
      readFile(formSourceUrl, "utf8"),
      readFile(assigneeFieldSourceUrl, "utf8"),
    ])

  assert.match(dialogSource, /workspaceMembers/)
  assert.match(formSource, /<WorkItemAssigneeField/)
  assert.match(assigneeSource, /DropdownMenuRadioGroup/)
  assert.match(assigneeSource, /DropdownMenuRadioItem/)
  assert.match(assigneeSource, /Unassigned/)
  assert.match(assigneeSource, /member\.status === "active"/)
  assert.doesNotMatch(assigneeSource, /useProjectStore|project\/store/)
})

test("creates checklist IDs only from the add handler", async () => {
  const source = await readFile(formSourceUrl, "utf8")

  assert.match(
    source,
    /function handleAddChecklistItem[\s\S]*?crypto\.randomUUID\(\)/
  )
  assert.equal(source.match(/crypto\.randomUUID\(\)/g)?.length, 1)
  assert.doesNotMatch(source, /Date\.now|Math\.random/)
})

test("uses a controlled accessible dependency selector", async () => {
  const [dialogSource, formSource, dependencySource] =
    await Promise.all([
      readFile(dialogSourceUrl, "utf8"),
      readFile(formSourceUrl, "utf8"),
      readFile(dependencyFieldSourceUrl, "utf8"),
    ])

  assert.doesNotMatch(dialogSource, /useProjectStore|project\/store/)
  assert.match(dialogSource, /projectWorkItems/)
  assert.match(formSource, /<WorkItemDependenciesField/)
  assert.match(dependencySource, /DropdownMenuCheckboxItem/)
  assert.match(dependencySource, /onCheckedChange/)
  assert.match(dependencySource, /closeOnClick=\{false\}/)
  assert.match(dependencySource, /Creates a cycle/)
  assert.match(dependencySource, /Remove dependency/)
  assert.doesNotMatch(dependencySource, /overflow-y-auto|max-h-/)
})

test("shares one blocker indicator across Board and Calendar cards", async () => {
  const [
    blockedBadgeSource,
    kanbanCardSource,
    calendarCardSource,
    calendarUnscheduledSource,
  ] = await Promise.all([
    readFile(blockedBadgeSourceUrl, "utf8"),
    readFile(kanbanCardSourceUrl, "utf8"),
    readFile(calendarCardSourceUrl, "utf8"),
    readFile(calendarUnscheduledSourceUrl, "utf8"),
  ])

  assert.match(blockedBadgeSource, /Blocked:/)
  assert.match(blockedBadgeSource, /if \(count === 0\)/)
  assert.match(kanbanCardSource, /WorkItemBlockedBadge/)
  assert.match(calendarCardSource, /WorkItemBlockedBadge/)
  assert.match(calendarUnscheduledSource, /WorkItemBlockedBadge/)
  assert.doesNotMatch(
    blockedBadgeSource + kanbanCardSource + calendarCardSource,
    /useProjectStore/
  )
})
