import assert from "node:assert/strict"
import test from "node:test"

const BASE_URL =
  process.env.DASHBOARD_TEST_URL ?? "http://localhost:3000"

test("renders the Project Alpha member directory", async () => {
  const { response, html } = await getHtml(
    "/dashboard/workspaces/project-alpha/members"
  )

  assert.equal(response.status, 200)
  assert.match(html, /data-workspace-members="project-alpha"/)
  assert.match(html, />Members</)
  assert.match(html, />Add member</)
  assert.match(html, />Aurelio</)
  assert.match(html, />Maya Chen</)
})

test("keeps the Project Beta member route in its own sidebar context", async () => {
  const { response, html } = await getHtml(
    "/dashboard/workspaces/project-beta/members"
  )

  assert.equal(response.status, 200)
  assert.match(html, /data-workspace-members="project-beta"/)
  assert.match(
    html,
    /href="\/dashboard\/workspaces\/project-beta\/members"/
  )
  assert.match(html, />Sari</)
  assert.doesNotMatch(
    html,
    /href="\/dashboard\/workspaces\/project-alpha\/projects\//
  )
})

async function getHtml(pathname) {
  const response = await fetch(new URL(pathname, BASE_URL))
  const html = await response.text()

  return { response, html }
}
