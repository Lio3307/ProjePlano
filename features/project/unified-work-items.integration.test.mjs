import assert from "node:assert/strict"
import test from "node:test"

const BASE_URL =
  process.env.DASHBOARD_TEST_URL ?? "http://localhost:3000"

test("renders the Kanban header and one create action per seeded Board", async () => {
  const html = await getHtml(
    "/dashboard/workspaces/project-alpha/projects/2?view=board"
  )

  assert.equal(html.includes('data-project-work-view="board"'), true)
  assert.match(html, /<h2\b[^>]*>\s*Board\s*<\/h2>/)
  assert.equal(html.includes("Board settings"), true)
  assert.equal(html.includes("Set labels"), true)
  assert.equal(html.includes("Add board"), true)
  assert.equal((html.match(/data-kanban-board=/g) ?? []).length, 6)
  assert.equal((html.match(/Add task/g) ?? []).length, 6)
  assert.equal(html.includes("data-new-work-item-trigger"), false)
  assert.equal(html.includes("New task"), false)
  assert.equal(html.includes("Audit the onboarding flow"), true)
  assert.equal(html.includes("Demo view data"), false)
})

test("renders the editable Notion-style Table without the shared task action", async () => {
  const html = await getHtml(
    "/dashboard/workspaces/project-alpha/projects/3?view=table"
  )

  for (const heading of [
    "Name",
    "Status",
    "Priority",
    "Due date",
    "Attachments",
  ]) {
    assert.equal(html.includes('value="' + heading + '"'), true, heading)
  }

  assert.equal(html.includes("Add task"), false)
  assert.equal(html.includes("New task"), false)
  assert.equal(html.includes("data-new-work-item-trigger"), false)
  assert.equal(html.includes('aria-label="Column name"'), true)
  assert.equal(html.includes('aria-label="Add column"'), true)
  assert.equal(html.includes("Add row"), true)
  assert.equal(html.includes("Design review"), true)
})

test("renders project-wide Calendar tasks without a task creation action", async () => {
  const html = await getHtml(
    "/dashboard/workspaces/project-alpha/projects/6?view=calendar"
  )

  assert.equal(html.includes('data-project-work-view="calendar"'), true)
  assert.equal(html.includes("data-calendar-unscheduled"), true)
  assert.equal(html.includes("Unscheduled"), true)
  assert.equal(
    html.includes('data-calendar-work-item-count="8"'),
    true
  )
  assert.equal(html.includes("Add board"), false)
  assert.equal(html.includes("Add task"), false)
  assert.equal(html.includes("New task"), false)
  assert.equal(html.includes("data-new-work-item-trigger"), false)
})

async function getHtml(pathname) {
  const response = await fetch(new URL(pathname, BASE_URL))

  assert.equal(response.status, 200, pathname)

  return response.text()
}
