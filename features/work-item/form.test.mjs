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
    title: "Build shared work items",
    description: "One source for every view.",
    type: "feature",
    status: "todo",
    priority: "medium",
    assigneeId: "member-project-alpha-maya-chen",
    startDate: null,
    dueDate: "2026-09-18",
    estimate: 3,
    position: 0,
    labels: ["Frontend", "UX"],
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

  assert.equal(first.type, "feature")
  assert.equal(first.status, "todo")
  assert.equal(first.priority, "medium")
  assert.equal(first.assigneeId, "")
  assert.deepEqual(second.checklist, [])
  assert.deepEqual(second.dependencyIds, [])
})

test("maps an existing work item to form strings", () => {
  const existing = createWorkItemFormValue(createWorkItem())

  assert.equal(
    existing.assigneeId,
    "member-project-alpha-maya-chen"
  )
  assert.equal(existing.estimate, "3")
  assert.equal(existing.labels, "Frontend, UX")
  assert.deepEqual(existing.dependencyIds, ["item-b"])
})

test("normalizes all editable values in one conversion", () => {
  const result = normalizeWorkItemFormValue({
    title: "  Fix hydration  ",
    description: "  Keep render deterministic.  ",
    type: "bug",
    status: "review",
    priority: "urgent",
    assigneeId: "member-project-alpha-maya-chen",
    dueDate: "2026-09-21",
    estimate: "5",
    labels: "Frontend, Quality, Frontend,  ",
    checklist: [
      { id: " check-a ", label: "  Run build  ", completed: true },
    ],
    dependencyIds: ["item-b"],
  })

  assert.deepEqual(result, {
    title: "Fix hydration",
    description: "Keep render deterministic.",
    type: "bug",
    status: "review",
    priority: "urgent",
    assigneeId: "member-project-alpha-maya-chen",
    dueDate: "2026-09-21",
    estimate: 5,
    labels: ["Frontend", "Quality"],
    checklist: [
      { id: "check-a", label: "Run build", completed: true },
    ],
    dependencyIds: ["item-b"],
  })
})

test("maps blank optional fields to null", () => {
  const base = createWorkItemFormValue(null)

  assert.deepEqual(normalizeWorkItemFormValue({ ...base, title: "Task" }), {
    title: "Task",
    description: "",
    type: "feature",
    status: "todo",
    priority: "medium",
    assigneeId: null,
    dueDate: null,
    estimate: null,
    labels: [],
    checklist: [],
    dependencyIds: [],
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

test("extracts detached editable fields", () => {
  const item = createWorkItem()
  const fields = getEditableWorkItemFields(item)

  fields.labels.push("Outside")
  fields.dependencyIds.push("outside")

  assert.deepEqual(item.labels, ["Frontend", "UX"])
  assert.deepEqual(item.dependencyIds, ["item-b"])
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
