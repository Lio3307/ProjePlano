import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const componentPath = new URL("./components/", import.meta.url)
const routePath = new URL(
  "../../app/dashboard/workspaces/[workspaceId]/projects/[projectId]/page.tsx",
  import.meta.url
)

function readComponent(name) {
  return readFileSync(new URL(name, componentPath), "utf8")
}

test("keeps Work as a permanent primary project area", () => {
  const source = readComponent("project-navigation.tsx")

  assert.match(source, /const workIsActive =\s*[\s\S]*"empty-work"/)
  assert.match(
    source,
    /getProjectViewHref\(\s*workspaceId,\s*projectId,\s*"work"\s*\)/
  )
  assert.match(source, />\s*Work\s*<\/ProjectTabLink>/)
  assert.match(source, /\{workIsActive \? \(/)
})

test("puts Work creation in an always-present plus dropdown", () => {
  const source = readComponent("project-navigation.tsx")

  assert.match(source, /aria-label="Add work view"/)
  assert.match(source, /data-add-work-view-trigger/)
  assert.match(source, /SUPPORTED_PROJECT_VIEW_TYPES\.map/)
  assert.match(source, /PROJECT_VIEW_DEFINITIONS\[type\]\.title/)
  assert.doesNotMatch(source, /missingViewTypes/)
  assert.doesNotMatch(source, /All work types added/)
})

test("links every Work tab and Overview row to its exact instance", () => {
  const navigation = readComponent("project-navigation.tsx")
  const overview = readComponent("project-overview.tsx")

  for (const source of [navigation, overview]) {
    assert.match(
      source,
      /view\.type,\s*\{\s*workViewId: view\.id,?\s*\}/
    )
  }
})

test("lists owned Work views on Overview instead of build actions", () => {
  const source = readComponent("project-overview.tsx")

  assert.match(source, /workViews: readonly SupportedProjectView\[\]/)
  assert.match(source, /workViews\.map/)
  assert.match(source, /getProjectViewHref/)
  assert.match(source, /Work views/)
  assert.match(source, /No work views yet/)
  assert.doesNotMatch(source, /Build your workspace/)
  assert.doesNotMatch(source, /onAddView/)
})

test("renders a focused empty state for a project without Work views", () => {
  const source = readComponent("project-workspace.tsx")

  assert.match(source, /selection\.kind === "empty-work"/)
  assert.match(source, /data-empty-work-state/)
  assert.match(source, /Use the \+ menu above/)
  assert.match(source, /workViews=\{workViews\}/)
})

test("creates a stable Work-view ID and plumbs its query through the route", () => {
  const workspace = readComponent("project-workspace.tsx")
  const route = readFileSync(routePath, "utf8")
  const addHandler = workspace.match(
    /function handleAddView[\s\S]*?\n  }/
  )?.[0]

  assert.ok(addHandler)
  assert.match(addHandler, /crypto\.randomUUID\(\)/)
  assert.match(addHandler, /addProjectView\(\{[\s\S]*id: viewId/)
  assert.match(addHandler, /workViewId: viewId/)
  assert.match(workspace, /workViewQuery: ProjectQueryValue/)
  assert.match(route, /workView\?: ProjectQueryValue/)
  assert.match(route, /workViewQuery=\{query\.workView\}/)
})
