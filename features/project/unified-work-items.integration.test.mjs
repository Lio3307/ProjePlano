import assert from "node:assert/strict"
import test from "node:test"

const BASE_URL =
  process.env.DASHBOARD_TEST_URL ?? "http://localhost:3000"

test("renders six shared Board statuses and one create action", async () => {
  const html = await getHtml(
    "/dashboard/workspaces/project-alpha/projects/2?view=board"
  )

  assert.equal((html.match(/data-kanban-status=/g) ?? []).length, 6)
  assert.equal(
    (html.match(/data-new-work-item-trigger/g) ?? []).length,
    1
  )
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

  assert.equal(
    (html.match(/data-new-work-item-trigger/g) ?? []).length,
    0
  )
  assert.equal(html.includes('aria-label="Column name"'), true)
  assert.equal(html.includes('aria-label="Add column"'), true)
  assert.equal(html.includes("New"), true)
  assert.equal(html.includes("Design review"), true)
})

test("renders scheduled Calendar tasks and the Unscheduled section", async () => {
  const html = await getHtml(
    "/dashboard/workspaces/project-alpha/projects/6?view=calendar"
  )

  assert.equal(html.includes("data-calendar-unscheduled"), true)
  assert.equal(html.includes("Unscheduled"), true)
  assert.equal(html.includes("Launch planning kickoff"), true)
  assert.equal(
    (html.match(/data-new-work-item-trigger/g) ?? []).length,
    1
  )
})

async function getHtml(pathname) {
  const response = await fetch(new URL(pathname, BASE_URL))

  assert.equal(response.status, 200, pathname)

  return response.text()
}
