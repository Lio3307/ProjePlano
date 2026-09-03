import assert from "node:assert/strict"
import test from "node:test"

import {
  buildCalendarDays,
  getCalendarDateLabel,
  getCalendarMonthFromIsoDate,
  getCalendarMonthLabel,
  isValidCalendarIsoDate,
  parseCalendarIsoDate,
  shiftCalendarMonth,
} from "./date-utils.ts"
import {
  getCalendarDateDropId,
  getCalendarTaskDragId,
  parseCalendarDateDropId,
  parseCalendarTaskDragId,
  partitionCalendarWorkItems,
} from "./model.ts"
import {
  INITIAL_CALENDAR_MONTH,
  INITIAL_CALENDAR_TASKS,
} from "./mock-data.ts"

function createWorkItem(id, dueDate) {
  return {
    id,
    projectId: "project-a",
    title: "Task " + id,
    description: "Description for " + id,
    type: "feature",
    status: "todo",
    priority: "medium",
    assignee: { name: "Test User", initials: "TU" },
    startDate: null,
    dueDate,
    estimate: null,
    position: 0,
    labels: ["Test"],
    checklist: [
      { id: id + "-check", label: "Verify " + id, completed: false },
    ],
    milestoneId: null,
    dependencyIds: [],
    linkedResourceIds: [],
    customFields: {},
  }
}

test("builds a Monday-first 42-day September 2026 grid", () => {
  const days = buildCalendarDays(
    { year: 2026, month: 8 },
    "2026-09-02"
  )

  assert.equal(days.length, 42)
  assert.equal(days[0].isoDate, "2026-08-31")
  assert.equal(days[41].isoDate, "2026-10-11")
  assert.equal(days[0].isCurrentMonth, false)
  assert.equal(
    days.find((day) => day.isoDate === "2026-09-02")?.isToday,
    true
  )
})

test("includes leap day in a February 2024 grid", () => {
  const days = buildCalendarDays(
    { year: 2024, month: 1 },
    "2024-02-29"
  )
  const leapDay = days.find((day) => day.isoDate === "2024-02-29")

  assert.equal(leapDay?.isCurrentMonth, true)
  assert.equal(leapDay?.isToday, true)
})

test("moves across calendar years one month at a time", () => {
  assert.deepEqual(shiftCalendarMonth({ year: 2026, month: 11 }, 1), {
    year: 2027,
    month: 0,
  })
  assert.deepEqual(shiftCalendarMonth({ year: 2026, month: 0 }, -1), {
    year: 2025,
    month: 11,
  })
})

test("parses valid date-only values and rejects impossible dates", () => {
  assert.deepEqual(parseCalendarIsoDate("2026-09-02"), {
    year: 2026,
    month: 8,
    day: 2,
  })
  assert.equal(isValidCalendarIsoDate("2024-02-29"), true)
  assert.equal(isValidCalendarIsoDate("2026-02-29"), false)
  assert.equal(isValidCalendarIsoDate("2026-13-01"), false)
  assert.equal(isValidCalendarIsoDate("not-a-date"), false)
})

test("derives a month and deterministic English label", () => {
  assert.deepEqual(getCalendarMonthFromIsoDate("2026-09-18"), {
    year: 2026,
    month: 8,
  })
  assert.equal(
    getCalendarMonthLabel({ year: 2026, month: 8 }),
    "September 2026"
  )
  assert.equal(getCalendarDateLabel("2026-09-02"), "September 2, 2026")
  assert.equal(getCalendarDateLabel("invalid"), "invalid")
})

test("partitions scheduled and unscheduled shared work items", () => {
  const scheduled = createWorkItem("scheduled", "2026-09-08")
  const withoutDate = createWorkItem("without-date", null)
  const invalidDate = createWorkItem("invalid-date", "invalid")
  const result = partitionCalendarWorkItems([
    withoutDate,
    scheduled,
    invalidDate,
  ])

  assert.deepEqual(
    result.scheduled.map((item) => item.id),
    ["scheduled"]
  )
  assert.deepEqual(
    result.unscheduled.map((item) => item.id),
    ["without-date", "invalid-date"]
  )
})

test("creates and parses unambiguous task and date drag IDs", () => {
  assert.equal(getCalendarTaskDragId("task-a"), "calendar-task:task-a")
  assert.equal(
    getCalendarDateDropId("2026-09-08"),
    "calendar-date:2026-09-08"
  )
  assert.equal(
    parseCalendarTaskDragId("calendar-task:task-a"),
    "task-a"
  )
  assert.equal(
    parseCalendarDateDropId("calendar-date:2026-09-08"),
    "2026-09-08"
  )
  assert.equal(
    parseCalendarTaskDragId("calendar-date:2026-09-08"),
    null
  )
  assert.equal(parseCalendarDateDropId("calendar-date:invalid"), null)
})

test("provides complete Calendar task details", () => {
  for (const task of INITIAL_CALENDAR_TASKS) {
    assert.ok(task.id)
    assert.ok(task.title)
    assert.ok(task.description)
    assert.equal(isValidCalendarIsoDate(task.dueDate), true)
    assert.ok(task.status)
    assert.ok(task.priority)
    assert.ok(task.assignee.name)
    assert.ok(task.assignee.initials)
    assert.ok(task.labels.length > 0)
    assert.ok(task.checklist.length > 0)
  }
})

test("keeps every mock deadline visible in the initial grid", () => {
  const visibleDates = new Set(
    buildCalendarDays(INITIAL_CALENDAR_MONTH, "2026-09-02").map(
      (day) => day.isoDate
    )
  )

  assert.ok(INITIAL_CALENDAR_TASKS.length >= 6)
  assert.equal(
    INITIAL_CALENDAR_TASKS.every((task) => visibleDates.has(task.dueDate)),
    true
  )
})
