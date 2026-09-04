import assert from "node:assert/strict"
import test from "node:test"

import { BOARD_LABEL_COLORS } from "./board.ts"
import {
  PROJECT_VIEW_DEFINITIONS,
  SUPPORTED_PROJECT_VIEW_TYPES,
  createProjectViewConfig,
  isSupportedProjectViewType,
} from "./view-definitions.ts"

test("exposes only Phase 2 work view types", () => {
  assert.deepEqual(SUPPORTED_PROJECT_VIEW_TYPES, [
    "board",
    "table",
    "calendar",
  ])
  assert.equal(isSupportedProjectViewType("board"), true)
  assert.equal(isSupportedProjectViewType("table"), true)
  assert.equal(isSupportedProjectViewType("calendar"), true)
  assert.equal(isSupportedProjectViewType("timeline"), false)
  assert.equal(isSupportedProjectViewType("canvas"), false)

  assert.deepEqual(PROJECT_VIEW_DEFINITIONS.table.visibleFieldIds, [
    "name",
    "status",
    "priority",
    "due",
    "attachments",
  ])
})

test("creates fresh deterministic view records", () => {
  const first = createProjectViewConfig("project-new", "board")
  const second = createProjectViewConfig("project-new", "board")

  assert.deepEqual(first, {
    id: "view-project-new-board",
    projectId: "project-new",
    title: "Board",
    type: "board",
    visibleFieldIds: [
      "title",
      "type",
      "priority",
      "assignee",
      "dueDate",
      "labels",
      "checklist",
    ],
    groupBy: "board",
    filterIds: [],
    boardIds: [],
    labels: [],
  })
  assert.notStrictEqual(first, second)
  assert.notStrictEqual(first.visibleFieldIds, second.visibleFieldIds)
  assert.notStrictEqual(first.filterIds, second.filterIds)
  assert.notStrictEqual(first.boardIds, second.boardIds)
  assert.notStrictEqual(first.labels, second.labels)

  first.visibleFieldIds.push("changed")
  assert.equal(second.visibleFieldIds.includes("changed"), false)
})

test("exposes the fixed Board label palette", () => {
  assert.deepEqual(BOARD_LABEL_COLORS, [
    "gray",
    "orange",
    "yellow",
    "green",
    "blue",
    "purple",
    "pink",
    "red",
  ])
})
