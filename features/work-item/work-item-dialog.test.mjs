import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

import { createWorkItemFormValue } from "./form.ts"

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
const detailsSourceUrl = new URL(
  "./components/work-item-details.tsx",
  import.meta.url
)
const labelsFieldSourceUrl = new URL(
  "./components/work-item-labels-field.tsx",
  import.meta.url
)
const documentsFieldSourceUrl = new URL(
  "./components/work-item-documents-field.tsx",
  import.meta.url
)
const documentManagerSourceUrl = new URL(
  "./components/work-item-document-manager.tsx",
  import.meta.url
)
const projectWorkViewSourceUrl = new URL(
  "../project/components/project-work-view.tsx",
  import.meta.url
)
const dependencyFieldSourceUrl = new URL(
  "./components/work-item-dependencies-field.tsx",
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
const kanbanColumnSourceUrl = new URL(
  "../kanban/components/kanban-column.tsx",
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
const calendarToolbarSourceUrl = new URL(
  "../calendar/components/calendar-toolbar.tsx",
  import.meta.url
)

test("keeps project-store ownership outside the shared dialog", async () => {
  const [
    source,
    detailsSource,
    labelsSource,
    documentsSource,
    documentManagerSource,
  ] =
    await Promise.all([
      readFile(dialogSourceUrl, "utf8"),
      readFile(detailsSourceUrl, "utf8"),
      readFile(labelsFieldSourceUrl, "utf8"),
      readFile(documentsFieldSourceUrl, "utf8"),
      readFile(documentManagerSourceUrl, "utf8"),
    ])

  assert.doesNotMatch(
    source +
      detailsSource +
      labelsSource +
      documentsSource +
      documentManagerSource,
    /useProjectStore|project\/store/
  )
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

  assert.equal(source.match(/<select\b/g)?.length, 2)
  assert.equal(source.match(/type="date"/g)?.length, 2)
  assert.match(source, /type="number"/)
  assert.match(source, /type="checkbox"/)
  assert.doesNotMatch(source, />\s*Status\s*</)
})

test("uses controlled Board labels and project documents", async () => {
  const [formSource, labelsSource, documentsSource] = await Promise.all([
    readFile(formSourceUrl, "utf8"),
    readFile(labelsFieldSourceUrl, "utf8"),
    readFile(documentsFieldSourceUrl, "utf8"),
  ])

  assert.match(formSource, /<WorkItemLabelsField/)
  assert.match(formSource, /<WorkItemDocumentsField/)
  assert.doesNotMatch(formSource, /selectedLabelNames/)
  assert.match(labelsSource, /DropdownMenuCheckboxItem/)
  assert.match(labelsSource, /Set labels/)
  assert.match(labelsSource, /import \{ BOARD_LABEL_STYLES \}/)
  assert.match(labelsSource, /BOARD_LABEL_STYLES\[label\.color\]/)
  assert.match(labelsSource, /aria-hidden="true"/)
  assert.match(labelsSource, /\{label\.name\}/)
  assert.doesNotMatch(labelsSource, /<Input|free.?text/i)
  assert.match(documentsSource, /DropdownMenuCheckboxItem/)
  assert.match(documentsSource, /linkedResourceIds/)
})

test("uses a View-first existing-task state machine", async () => {
  const [dialogSource, detailsSource, documentManagerSource] =
    await Promise.all([
      readFile(dialogSourceUrl, "utf8"),
      readFile(detailsSourceUrl, "utf8"),
      readFile(documentManagerSourceUrl, "utf8"),
    ])
  const formUsage = dialogSource.match(/<WorkItemForm[\s\S]*?\/>/)?.[0]
  const handleCancelStart = dialogSource.indexOf(
    "function handleCancel()"
  )
  const handleCancelEnd = dialogSource.indexOf(
    "\n  function handleConfirmDelete",
    handleCancelStart
  )
  const handleCancelSource = dialogSource.slice(
    handleCancelStart,
    handleCancelEnd
  )
  const footerStart = dialogSource.indexOf("<DialogFooter")
  const footerEnd = dialogSource.indexOf(
    "</DialogFooter>",
    footerStart
  )
  const footerSource = dialogSource.slice(footerStart, footerEnd)
  const editDeleteSource = footerSource.match(
    /\{mode === "view" &&\s*existingTaskScreen === "edit" &&\s*workItem \? \([\s\S]*?\) : null\}/
  )?.[0]
  const viewFooterSource = footerSource.match(
    /\) : \(\s*<>[\s\S]*?>\s*Close\s*<\/Button>[\s\S]*?>\s*Edit task\s*<\/Button>[\s\S]*?<\/>/
  )?.[0]

  assert.match(dialogSource, /mode: "create" \| "view"/)
  assert.match(dialogSource, /type ExistingTaskScreen = "view" \| "edit"/)
  assert.match(dialogSource, /useState<ExistingTaskScreen>\("view"\)/)
  assert.match(dialogSource, /<WorkItemDetails/)
  assert.match(dialogSource, /View task:/)
  assert.ok(formUsage)
  assert.doesNotMatch(formUsage, /disabled/)
  assert.match(
    handleCancelSource,
    /if \(mode === "create"\)[\s\S]*onOpenChange\(false\)[\s\S]*return[\s\S]*setExistingTaskScreen\("view"\)/
  )
  assert.equal(
    handleCancelSource.match(/onOpenChange\(false\)/g)?.length,
    1
  )
  assert.ok(viewFooterSource)
  assert.doesNotMatch(viewFooterSource, /Add document|Add Docs/)
  assert.doesNotMatch(viewFooterSource, />\s*Delete\s*</)
  assert.ok(editDeleteSource)
  assert.match(editDeleteSource, />\s*Delete\s*</)
  assert.equal(footerSource.match(/>\s*Delete\s*</g)?.length, 1)
  assert.match(detailsSource, /Board/)
  assert.match(detailsSource, /Description/)
  assert.match(detailsSource, /Start date/)
  assert.match(detailsSource, /Due date/)
  assert.match(detailsSource, /Estimate/)
  assert.match(detailsSource, /Checklist/)
  assert.match(documentManagerSource, /Linked documents/)
  assert.match(detailsSource, /WorkItemLabelList/)
})

test("manages existing-task documents inline below linked documents", async () => {
  const [dialogSource, detailsSource, documentManagerSource] =
    await Promise.all([
      readFile(dialogSourceUrl, "utf8"),
      readFile(detailsSourceUrl, "utf8"),
      readFile(documentManagerSourceUrl, "utf8"),
    ])

  assert.doesNotMatch(
    dialogSource,
    /WorkItemDocumentDialog|work-item-document-dialog|documentDialogOpen/
  )
  assert.match(detailsSource, /<WorkItemDocumentManager/)
  assert.doesNotMatch(documentManagerSource, /<Dialog/)
  assert.match(documentManagerSource, />\s*Linked documents\s*</)
  assert.match(documentManagerSource, /<Plus/)
  assert.match(documentManagerSource, />\s*Add Docs\s*</)
  assert.match(documentManagerSource, /aria-expanded=\{isExpanded\}/)
  assert.match(documentManagerSource, /aria-controls=\{panelId\}/)
  assert.match(documentManagerSource, /type="checkbox"/)
  assert.match(documentManagerSource, /onLink/)
  assert.match(documentManagerSource, /onUnlink/)
  assert.match(documentManagerSource, /onCreateAndLink/)
  assert.match(documentManagerSource, /Create and link/)
  assert.match(documentManagerSource, /role="alert"/)

  const emptyStateIndex = documentManagerSource.indexOf(
    "No linked documents."
  )
  const addDocsIndex = documentManagerSource.indexOf("Add Docs")

  assert.ok(emptyStateIndex >= 0)
  assert.ok(addDocsIndex > emptyStateIndex)
})

test("focuses specific task validation and relationship feedback", async () => {
  const [dialogSource, formModule] = await Promise.all([
    readFile(dialogSourceUrl, "utf8"),
    import("./form.ts"),
  ])
  const focusErrorStart = dialogSource.indexOf("function focusError(")
  const focusErrorEnd = dialogSource.indexOf(
    "\n  function handleSubmit",
    focusErrorStart
  )
  const focusErrorSource = dialogSource.slice(
    focusErrorStart,
    focusErrorEnd
  )
  const rejectedSaveSource = dialogSource.match(
    /if \(!saved\) \{[\s\S]*?\n    \}/
  )?.[0]

  assert.equal(
    typeof formModule.validateWorkItemFormValue,
    "function"
  )
  assert.match(dialogSource, /validateWorkItemFormValue\(draft\)/)
  assert.match(focusErrorSource, /setError\(message\)/)
  assert.match(focusErrorSource, /requestAnimationFrame/)
  assert.match(focusErrorSource, /errorRef\.current\?\.focus\(\)/)
  assert.match(dialogSource, /ref=\{errorRef\}/)
  assert.match(dialogSource, /tabIndex=\{-1\}/)
  assert.ok(rejectedSaveSource)
  assert.match(
    rejectedSaveSource,
    /selected label, dependency, or document is no longer valid/
  )
  assert.match(rejectedSaveSource, /focusError/)
})

test("keeps live task lookup, project-local options, URLs, and IDs in the project bridge", async () => {
  const source = await readFile(projectWorkViewSourceUrl, "utf8")

  assert.match(source, /mode: "create"; boardId: string/)
  assert.match(source, /mode: "view"; workItemId: string/)
  assert.doesNotMatch(source, /mode: "edit"; workItem: WorkItem/)
  assert.match(source, /mode: "view",\s*workItemId: workItem\.id/)
  assert.match(source, /dialogSessionIsAvailable/)
  assert.match(source, /onOpenWorkItem=\{openViewDialog\}/)
  assert.match(source, /selectBoardWorkItems/)
  assert.match(source, /selectProjectResolvedWorkItems/)
  assert.match(source, /selectTaskBoards/)
  assert.match(source, /selectProjectDocumentResources/)
  assert.match(source, /getProjectViewHref/)
  assert.match(source, /createAndLinkWorkItemDocument/)
  assert.match(
    source,
    /handleCreateAndLinkDocument[\s\S]*crypto\.randomUUID\(\)/
  )
})

test("identifies Board and Calendar details triggers by stable task ID", async () => {
  const [
    kanbanCardSource,
    calendarCardSource,
    calendarUnscheduledSource,
  ] = await Promise.all([
    readFile(kanbanCardSourceUrl, "utf8"),
    readFile(calendarCardSourceUrl, "utf8"),
    readFile(calendarUnscheduledSourceUrl, "utf8"),
  ])

  for (const source of [
    kanbanCardSource,
    calendarCardSource,
    calendarUnscheduledSource,
  ]) {
    assert.match(
      source,
      /data-work-item-open-trigger=\{workItem\.id\}/
    )
  }
})

test("falls back to a remounted existing-task trigger without changing create focus", async () => {
  const source = await readFile(projectWorkViewSourceUrl, "utf8")
  const finalFocusStart = source.indexOf("function finalFocus()")
  const finalFocusEnd = source.indexOf("\n\n  return (", finalFocusStart)
  const finalFocusSource = source.slice(finalFocusStart, finalFocusEnd)

  assert.ok(finalFocusStart >= 0)
  assert.ok(finalFocusEnd > finalFocusStart)
  assert.match(
    finalFocusSource,
    /if \(dialogTriggerRef\.current\?\.isConnected\)[\s\S]*return dialogTriggerRef\.current/
  )
  assert.match(
    finalFocusSource,
    /if \(dialogSession\?\.mode !== "view"\)[\s\S]*return null/
  )
  assert.match(
    finalFocusSource,
    /document\.querySelectorAll<HTMLElement>\(\s*"\[data-work-item-open-trigger\]"\s*\)/
  )
  assert.match(
    finalFocusSource,
    /trigger\.dataset\.workItemOpenTrigger ===\s*dialogSession\.workItemId/
  )
})

test("captures a deterministic surviving control before deleting a task", async () => {
  const [source, kanbanColumnSource, calendarToolbarSource] =
    await Promise.all([
      readFile(projectWorkViewSourceUrl, "utf8"),
      readFile(kanbanColumnSourceUrl, "utf8"),
      readFile(calendarToolbarSourceUrl, "utf8"),
    ])
  const deleteStart = source.indexOf("function deleteTask(")
  const deleteEnd = source.indexOf(
    "\n\n  function moveWorkItemDate",
    deleteStart
  )
  const deleteSource = source.slice(deleteStart, deleteEnd)

  assert.match(kanbanColumnSource, /data-work-item-delete-fallback/)
  assert.match(calendarToolbarSource, /data-work-item-delete-fallback/)
  assert.match(source, /function getDeleteFocusFallback\(/)
  assert.match(source, /closest<HTMLElement>\(\s*"\[data-kanban-board\]"/)
  assert.match(
    source,
    /closest<HTMLElement>\(\s*"\[data-project-work-view=calendar\]"/
  )
  assert.match(
    source,
    /scopedTriggers\[currentIndex \+ 1\] \?\?[\s\S]*scopedTriggers\[currentIndex - 1\]/
  )
  assert.match(
    source,
    /querySelector<HTMLElement>\(\s*"\[data-work-item-delete-fallback\]"/
  )
  assert.match(
    deleteSource,
    /deleteFallbackRef\.current =\s*getDeleteFocusFallback\(workItemId\)[\s\S]*deleteWorkItem\(workItemId\)/
  )
  assert.match(
    source,
    /deleteFallbackRef\.current\?\.isConnected[\s\S]*return deleteFallbackRef\.current/
  )
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
  assert.doesNotMatch(dependencySource, /workItem\.boardId === boardId/)
  assert.match(dependencySource, /stagesByBoardId/)
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

test("derives task status from its Board instead of form state", async () => {
  const source = await readFile(dialogSourceUrl, "utf8")

  assert.equal("status" in createWorkItemFormValue(null), false)
  assert.doesNotMatch(source, /initialStatus/)
  assert.match(source, /boardStage/)
  assert.match(source, /stagesByBoardId/)
})
