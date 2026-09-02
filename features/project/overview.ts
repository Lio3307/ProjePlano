import {
  isValidWorkItemDate,
  type WorkItem,
  type WorkItemStatus,
} from "../work-item/model.ts"
import type { Milestone, ProjectResource } from "./model"

const ACTIVE_WORK_ITEM_STATUSES: readonly WorkItemStatus[] = [
  "todo",
  "in-progress",
  "review",
  "testing",
]

type ProjectOverviewInput = {
  today: string
  workItems: readonly WorkItem[]
  milestones: readonly Milestone[]
  resources: readonly ProjectResource[]
}

export type ProjectOverviewSummary = {
  totalWorkItems: number
  completedWorkItems: number
  progressPercentage: number
  activeWorkItems: number
  overdueWorkItems: number
  nextMilestone: Milestone | null
  pinnedDocuments: ProjectResource[]
}

export function buildProjectOverviewSummary({
  today,
  workItems,
  milestones,
  resources,
}: ProjectOverviewInput): ProjectOverviewSummary {
  const totalWorkItems = workItems.length
  const completedWorkItems = workItems.filter(
    (workItem) => workItem.status === "done"
  ).length
  const activeWorkItems = workItems.filter((workItem) =>
    ACTIVE_WORK_ITEM_STATUSES.includes(workItem.status)
  ).length
  const overdueWorkItems = isValidWorkItemDate(today)
    ? workItems.filter(
        (workItem) =>
          workItem.status !== "done" &&
          workItem.dueDate !== null &&
          isValidWorkItemDate(workItem.dueDate) &&
          workItem.dueDate < today
      ).length
    : 0
  const nextMilestone =
    milestones
      .filter(hasOutstandingTargetDate)
      .toSorted((left, right) =>
        left.targetDate.localeCompare(right.targetDate)
      )[0] ?? null

  return {
    totalWorkItems,
    completedWorkItems,
    progressPercentage:
      totalWorkItems === 0
        ? 0
        : Math.round((completedWorkItems / totalWorkItems) * 100),
    activeWorkItems,
    overdueWorkItems,
    nextMilestone,
    pinnedDocuments: resources.filter(
      (resource) =>
        resource.type === "document" && resource.isPinned
    ),
  }
}

function hasOutstandingTargetDate(
  milestone: Milestone
): milestone is Milestone & { targetDate: string } {
  return (
    milestone.status !== "completed" &&
    milestone.targetDate !== null
  )
}

export function getLocalDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return year + "-" + month + "-" + day
}
