import type { WorkItem } from "../work-item/model"

type DependencyTask = Pick<WorkItem, "id" | "dependencyIds">

export function buildDependencyGraph(tasks: readonly DependencyTask[]) {
  const ids = new Set(tasks.map(task => task.id))
  const predecessors = new Map(tasks.map(task => [task.id, task.dependencyIds.filter(id => ids.has(id))]))
  const successors = new Map(tasks.map(task => [task.id, [] as string[]]))

  for (const task of tasks) {
    for (const id of predecessors.get(task.id) ?? []) successors.get(id)?.push(task.id)
  }

  // Valid project state has no cycles. Bound the passes so corrupt imported data still renders.
  const levels = new Map<string, number>()
  let pending = tasks.map(task => task.id)
  for (let pass = 0; pass < tasks.length && pending.length; pass++) {
    const next: string[] = []
    for (const id of pending) {
      const dependencies = predecessors.get(id) ?? []
      if (dependencies.every(dependency => levels.has(dependency))) {
        levels.set(id, dependencies.reduce((depth, dependency) =>
          Math.max(depth, (levels.get(dependency) ?? 0) + 1), 0))
      } else next.push(id)
    }
    if (next.length === pending.length) break
    pending = next
  }
  for (const id of pending) levels.set(id, 0)

  return { predecessors, successors, levels }
}

export function traceDependencyPath(start: string, adjacent: ReadonlyMap<string, readonly string[]>) {
  const visited = new Set<string>()
  const pending = [...(adjacent.get(start) ?? [])]
  while (pending.length) {
    const id = pending.pop()!
    if (id === start || visited.has(id)) continue
    visited.add(id)
    pending.push(...(adjacent.get(id) ?? []))
  }
  return visited
}
