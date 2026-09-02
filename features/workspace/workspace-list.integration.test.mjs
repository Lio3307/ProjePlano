import assert from "node:assert/strict"
import test from "node:test"

const BASE_URL =
  process.env.DASHBOARD_TEST_URL ?? "http://localhost:3000"

const WORKSPACE_HREFS = [
  "/dashboard/workspaces/project-alpha",
  "/dashboard/workspaces/project-beta",
  "/dashboard/workspaces/project-gamma",
  "/dashboard/workspaces/project-delta",
  "/dashboard/workspaces/project-echo",
  "/dashboard/workspaces/project-foxtrot",
]

test("keeps workspace actions outside workspace navigation links", async () => {
  const html = await getHtml("/dashboard")
  const workspaceCardLinks = getWorkspaceCardLinks(html)
  const workspaceActionButtons = getWorkspaceActionButtons(html)

  assert.equal(workspaceCardLinks.length, WORKSPACE_HREFS.length)
  assert.equal(workspaceActionButtons.length, WORKSPACE_HREFS.length)

  for (const href of WORKSPACE_HREFS) {
    const link = workspaceCardLinks.find((anchor) =>
      anchor.includes('href="' + href + '"')
    )

    assert.ok(link, "Missing workspace card link: " + href)
    assert.equal(
      link.includes('aria-haspopup="menu"'),
      false,
      "Dropdown trigger is nested inside: " + href
    )
  }
})

async function getHtml(pathname) {
  const response = await fetch(new URL(pathname, BASE_URL))

  assert.equal(response.status, 200, pathname)

  return response.text()
}

function getWorkspaceCardLinks(html) {
  return getAnchors(html).filter(
    (anchor) =>
      /href="\/dashboard\/workspaces\/[^"/]+"/.test(anchor) &&
      anchor.includes('data-slot="card"')
  )
}

function getWorkspaceActionButtons(html) {
  return (
    html.match(
      /<button\b[^>]*aria-label="Open actions for [^"]+"[^>]*aria-haspopup="menu"[^>]*>/g
    ) ?? []
  )
}

function getAnchors(html) {
  return html.match(/<a\b[^>]*>[\s\S]*?<\/a>/g) ?? []
}
