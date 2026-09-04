import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

import {
  cloneLabelCatalog,
  haveSameLabelCatalog,
  normalizeLabelCatalog,
} from "./label-form.ts"

const dialogUrl = new URL(
  "./components/label-manager-dialog.tsx",
  import.meta.url
)

test("clones and normalizes a shared label catalog", () => {
  const labels = [
    { id: " label-release ", name: " Release ", color: "green" },
  ]
  const clone = cloneLabelCatalog(labels)

  assert.notStrictEqual(clone, labels)
  assert.notStrictEqual(clone[0], labels[0])
  assert.deepEqual(normalizeLabelCatalog(labels), [
    { id: "label-release", name: "Release", color: "green" },
  ])
})

test("rejects duplicate names and compares ordered catalogs", () => {
  const labels = [
    { id: "label-a", name: "Release", color: "green" },
    { id: "label-b", name: " release ", color: "blue" },
  ]

  assert.equal(normalizeLabelCatalog(labels), null)
  assert.equal(
    haveSameLabelCatalog(
      [{ id: "label-a", name: "Release", color: "green" }],
      [{ id: "label-a", name: "Release", color: "green" }]
    ),
    true
  )
})

test("manages labels separately through one shadcn dialog", async () => {
  const source = await readFile(dialogUrl, "utf8")
  const addHandler = source.match(
    /function handleAddLabel[\s\S]*?\n  }/
  )?.[0]

  assert.ok(addHandler)
  assert.match(addHandler, /crypto\.randomUUID\(\)/)
  assert.equal(source.match(/crypto\.randomUUID\(\)/g)?.length, 1)
  assert.match(source, />\s*Set labels\s*</)
  assert.match(source, />\s*Add label\s*</)
  assert.match(source, /No labels yet\./)
  assert.match(source, /BOARD_LABEL_COLORS\.map/)
  assert.match(source, /Remove/)
  assert.match(source, /@\/components\/ui\/dialog/)
  assert.equal(source.match(/overflow-y-auto/g)?.length, 1)
})
