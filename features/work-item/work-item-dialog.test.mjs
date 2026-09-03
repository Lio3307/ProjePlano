import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const dialogSourceUrl = new URL(
  "./components/work-item-dialog.tsx",
  import.meta.url
)
const dialogPrimitiveSourceUrl = new URL(
  "../../components/ui/dialog.tsx",
  import.meta.url
)
const formSourceUrl = new URL(
  "./components/work-item-form.tsx",
  import.meta.url
)

test("keeps project-store ownership outside the shared dialog", async () => {
  const source = await readFile(dialogSourceUrl, "utf8")

  assert.doesNotMatch(source, /useProjectStore|project\/store/)
  assert.match(source, /role="alert"/)
  assert.match(source, /Confirm delete/)
  assert.match(source, /Cancel delete/)
  assert.match(source, /haveSameEditableWorkItemFields/)
})

test("keeps task dialog chrome visible while its form content scrolls", async () => {
  const [source, primitiveSource] = await Promise.all([
    readFile(dialogSourceUrl, "utf8"),
    readFile(dialogPrimitiveSourceUrl, "utf8"),
  ])

  assert.match(primitiveSource, /function DialogFooter/)
  assert.match(primitiveSource, /data-slot="dialog-footer"/)
  assert.match(source, /overflow-hidden p-0/)
  assert.match(source, /sticky top-0/)
  assert.match(source, /min-h-0 flex-1 overflow-y-auto/)
  assert.match(source, /<DialogFooter[\s\S]*?shrink-0/)
})

test("uses native accessible task controls", async () => {
  const source = await readFile(formSourceUrl, "utf8")

  assert.equal(source.match(/<select\b/g)?.length, 3)
  assert.match(source, /type="date"/)
  assert.match(source, /type="number"/)
  assert.match(source, /type="checkbox"/)
})

test("creates checklist IDs only from the add handler", async () => {
  const source = await readFile(formSourceUrl, "utf8")

  assert.match(
    source,
    /function handleAddChecklistItem[\s\S]*?crypto\.randomUUID\(\)/
  )
  assert.equal(source.match(/crypto\.randomUUID\(\)/g)?.length, 1)
  assert.doesNotMatch(source, /Date\.now|Math\.random/)
})
