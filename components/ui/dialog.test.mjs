import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const dialogSourceUrl = new URL("./dialog.tsx", import.meta.url)

test("keeps viewport overflow clipped and popup overflow internal", async () => {
  const source = await readFile(dialogSourceUrl, "utf8")
  const viewport = source.match(
    /<DialogPrimitive\.Viewport[\s\S]*?>/
  )?.[0]
  const popup = source.match(
    /<DialogPrimitive\.Popup[\s\S]*?>/
  )?.[0]

  assert.ok(viewport)
  assert.match(viewport, /overflow-hidden/)
  assert.doesNotMatch(viewport, /overflow-y-auto/)
  assert.ok(popup)
  assert.match(popup, /max-h-\[calc\(100dvh-2rem\)\]/)
  assert.match(popup, /overflow-y-auto/)
})
