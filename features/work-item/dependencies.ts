import {
  wouldCreateDependencyCycle,
  type WorkItem,
  type WorkItemStatus,
} from "./model.ts"

export type WorkItemStagesByBoardId = Readonly<
  Record<string, WorkItemStatus>
>

export function getBlockingDependencies(
  workItem: WorkItem,
  workItemsById: Readonly<Record<string, WorkItem>>,
  stagesByBoardId: WorkItemStagesByBoardId
) {
  return workItem.dependencyIds.flatMap((dependencyId) => {
    const dependency = workItemsById[dependencyId]

    return dependency?.projectId === workItem.projectId &&
      stagesByBoardId[dependency.boardId] !== "done"
      ? [dependency]
      : []
  })
}

export function getBlockingDependencyCounts(
  workItems: readonly WorkItem[],
  stagesByBoardId: WorkItemStagesByBoardId
) {
  const workItemsById = Object.fromEntries(
    workItems.map((workItem) => [workItem.id, workItem])
  )

  return Object.fromEntries(
    workItems.map((workItem) => [
      workItem.id,
      getBlockingDependencies(
        workItem,
        workItemsById,
        stagesByBoardId
      ).length,
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
