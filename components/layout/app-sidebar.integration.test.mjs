import assert from "node:assert/strict"
import test from "node:test"

const BASE_URL =
  process.env.DASHBOARD_TEST_URL ?? "http://localhost:3000"

const VALID_SIDEBAR_HREFS = [
  "/dashboard",
  "/dashboard/workspaces/project-alpha",
  "/dashboard/workspaces/project-alpha/projects/1",
  "/dashboard/workspaces/project-alpha/projects/2",
  "/dashboard/workspaces/project-alpha/projects/3",
  "/dashboard/workspaces/project-alpha/projects/4",
  "/dashboard/workspaces/project-alpha/projects/5",
  "/dashboard/workspaces/project-alpha/projects/6",
]

const UNSUPPORTED_SIDEBAR_HREFS = [
  "/dashboard/tasks",
  "/dashboard/team",
  "/dashboard/calendar",
  "/dashboard/messages",
  "/dashboard/settings",
]

const ACTIVE_ROUTES = [
  { pathname: "/dashboard", href: "/dashboard" },
  {
    pathname: "/dashboard/workspaces/project-alpha",
    href: "/dashboard/workspaces/project-alpha",
  },
  {
    pathname: "/dashboard/workspaces/project-alpha/projects/6",
    href: "/dashboard/workspaces/project-alpha/projects/6",
  },
]

test("renders only implemented sidebar destinations", async () => {
  const html = await getHtml("/dashboard")
  const sidebarAnchors = getSidebarAnchors(html)

  for (const href of VALID_SIDEBAR_HREFS) {
    assert.ok(
      sidebarAnchors.some((anchor) => hasHref(anchor, href)),
      "Missing sidebar destination: " + href
    )
  }

  for (const href of UNSUPPORTED_SIDEBAR_HREFS) {
    assert.equal(
      sidebarAnchors.some((anchor) => hasHref(anchor, href)),
      false,
      "Unsupported sidebar destination: " + href
    )
  }
})

test("marks exactly one canonical destination active", async () => {
  for (const route of ACTIVE_ROUTES) {
    const html = await getHtml(route.pathname)
    const activeAnchors = getSidebarAnchors(html).filter((anchor) =>
      /\sdata-active(?:=""|(?=\s|>))/.test(anchor)
    )

    assert.equal(activeAnchors.length, 1, route.pathname)
    assert.equal(hasHref(activeAnchors[0], route.href), true)
    assert.equal(activeAnchors[0].includes('aria-current="page"'), true)
  }
})

async function getHtml(pathname) {
  const response = await fetch(new URL(pathname, BASE_URL))

  assert.equal(response.status, 200, pathname)

  return response.text()
}

function getSidebarAnchors(html) {
  return getAnchors(html).filter((anchor) =>
    anchor.includes('data-sidebar="menu-button"')
  )
}

function getAnchors(html) {
  return html.match(/<a\b[^>]*>[\s\S]*?<\/a>/g) ?? []
}

function hasHref(anchor, href) {
  return anchor.includes('href="' + href + '"')
}
