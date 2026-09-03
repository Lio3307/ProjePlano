import assert from "node:assert/strict"
import test from "node:test"

const BASE_URL =
  process.env.DASHBOARD_TEST_URL ?? "http://localhost:3000"

test("renders Overview as the default and invalid-view fallback", async () => {
  const defaultHtml = await getHtml(
    "/dashboard/workspaces/project-alpha/projects/2"
  )
  const invalidHtml = await getHtml(
    "/dashboard/workspaces/project-alpha/projects/2?view=canvas"
  )

  for (const html of [defaultHtml, invalidHtml]) {
    const anchors = getAnchors(html)

    assert.equal(html.includes('data-project-workspace="2"'), true)
    assert.equal(html.includes('data-project-selection="overview"'), true)
    assert.equal(html.includes("Sprint Board"), true)
    assert.equal(html.includes("Frontend demo"), true)
    assert.equal(
      anchors.some((anchor) => anchor.includes("?view=timeline")),
      false
    )
    assert.equal(
      anchors.some((anchor) => anchor.includes("?view=canvas")),
      false
    )
  }
})

test("renders an owned work view from its exact instance query", async () => {
  const html = await getHtml(
    "/dashboard/workspaces/project-alpha/projects/2?view=board&workView=view-2-board"
  )

  assert.equal(html.includes('data-project-selection="board"'), true)
  assert.equal(html.includes("Demo view data"), false)
  assert.equal(html.includes('data-project-work-view="board"'), true)
  assert.equal(html.includes("New task"), true)
  assert.equal(html.includes("Backlog"), true)
  assert.equal(
    html.includes("?view=board&amp;workView=view-2-board"),
    true
  )
})

test("rejects an explicit Work instance with a mismatched type", async () => {
  const html = await getHtml(
    "/dashboard/workspaces/project-alpha/projects/2?view=board&workView=view-3-table"
  )

  assert.equal(html.includes('data-project-selection="overview"'), true)
})

test("keeps an empty Work area available for a project without views", async () => {
  const html = await getHtml(
    "/dashboard/workspaces/project-alpha/projects/1?view=work"
  )

  assert.equal(
    html.includes('data-project-selection="empty-work"'),
    true
  )
  assert.match(
    html,
    /<a\b[^>]*aria-current="page"[^>]*>Work<\/a>/
  )
  assert.equal(
    html.includes('data-project-tab-strip="secondary"'),
    true
  )
  assert.equal(html.includes("data-add-work-view-trigger"), true)
  assert.equal(html.includes("No work views yet"), true)
})

test("renders an owned Document and an explicit missing-resource state", async () => {
  const documentHtml = await getHtml(
    "/dashboard/workspaces/project-alpha/projects/1?view=documents&resource=resource-1-document"
  )
  const missingHtml = await getHtml(
    "/dashboard/workspaces/project-alpha/projects/1?view=documents&resource=resource-5-document"
  )

  assert.equal(
    documentHtml.includes('data-project-selection="document"'),
    true
  )
  assert.equal(documentHtml.includes("Local editor content"), true)
  assert.equal(documentHtml.includes("API Design"), true)
  assert.equal(documentHtml.includes("Endpoint guidelines"), true)
  assert.equal(documentHtml.includes("Decision log"), true)
  assert.equal(
    documentHtml.includes('data-project-tab-strip="primary"'),
    true
  )
  assert.equal(
    documentHtml.includes('data-project-tab-strip="secondary"'),
    true
  )
  assert.equal(documentHtml.includes("data-document-switcher"), true)
  assert.equal(
    missingHtml.includes('data-project-selection="missing-resource"'),
    true
  )
  assert.equal(missingHtml.includes("Document not found"), true)
})

test("renders an inline state for a project absent from the client seed", async () => {
  const response = await fetch(
    new URL(
      "/dashboard/workspaces/project-alpha/projects/client-created",
      BASE_URL
    )
  )
  const html = await response.text()

  assert.equal(response.status, 200)
  assert.equal(
    html.includes('data-project-selection="missing-project"'),
    true
  )
  assert.equal(html.includes("Project not available"), true)
  assert.equal(html.includes("full page reload"), true)
})

async function getHtml(pathname) {
  const response = await fetch(new URL(pathname, BASE_URL))

  assert.equal(response.status, 200, pathname)

  return response.text()
}

function getAnchors(html) {
  return html.match(/<a\b[^>]*>[\s\S]*?<\/a>/g) ?? []
}
