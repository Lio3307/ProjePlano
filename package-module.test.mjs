import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import test from "node:test"
import { fileURLToPath } from "node:url"

const PROJECT_ROOT = fileURLToPath(new URL(".", import.meta.url))

test("loads TypeScript test imports without module-type warnings", () => {
  const result = spawnSync(
    process.execPath,
    [
      "--input-type=module",
      "--eval",
      "import('./features/member/model.ts')",
    ],
    {
      cwd: PROJECT_ROOT,
      encoding: "utf8",
    }
  )

  assert.equal(result.status, 0, result.stderr)
  assert.doesNotMatch(result.stderr, /MODULE_TYPELESS_PACKAGE_JSON/)
})
