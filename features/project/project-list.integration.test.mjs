import assert from "node:assert/strict"
import test from "node:test"

const BASE_URL =
  process.env.DASHBOARD_TEST_URL ?? "http://localhost:3000"

const PROJECT_HREFS = [
  "/dashboard/workspaces/project-alpha/projects/1",
  "/dashboard/workspaces/project-alpha/projects/2",
  "/dashboard/workspaces/project-alpha/projects/3",
  "/dashboard/workspaces/project-alpha/projects/4",
  "/dashboard/workspaces/project-alpha/projects/5",
  "/dashboard/workspaces/project-alpha/projects/6",
]

test("renders normalized project cards for the workspace", async () => {
  const html = await getHtml("/dashboard/workspaces/project-alpha")
  const projectLinks = getAnchors(html).filter((anchor) =>
    anchor.includes("data-project-card")
  )

  assert.equal(projectLinks.length, PROJECT_HREFS.length)

  for (const href of PROJECT_HREFS) {
    const link = projectLinks.find((anchor) =>
      anchor.includes('href="' + href + '"')
    )

    assert.ok(link, "Missing normalized project card: " + href)
    assert.equal(link.includes("active"), true)
    assert.equal(link.includes('aria-haspopup="menu"'), false)
  }
})

test("renders an informative empty project state", async () => {
  const html = await getHtml("/dashboard/workspaces/project-beta")

  assert.equal(html.includes("data-project-list-empty"), true)
  assert.equal(html.includes("No projects yet"), true)
})

test("renders the accessible project creation trigger", async () => {
  const html = await getHtml("/dashboard/workspaces/project-alpha")
  const trigger = html.match(
    /<button\b[^>]*data-new-project-trigger[^>]*>/
  )?.[0]

  assert.ok(trigger)
  assert.equal(trigger.includes('aria-haspopup="dialog"'), true)
  assert.equal(trigger.includes('aria-expanded="false"'), true)
  assert.equal(html.includes("New project"), true)
})

async function getHtml(pathname) {
  const response = await fetch(new URL(pathname, BASE_URL))

  assert.equal(response.status, 200, pathname)

  return response.text()
}

function getAnchors(html) {
  return html.match(/<a\b[^>]*>[\s\S]*?<\/a>/g) ?? []
}
