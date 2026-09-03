import assert from "node:assert/strict"
import test from "node:test"

import {
  getProjectViewHref,
  resolveProjectSelection,
} from "./query-state.ts"
import { createProjectViewConfig } from "./view-definitions.ts"

const board = createProjectViewConfig("project-a", "board")
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
  assert.deepEqual(
    resolveProjectSelection([board], [document], undefined, undefined),
    { kind: "overview" }
  )
  assert.deepEqual(
    resolveProjectSelection([board], [document], "canvas", undefined),
    { kind: "overview" }
  )
  assert.deepEqual(
    resolveProjectSelection([board], [document], "table", undefined),
    { kind: "overview" }
  )
})

test("resolves the first repeated supported work view", () => {
  assert.deepEqual(
    resolveProjectSelection(
      [board, table],
      [document],
      ["table", "board"],
      undefined
    ),
    { kind: "work", view: table }
  )
})

test("ignores resource outside the Documents area", () => {
  assert.deepEqual(
    resolveProjectSelection(
      [board],
      [document],
      "board",
      "resource-foreign"
    ),
    { kind: "work", view: board }
  )
  assert.deepEqual(
    resolveProjectSelection(
      [board],
      [document],
      "overview",
      "resource-foreign"
    ),
    { kind: "overview" }
  )
})

test("opens the first Document when resource is absent", () => {
  assert.deepEqual(
    resolveProjectSelection(
      [board],
      [document],
      "documents",
      undefined
    ),
    { kind: "document", resource: document }
  )
})

test("resolves a valid Document and reports an explicit invalid resource", () => {
  assert.deepEqual(
    resolveProjectSelection(
      [board],
      [document, decisionLog],
      "documents",
      decisionLog.id
    ),
    { kind: "document", resource: decisionLog }
  )
  assert.deepEqual(
    resolveProjectSelection(
      [board],
      [document],
      "documents",
      [document.id, "ignored"]
    ),
    { kind: "document", resource: document }
  )
  assert.deepEqual(
    resolveProjectSelection(
      [board],
      [document],
      "documents",
      "resource-foreign"
    ),
    {
      kind: "missing-resource",
      resourceId: "resource-foreign",
    }
  )
  assert.deepEqual(
    resolveProjectSelection([board], [], "documents", "resource-foreign"),
    { kind: "overview" }
  )
})

test("builds encoded canonical project view links", () => {
  assert.equal(
    getProjectViewHref(
      "workspace alpha",
      "project/one",
      "overview"
    ),
    "/dashboard/workspaces/workspace%20alpha/projects/project%2Fone?view=overview"
  )
  assert.equal(
    getProjectViewHref(
      "project-alpha",
      "1",
      "documents",
      "resource-1-document"
    ),
    "/dashboard/workspaces/project-alpha/projects/1?view=documents&resource=resource-1-document"
  )
})
