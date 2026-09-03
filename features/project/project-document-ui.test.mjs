import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import test from "node:test"

const componentPath = new URL("./components/", import.meta.url)

function readComponent(name) {
  const file = new URL(name, componentPath)
  return existsSync(file) ? readFileSync(file, "utf8") : ""
}

test("uses the shared dialog form for document creation", () => {
  const source = readComponent("new-document-dialog.tsx")

  assert.match(source, /DialogContent/)
  assert.match(source, /DialogFooter/)
  assert.match(source, /Input/)
  assert.match(source, /role="alert"/)
  assert.match(source, /onOpenChangeComplete/)
  assert.match(source, /onCreate\(title\)/)
})

test("renders every document as a canonical dropdown link", () => {
  const source = readComponent("project-document-navigation.tsx")

  assert.match(source, /DropdownMenu/)
  assert.match(source, /documents\.map/)
  assert.match(source, /getProjectViewHref/)
  assert.match(source, /<Link/)
  assert.match(source, /aria-label="Select document"/)
  assert.match(source, /data-document-switcher/)
  assert.match(source, /onAddDocument\(event\.currentTarget\)/)
})

test("uses connected rectangular strips for both navigation levels", () => {
  const navigation = readComponent("project-navigation.tsx")
  const documents = readComponent("project-document-navigation.tsx")
  const source = navigation + documents

  assert.match(navigation, /data-project-tab-strip="primary"/)
  assert.match(source, /data-project-tab-strip="secondary"/)
  assert.match(source, /border-x/)
  assert.match(source, /border-y/)
  assert.match(source, /divide-x/)
  assert.match(source, /rounded-none/)
})

test("keeps document creation available from project overview", () => {
  const source = readComponent("project-overview.tsx")

  assert.doesNotMatch(source, /canAddDocument/)
  assert.match(source, /onAddDocument\(event\.currentTarget\)/)
  assert.match(source, /Add document/)
})

test("creates document IDs only from the submit handler", () => {
  const source = readComponent("project-workspace.tsx")
  const createHandler = source.match(
    /function handleCreateDocument[\s\S]*?\n  }/
  )?.[0]

  assert.ok(createHandler)
  assert.match(createHandler, /crypto\.randomUUID\(\)/)
  assert.match(createHandler, /addProjectDocument\(\{/)
  assert.equal((source.match(/crypto\.randomUUID\(\)/g) ?? []).length, 1)
  assert.equal((source.match(/<NewDocumentDialog/g) ?? []).length, 1)
  assert.match(source, /open=\{documentDialogOpen\}/)
})

test("keys each editor and saves its own resource content", () => {
  const projectView = readComponent("project-view.tsx")
  const documentView = new URL(
    "../document/components/document-view.tsx",
    import.meta.url
  )
  const documentSource = existsSync(documentView)
    ? readFileSync(documentView, "utf8")
    : ""

  assert.match(projectView, /key=\{selection\.resource\.id\}/)
  assert.match(projectView, /savedContent=\{selection\.resource\.content\}/)
  assert.match(projectView, /onSave=\{onSaveDocument\}/)
  assert.match(documentSource, /content !== savedContent/)
  assert.match(documentSource, /onSave\(resourceId, content\)/)
  assert.match(documentSource, /role="status"/)
})
