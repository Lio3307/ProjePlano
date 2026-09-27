import { isRecord, isString } from "../../lib/json-validation.ts"
import { WORKSPACES } from "../workspace/mock-data.ts"
import { normalizeBoardLabels } from "./board.ts"
import { isProjectSnapshot } from "./backup-schema.ts"
import type { ProjectWorkspaceState } from "./model"

export const MAX_BACKUP_BYTES = 20 * 1024 * 1024
export type BackupResult =
  | { ok: true; data: ProjectWorkspaceState; exportedAt: string }
  | { ok: false; error: string }

export function serializeBackup(data: ProjectWorkspaceState) {
  return JSON.stringify({
    app: "projeplano", schemaVersion: 1, exportedAt: new Date().toISOString(),
    workspaces: WORKSPACES, data,
  })
}

export function parseBackup(text: string): BackupResult {
  if (text.length > MAX_BACKUP_BYTES || new TextEncoder().encode(text).length > MAX_BACKUP_BYTES) {
    return { ok: false, error: "Backup exceeds the 20 MB limit." }
  }
  let value: unknown
  try {
    value = JSON.parse(text, (key, item) => {
      if (["__proto__", "prototype", "constructor"].includes(key)) {
        throw new Error("Unsupported property")
      }
      return item
    })
  } catch {
    return { ok: false, error: "The file is not valid backup JSON." }
  }
  if (!isRecord(value) || value.app !== "projeplano" || value.schemaVersion !== 1) {
    return { ok: false, error: "This ProjePlano backup format or version is not supported." }
  }
  if (!isString(value.exportedAt) || !Number.isFinite(Date.parse(value.exportedAt)) ||
    JSON.stringify(value.workspaces) !== JSON.stringify(WORKSPACES)) {
    return { ok: false, error: "Backup metadata or workspace definitions do not match this app version." }
  }
  if (!isProjectSnapshot(value.data)) {
    return { ok: false, error: "The backup contains invalid records or Table data." }
  }
  if (!hasValidRelationships(value.data)) {
    return { ok: false, error: "The backup contains missing, duplicate, or conflicting record relationships." }
  }
  return { ok: true, data: value.data, exportedAt: value.exportedAt }
}

function hasValidRelationships(state: ProjectWorkspaceState) {
  const { projectsById: projects, projectViewsById: views, taskBoardsById: boards,
    workItemsById: tasks, resourcesById: resources, milestonesById: milestones } = state
  for (const records of [projects, views, boards, tasks, resources, milestones]) {
    if (Object.entries(records).some(([id, record]) => id !== record.id)) return false
  }
  const workspaceIds = new Set(WORKSPACES.map(workspace => workspace.id))
  const indexedProjects = new Set<string>()
  for (const [workspaceId, ids] of Object.entries(state.projectIdsByWorkspaceId)) {
    if (!workspaceIds.has(workspaceId)) return false
    for (const id of ids) {
      if (indexedProjects.has(id) || projects[id]?.workspaceId !== workspaceId) return false
      indexedProjects.add(id)
    }
  }
  if (indexedProjects.size !== Object.keys(projects).length) return false
  for (const project of Object.values(projects)) {
    if (!workspaceIds.has(project.workspaceId) ||
      !project.viewIds.every(id => views[id]?.projectId === project.id) ||
      !project.resourceIds.every(id => resources[id]?.projectId === project.id) ||
      !project.milestoneIds.every(id => milestones[id]?.projectId === project.id) ||
      project.viewIds.filter(id => views[id].type === "board").length > 1) return false
  }
  for (const view of Object.values(views)) {
    if (!projects[view.projectId]?.viewIds.includes(view.id)) return false
    if (view.type === "board") {
      if (!normalizeBoardLabels(view.labels)) return false
      const names = new Set<string>()
      for (const [position, id] of view.boardIds.entries()) {
        const board = boards[id]
        if (!board || board.projectId !== view.projectId || board.viewId !== view.id ||
          board.position !== position || names.has(board.title.trim().toLowerCase())) return false
        names.add(board.title.trim().toLowerCase())
      }
    }
    if (view.type === "table" && !Object.hasOwn(state.tablesByViewId, view.id)) return false
  }
  for (const id of Object.keys(state.tablesByViewId)) {
    if (views[id]?.type !== "table") return false
  }
  for (const board of Object.values(boards)) {
    const view = views[board.viewId]
    if (view?.type !== "board" || view.projectId !== board.projectId ||
      !view.boardIds.includes(board.id)) return false
  }
  for (const resource of Object.values(resources)) {
    if (!projects[resource.projectId]?.resourceIds.includes(resource.id)) return false
  }
  for (const milestone of Object.values(milestones)) {
    if (!projects[milestone.projectId]?.milestoneIds.includes(milestone.id)) return false
  }
  const positions = new Map<string, Set<number>>()
  for (const task of Object.values(tasks)) {
    const board = boards[task.boardId]
    const view = board ? views[board.viewId] : undefined
    if (!board || board.projectId !== task.projectId || view?.type !== "board" ||
      !task.labelIds.every(id => view.labels.some(label => label.id === id)) ||
      (task.milestoneId !== null && milestones[task.milestoneId]?.projectId !== task.projectId) ||
      !task.linkedResourceIds.every(id => resources[id]?.projectId === task.projectId && resources[id].type === "document") ||
      !task.dependencyIds.every(id => id !== task.id && tasks[id]?.projectId === task.projectId)) return false
    const used = positions.get(board.id) ?? new Set<number>()
    if (used.has(task.position)) return false
    used.add(task.position)
    positions.set(board.id, used)
  }
  for (const used of positions.values()) {
    if (Math.max(...used) !== used.size - 1) return false
  }
  // Kahn's algorithm avoids recursion limits for long imported dependency chains.
  const remaining = new Map(Object.values(tasks).map(task => [task.id, task.dependencyIds.length]))
  const dependents = new Map<string, string[]>()
  for (const task of Object.values(tasks)) {
    for (const id of task.dependencyIds) {
      const items = dependents.get(id) ?? []
      items.push(task.id)
      dependents.set(id, items)
    }
  }
  const ready = [...remaining].filter(([, count]) => count === 0).map(([id]) => id)
  for (let i = 0; i < ready.length; i++) {
    for (const id of dependents.get(ready[i]) ?? []) {
      const count = (remaining.get(id) ?? 0) - 1
      remaining.set(id, count)
      if (count === 0) ready.push(id)
    }
  }
  return ready.length === remaining.size
}
