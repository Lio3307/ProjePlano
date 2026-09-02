import assert from "node:assert/strict"
import test from "node:test"

import {
  buildProjectOverviewSummary,
  getLocalDateKey,
} from "./overview.ts"

function createWorkItem(id, overrides = {}) {
  return {
    id,
    projectId: "project-a",
    title: id,
    description: "",
    type: "feature",
    status: "backlog",
    priority: "medium",
    assignee: null,
    startDate: null,
    dueDate: null,
    estimate: null,
    position: 0,
    labels: [],
    checklist: [],
    milestoneId: null,
    dependencyIds: [],
    linkedResourceIds: [],
    customFields: {},
    ...overrides,
  }
}

test("derives progress, active work, overdue work, and next milestone", () => {
  const summary = buildProjectOverviewSummary({
    today: "2026-09-02",
    workItems: [
      createWorkItem("backlog"),
      createWorkItem("todo", {
        status: "todo",
        dueDate: "2026-09-01",
      }),
      createWorkItem("active", {
        status: "in-progress",
        dueDate: "2026-09-03",
      }),
      createWorkItem("done", {
        status: "done",
        dueDate: "2026-08-20",
      }),
    ],
    milestones: [
      {
        id: "later",
        projectId: "project-a",
        title: "Later",
        description: "",
        targetDate: "2026-10-01",
        status: "planned",
      },
      {
        id: "next",
        projectId: "project-a",
        title: "Next release",
        description: "",
        targetDate: "2026-09-10",
        status: "in-progress",
      },
      {
        id: "complete",
        projectId: "project-a",
        title: "Completed release",
        description: "",
        targetDate: "2026-09-05",
        status: "completed",
      },
    ],
    resources: [],
  })

  assert.equal(summary.totalWorkItems, 4)
  assert.equal(summary.completedWorkItems, 1)
  assert.equal(summary.progressPercentage, 25)
  assert.equal(summary.activeWorkItems, 2)
  assert.equal(summary.overdueWorkItems, 1)
  assert.equal(summary.nextMilestone?.id, "next")
})

test("counts all and only Phase 2 active statuses", () => {
  const statuses = [
    "backlog",
    "todo",
    "in-progress",
    "review",
    "testing",
    "done",
  ]
  const summary = buildProjectOverviewSummary({
    today: "2026-09-02",
    workItems: statuses.map((status, index) =>
      createWorkItem("status-" + index, { status })
    ),
    milestones: [],
    resources: [],
  })

  assert.equal(summary.activeWorkItems, 4)
})

test("returns pinned Documents in project order", () => {
  const pinned = {
    id: "document-pinned",
    projectId: "project-a",
    title: "Pinned",
    type: "document",
    templateId: null,
    isPinned: true,
  }
  const summary = buildProjectOverviewSummary({
    today: "2026-09-02",
    workItems: [],
    milestones: [],
    resources: [
      {
        id: "document-unpinned",
        projectId: "project-a",
        title: "Unpinned",
        type: "document",
        templateId: null,
        isPinned: false,
      },
      pinned,
      {
        id: "canvas-pinned",
        projectId: "project-a",
        title: "Canvas",
        type: "canvas",
        templateId: null,
        isPinned: true,
      },
    ],
  })

  assert.deepEqual(summary.pinnedDocuments, [pinned])
})

test("returns stable empty metrics and formats a local date key", () => {
  const summary = buildProjectOverviewSummary({
    today: "2026-09-02",
    workItems: [],
    milestones: [],
    resources: [],
  })

  assert.deepEqual(summary, {
    totalWorkItems: 0,
    completedWorkItems: 0,
    progressPercentage: 0,
    activeWorkItems: 0,
    overdueWorkItems: 0,
    nextMilestone: null,
    pinnedDocuments: [],
  })
  assert.equal(
    getLocalDateKey(new Date(2026, 8, 2, 12, 0, 0)),
    "2026-09-02"
  )
})
