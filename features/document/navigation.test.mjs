import assert from "node:assert/strict"
import test from "node:test"
import * as navigation from "./navigation.ts"

test("draft navigation waits for a decision and a successful save", () => {
  assert.equal(typeof navigation.createDocumentNavigation, "function")
  let prompts = 0, leaves = 0, saves = 0, discards = 0
  let canSave = false
  const guard = navigation.createDocumentNavigation(() => prompts++)
  guard.register({ save: () => { saves++; return canSave }, discard: () => discards++ })
  guard.request(() => leaves++)
  assert.equal(prompts, 1)
  assert.equal(leaves, 0)
  assert.equal(guard.resolve("save"), false)
  assert.equal(leaves, 0)
  canSave = true
  assert.equal(guard.resolve("save"), true)
  assert.equal(leaves, 1)
  assert.equal(saves, 2)
  assert.equal(discards, 0)
  guard.request(() => leaves++)
  assert.equal(leaves, 2)
})

test("Stay preserves the draft; Discard resumes only the pending navigation", () => {
  assert.equal(typeof navigation.createDocumentNavigation, "function")
  let leaves = 0, discards = 0
  const guard = navigation.createDocumentNavigation(() => {})
  const cleanup = guard.register({ save: () => { throw new Error("unavailable") }, discard: () => discards++ })
  guard.request(() => leaves++)
  assert.equal(guard.resolve("save"), false)
  guard.resolve("stay")
  assert.equal(leaves, 0)
  guard.request(() => leaves++)
  guard.resolve("discard")
  assert.equal(leaves, 1)
  assert.equal(discards, 1)
  cleanup()
  guard.request(() => leaves++)
  assert.equal(leaves, 2)
})
