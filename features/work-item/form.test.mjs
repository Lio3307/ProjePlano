import assert from "node:assert/strict"
import test from "node:test"

import {
  createWorkItemFormValue,
  getEditableWorkItemFields,
  haveSameEditableWorkItemFields,
  normalizeWorkItemFormValue,
} from "./form.ts"

function createWorkItem(overrides = {}) {
  return {
    id: "item-a",
    projectId: "project-a",
    boardId: "board-a",
    title: "Build shared work items",
    description: "One source for every view.",
    type: "feature",
    priority: "medium",
    assigneeId: "member-project-alpha-maya-chen",
    startDate: null,
    dueDate: "2026-09-18",
    estimate: 3,
    position: 0,
    labelIds: ["label-frontend", "label-ux"],
    checklist: [
      { id: "check-a", label: "Verify contract", completed: false },
    ],
    milestoneId: null,
    dependencyIds: ["item-b"],
    linkedResourceIds: [],
    customFields: {},
    ...overrides,
  }
}

test("creates independent defaults", () => {
  const first = createWorkItemFormValue(null)
  const second = createWorkItemFormValue(null)

  first.checklist.push({
    id: "outside",
    label: "Outside",
    completed: false,
  })
  first.linkedResourceIds.push("outside")

  assert.equal(first.type, "feature")
  assert.equal("status" in first, false)
  assert.equal(first.priority, "medium")
  assert.equal(first.assigneeId, "")
  assert.equal(first.startDate, "")
  assert.equal(first.dueDate, "")
  assert.deepEqual(first.labelIds, [])
  assert.deepEqual(second.checklist, [])
  assert.deepEqual(second.dependencyIds, [])
  assert.deepEqual(second.linkedResourceIds, [])
})

test("maps an existing work item to form strings", () => {
  const existing = createWorkItemFormValue(createWorkItem())

  assert.equal(
    existing.assigneeId,
    "member-project-alpha-maya-chen"
  )
  assert.equal(existing.estimate, "3")
  assert.equal(existing.startDate, "")
  assert.equal(existing.dueDate, "2026-09-18")
  assert.deepEqual(existing.labelIds, ["label-frontend", "label-ux"])
  assert.deepEqual(existing.dependencyIds, ["item-b"])
  assert.deepEqual(existing.linkedResourceIds, [])
})

test("normalizes all editable values in one conversion", () => {
  const result = normalizeWorkItemFormValue({
    title: "  Fix hydration  ",
    description: "  Keep render deterministic.  ",
    type: "bug",
    priority: "urgent",
    assigneeId: "member-project-alpha-maya-chen",
    startDate: "2026-09-18",
    dueDate: "2026-09-21",
    estimate: "5",
    labelIds: [
      " label-frontend ",
      "label-quality",
      "label-frontend",
      " ",
    ],
    checklist: [
      { id: " check-a ", label: "  Run build  ", completed: true },
    ],
    dependencyIds: ["item-b"],
    linkedResourceIds: [
      " resource-notes ",
      "resource-brief",
      "resource-notes",
      " ",
    ],
  })

  assert.deepEqual(result, {
    title: "Fix hydration",
    description: "Keep render deterministic.",
    type: "bug",
    priority: "urgent",
    assigneeId: "member-project-alpha-maya-chen",
    startDate: "2026-09-18",
    dueDate: "2026-09-21",
    estimate: 5,
    labelIds: ["label-frontend", "label-quality"],
    checklist: [
      { id: "check-a", label: "Run build", completed: true },
    ],
    dependencyIds: ["item-b"],
    linkedResourceIds: ["resource-notes", "resource-brief"],
  })
})

test("maps blank optional fields to null", () => {
  const base = createWorkItemFormValue(null)

  assert.deepEqual(normalizeWorkItemFormValue({ ...base, title: "Task" }), {
    title: "Task",
    description: "",
    type: "feature",
    priority: "medium",
    assigneeId: null,
    startDate: null,
    dueDate: null,
    estimate: null,
    labelIds: [],
    checklist: [],
    dependencyIds: [],
    linkedResourceIds: [],
  })
})

