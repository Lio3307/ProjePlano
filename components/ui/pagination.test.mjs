import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const paginationSourceUrl = new URL("./pagination.tsx", import.meta.url)

test("renders pagination links as direct anchors", async () => {
  const source = await readFile(paginationSourceUrl, "utf8")
  const paginationLink = source.match(
    /function PaginationLink\([\s\S]*?\n}\r?\n\r?\nfunction PaginationPrevious/
  )

  assert.ok(paginationLink, "PaginationLink source was not found")
  assert.match(paginationLink[0], /return \(\r?\n\s*<a\b/)
  assert.doesNotMatch(paginationLink[0], /<Button\b/)
  assert.match(paginationLink[0], /buttonVariants\(/)
  assert.equal(
    paginationLink[0].match(/data-slot="pagination-link"/g)?.length,
    1
  )
})
