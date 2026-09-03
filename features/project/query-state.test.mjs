import assert from "node:assert/strict"
import test from "node:test"

import {
  getProjectViewHref,
  resolveProjectSelection,
} from "./query-state.ts"
import { createProjectViewConfig } from "./view-definitions.ts"

const board = createProjectViewConfig("project-a", "board")
const boardTwo = {
  ...createProjectViewConfig("project-a", "board"),
  id: "view-project-a-board-2",
  title: "Board 2",
}
const table = createProjectViewConfig("project-a", "table")
const document = {
  id: "resource-project-a-document",
  projectId: "project-a",
  title: "Project Brief",
  type: "document",
  templateId: null,
  isPinned: true,
  content: "<h1>Project Brief</h1>",
}
const decisionLog = {
  ...document,
  id: "resource-project-a-decision-log",
  title: "Decision log",
  isPinned: false,
  content: "<h1>Decision log</h1>",
}

test("falls back to Overview for absent, invalid, or unavailable views", () => {
  assert.deepEqual(resolveProjectSelection([board], [document], {}), {
    kind: "overview",
  })
  assert.deepEqual(
    resolveProjectSelection([board], [document], { view: "canvas" }),
    { kind: "overview" }
  )
  assert.deepEqual(
    resolveProjectSelection([board], [document], { view: "table" }),
    { kind: "overview" }
  )
})

test("resolves the first repeated supported work-view query", () => {
  assert.deepEqual(
    resolveProjectSelection([board, table], [document], {
      view: ["table", "board"],
    }),
    { kind: "work", view: table }
  )
})

test("resolves a specifically addressed work-view instance", () => {
  assert.deepEqual(
    resolveProjectSelection([board, boardTwo], [document], {
      view: "board",
      workView: [boardTwo.id, board.id],
    }),
    { kind: "work", view: boardTwo }
  )
  assert.deepEqual(
    resolveProjectSelection([board, boardTwo], [document], {
      view: "board",
    }),
    { kind: "work", view: board }
  )
})

test("rejects an unavailable or type-mismatched explicit work view", () => {
  assert.deepEqual(
    resolveProjectSelection([board, table], [document], {
      view: "board",
      workView: "view-project-foreign-board",
    }),
    { kind: "overview" }
  )
  assert.deepEqual(
    resolveProjectSelection([board, table], [document], {
      view: "table",
      workView: board.id,
    }),
    { kind: "overview" }
  )
})

test("opens the first owned view from the Work area", () => {
  assert.deepEqual(
    resolveProjectSelection([board, table], [document], {
      view: "work",
    }),
    { kind: "work", view: board }
  )
})

test("keeps the Work area available without an owned view", () => {
  assert.deepEqual(
    resolveProjectSelection([], [document], { view: "work" }),
    { kind: "empty-work" }
  )
})

test("ignores resource and work-view IDs outside their areas", () => {
  assert.deepEqual(
    resolveProjectSelection([board], [document], {
      view: "board",
      resource: "resource-foreign",
    }),
    { kind: "work", view: board }
  )
  assert.deepEqual(
    resolveProjectSelection([board], [document], {
      view: "overview",
      workView: board.id,
      resource: "resource-foreign",
    }),
    { kind: "overview" }
  )
})

test("opens the first Document when resource is absent", () => {
  assert.deepEqual(
    resolveProjectSelection([board], [document], { view: "documents" }),
    { kind: "document", resource: document }
  )
})

test("resolves a valid Document and reports an explicit invalid resource", () => {
  assert.deepEqual(
    resolveProjectSelection([board], [document, decisionLog], {
      view: "documents",
      resource: decisionLog.id,
    }),
    { kind: "document", resource: decisionLog }
  )
  assert.deepEqual(
    resolveProjectSelection([board], [document], {
      view: "documents",
      resource: [document.id, "ignored"],
    }),
    { kind: "document", resource: document }
  )
  assert.deepEqual(
    resolveProjectSelection([board], [document], {
      view: "documents",
      resource: "resource-foreign",
    }),
    {
      kind: "missing-resource",
      resourceId: "resource-foreign",
    }
  )
  assert.deepEqual(
    resolveProjectSelection([board], [], {
      view: "documents",
      resource: "resource-foreign",
    }),
    { kind: "overview" }
  )
})

test("builds encoded canonical project view links", () => {
  assert.equal(
    getProjectViewHref("project-alpha", "1", "work"),
    "/dashboard/workspaces/project-alpha/projects/1?view=work"
  )
  assert.equal(
    getProjectViewHref(
      "workspace alpha",
      "project/one",
      "overview"
    ),
    "/dashboard/workspaces/workspace%20alpha/projects/project%2Fone?view=overview"
  )
  assert.equal(
    getProjectViewHref("project-alpha", "1", "documents", {
      resourceId: "resource-1-document",
    }),
    "/dashboard/workspaces/project-alpha/projects/1?view=documents&resource=resource-1-document"
  )
  assert.equal(
    getProjectViewHref("project-alpha", "1", "board", {
      workViewId: "view-1-board-2",
    }),
    "/dashboard/workspaces/project-alpha/projects/1?view=board&workView=view-1-board-2"
  )
  assert.equal(
    getProjectViewHref("project-alpha", "1", "overview", {
      resourceId: "ignored-resource",
      workViewId: "ignored-view",
    }),
    "/dashboard/workspaces/project-alpha/projects/1?view=overview"
  )
})
