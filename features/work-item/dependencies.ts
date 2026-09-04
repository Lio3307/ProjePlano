import {
  wouldCreateDependencyCycle,
  type WorkItem,
} from "./model.ts"

export function getBlockingDependencies(
  workItem: WorkItem,
  workItemsById: Readonly<Record<string, WorkItem>>
) {
  return workItem.dependencyIds.flatMap((dependencyId) => {
    const dependency = workItemsById[dependencyId]

    return dependency?.projectId === workItem.projectId &&
      dependency.status !== "done"
      ? [dependency]
      : []
  })
}

export function getBlockingDependencyCounts(
  workItems: readonly WorkItem[]
) {
  const workItemsById = Object.fromEntries(
    workItems.map((workItem) => [workItem.id, workItem])
  )

  return Object.fromEntries(
    workItems.map((workItem) => [
      workItem.id,
      getBlockingDependencies(workItem, workItemsById).length,
    ])
  )
}

export function wouldAcceptDependencySelection(
  workItemsById: Readonly<Record<string, WorkItem>>,
  workItemId: string | null,
  projectId: string,
  dependencyIds: readonly string[]
) {
  if (new Set(dependencyIds).size !== dependencyIds.length) {
    return false
  }

  if (
    workItemId !== null &&
    dependencyIds.includes(workItemId)
  ) {
    return false
  }

  const referencesAreValid = dependencyIds.every(
    (dependencyId) =>
      workItemsById[dependencyId]?.projectId === projectId
  )

  if (!referencesAreValid || workItemId === null) {
    return referencesAreValid
  }

  return !wouldCreateDependencyCycle(
    workItemsById,
    workItemId,
    dependencyIds
  )
}
