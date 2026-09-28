import assert from "node:assert/strict"
import test from "node:test"

import { buildDependencyGraph, traceDependencyPath } from "./dependency-graph.ts"

const task = (id, dependencyIds = []) => ({ id, dependencyIds })

test("a prerequisite chain places each dependent task one layer deeper", () => {
  const graph = buildDependencyGraph([
    task("release", ["test"]), task("test", ["build"]), task("build"),
  ])

  assert.deepEqual([...graph.levels], [["build", 0], ["test", 1], ["release", 2]])
  assert.deepEqual(graph.predecessors.get("release"), ["test"])
  assert.deepEqual(graph.successors.get("build"), ["test"])
})

test("branching work traces all upstream and downstream tasks without unrelated branches", () => {
  const graph = buildDependencyGraph([
    task("deploy", ["api", "ui"]), task("api", ["schema"]),
    task("ui", ["design"]), task("schema"), task("design"), task("other"),
  ])

  assert.deepEqual([...traceDependencyPath("deploy", graph.predecessors)].sort(), ["api", "design", "schema", "ui"])
  assert.deepEqual([...traceDependencyPath("schema", graph.successors)].sort(), ["api", "deploy"])
  assert.equal(graph.levels.get("deploy"), 2)
  assert.equal(traceDependencyPath("api", graph.successors).has("other"), false)
})

test("isolated tasks start at layer zero and unknown prerequisites have no graph edge", () => {
  const graph = buildDependencyGraph([task("solo"), task("waiting", ["missing"])])

  assert.deepEqual([...graph.levels.values()], [0, 0])
  assert.deepEqual(graph.predecessors.get("waiting"), [])
  assert.deepEqual([...traceDependencyPath("solo", graph.successors)], [])
})

test("a corrupt cycle terminates layout and traversal", () => {
  const graph = buildDependencyGraph([task("a", ["b"]), task("b", ["a"]), task("independent")])

  assert.equal(graph.levels.get("independent"), 0)
  assert.equal(graph.levels.get("a"), 0)
  assert.equal(graph.levels.get("b"), 0)
  assert.deepEqual([...traceDependencyPath("a", graph.predecessors)], ["b"])
})