test("rejects invalid title, enum, date, and estimate values", () => {
  const base = createWorkItemFormValue(null)

  assert.equal(normalizeWorkItemFormValue({ ...base, title: " " }), null)
  assert.equal(
    normalizeWorkItemFormValue({
      ...base,
      title: "Task",
      type: "unknown",
    }),
    null
  )
  assert.equal(
    normalizeWorkItemFormValue({
      ...base,
      title: "Task",
      dueDate: "2026-02-29",
    }),
    null
  )
  assert.equal(
    normalizeWorkItemFormValue({
      ...base,
      title: "Task",
      startDate: "2026-09-22",
      dueDate: "2026-09-21",
    }),
    null
  )
  assert.notEqual(
    normalizeWorkItemFormValue({
      ...base,
      title: "Task",
      startDate: "2026-09-21",
      dueDate: "2026-09-21",
    }),
    null
  )

  for (const estimate of ["-1", "1.5", "NaN"]) {
    assert.equal(
      normalizeWorkItemFormValue({ ...base, title: "Task", estimate }),
      null
    )
  }
})

test("rejects blank and duplicate checklist items", () => {
  const base = createWorkItemFormValue(null)

  assert.equal(
    normalizeWorkItemFormValue({
      ...base,
      title: "Task",
      checklist: [{ id: "check", label: " ", completed: false }],
    }),
    null
  )
  assert.equal(
    normalizeWorkItemFormValue({
      ...base,
      title: "Task",
      checklist: [
        { id: "same", label: "First", completed: false },
        { id: "same", label: "Second", completed: false },
      ],
    }),
    null
  )
})

test("rejects blank and duplicate dependency IDs", () => {
  const base = createWorkItemFormValue(null)

  assert.equal(
    normalizeWorkItemFormValue({
      ...base,
      title: "Task",
      dependencyIds: [" "],
    }),
    null
  )
  assert.equal(
    normalizeWorkItemFormValue({
      ...base,
      title: "Task",
      dependencyIds: ["item-b", "item-b"],
    }),
    null
  )
})

test("reports a focused date-range validation reason", async () => {
  const formModule = await import("./form.ts")
  const base = createWorkItemFormValue(null)

  assert.equal(
    typeof formModule.validateWorkItemFormValue,
    "function"
  )
  assert.deepEqual(
    formModule.validateWorkItemFormValue({
      ...base,
      title: "Task",
      startDate: "2026-09-22",
      dueDate: "2026-09-21",
    }),
    {
      ok: false,
      field: "date-range",
      message:
        "Enter valid dates with the start date on or before the due date.",
    }
  )
})

test("reports a focused checklist validation reason", async () => {
  const formModule = await import("./form.ts")
  const base = createWorkItemFormValue(null)

  assert.equal(
    typeof formModule.validateWorkItemFormValue,
    "function"
  )
  assert.deepEqual(
    formModule.validateWorkItemFormValue({
      ...base,
      title: "Task",
      checklist: [{ id: "check", label: " ", completed: false }],
    }),
    {
      ok: false,
      field: "checklist",
      message:
        "Enter text for every checklist item and remove duplicate entries.",
    }
  )
})

test("reports a focused relationship validation reason", async () => {
  const formModule = await import("./form.ts")
  const base = createWorkItemFormValue(null)

  assert.equal(
    typeof formModule.validateWorkItemFormValue,
    "function"
  )
  assert.deepEqual(
    formModule.validateWorkItemFormValue({
      ...base,
      title: "Task",
      dependencyIds: ["item-b", "item-b"],
    }),
    {
      ok: false,
      field: "relationships",
      message:
        "Refresh task dependencies and select each dependency only once.",
    }
  )
})

test("extracts detached editable fields", () => {
  const item = createWorkItem()
  const fields = getEditableWorkItemFields(item)

  fields.labelIds.push("outside")
  fields.dependencyIds.push("outside")
  fields.linkedResourceIds.push("outside")

  assert.deepEqual(item.labelIds, ["label-frontend", "label-ux"])
  assert.deepEqual(item.dependencyIds, ["item-b"])
  assert.deepEqual(item.linkedResourceIds, [])
})

test("compares editable field values", () => {
  const item = createWorkItem()

  assert.equal(
    haveSameEditableWorkItemFields(
      getEditableWorkItemFields(item),
      getEditableWorkItemFields(item)
    ),
    true
  )
  assert.equal(
    haveSameEditableWorkItemFields(getEditableWorkItemFields(item), {
      ...getEditableWorkItemFields(item),
      title: "Different",
    }),
    false
  )
})
