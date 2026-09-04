import assert from "node:assert/strict"
import test from "node:test"

import { normalizeTaskBoardFields } from "./task-board.ts"

test("normalizes editable task board fields", () => {
  assert.deepEqual(
    normalizeTaskBoardFields({
      title: "  Todo  ",
      description: "  Ready to start  ",
      stage: "todo",
    }),
    {
      title: "Todo",
      description: "Ready to start",
      stage: "todo",
    }
  )
})

test("rejects task boards without a title or supported stage", () => {
  assert.equal(
    normalizeTaskBoardFields({
      title: "   ",
      description: "",
      stage: "todo",
    }),
    null
  )

  assert.equal(
    normalizeTaskBoardFields({
      title: "Blocked",
      description: "",
      stage: "blocked",
    }),
    null
  )
})
