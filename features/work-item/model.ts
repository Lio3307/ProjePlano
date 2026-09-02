export const WORK_ITEM_TYPES = ["feature", "bug", "chore", "spike"] as const

export const WORK_ITEM_STATUSES = [
  "backlog",
  "todo",
  "in-progress",
  "review",
  "testing",
  "done",
] as const

export const WORK_ITEM_PRIORITIES = [
  "low",
  "medium",
  "high",
  "urgent",
] as const

export type WorkItemType = (typeof WORK_ITEM_TYPES)[number]
export type WorkItemStatus = (typeof WORK_ITEM_STATUSES)[number]
export type WorkItemPriority = (typeof WORK_ITEM_PRIORITIES)[number]

export type Assignee = {
  name: string
  initials: string
}

export type ChecklistItem = {
  id: string
  label: string
  completed: boolean
}

export type WorkItemAttachment = {
  id: string
  name: string
  type: string
  url: string
  kind: "file" | "link"
}

export type FieldValue =
  | string
  | number
  | boolean
  | null
  | string[]
  | WorkItemAttachment[]

export type WorkItem = {
  id: string
  projectId: string
  title: string
  description: string
  type: WorkItemType
  status: WorkItemStatus
  priority: WorkItemPriority
  assignee: Assignee | null
  startDate: string | null
  dueDate: string | null
  estimate: number | null
  position: number
  labels: string[]
  checklist: ChecklistItem[]
  milestoneId: string | null
  dependencyIds: string[]
  linkedResourceIds: string[]
  customFields: Record<string, FieldValue>
}

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

export function isWorkItemStatus(value: string): value is WorkItemStatus {
  return WORK_ITEM_STATUSES.some((status) => status === value)
}

export function isValidWorkItemDate(value: string) {
  const match = ISO_DATE_PATTERN.exec(value)

  if (!match) {
    return false
  }

  const year = Number(match[1])
  const month = Number(match[2]) - 1
  const day = Number(match[3])

  if (year < 1000 || month < 0 || month > 11 || day < 1) {
    return false
  }

  const date = new Date(Date.UTC(year, month, day))

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month &&
    date.getUTCDate() === day
  )
}

export function isValidWorkItemDateRange(
  startDate: string | null,
  dueDate: string | null
) {
  if (startDate !== null && !isValidWorkItemDate(startDate)) {
    return false
  }

  if (dueDate !== null && !isValidWorkItemDate(dueDate)) {
    return false
  }

  return startDate === null || dueDate === null || startDate <= dueDate
}

export function isValidWorkItem(item: WorkItem) {
  const typeIsValid = WORK_ITEM_TYPES.some((type) => type === item.type)
  const statusIsValid = WORK_ITEM_STATUSES.some(
    (status) => status === item.status
  )
  const priorityIsValid = WORK_ITEM_PRIORITIES.some(
    (priority) => priority === item.priority
  )
  const assigneeIsValid =
    item.assignee === null ||
    (item.assignee.name.trim().length > 0 &&
      item.assignee.initials.trim().length > 0)
  const estimateIsValid =
    item.estimate === null ||
    (Number.isFinite(item.estimate) && item.estimate >= 0)

  return (
    item.id.trim().length > 0 &&
    item.projectId.trim().length > 0 &&
    item.title.trim().length > 0 &&
    typeIsValid &&
    statusIsValid &&
    priorityIsValid &&
    assigneeIsValid &&
    estimateIsValid &&
    Number.isInteger(item.position) &&
    item.position >= 0 &&
    Array.isArray(item.labels) &&
    Array.isArray(item.checklist) &&
    Array.isArray(item.dependencyIds) &&
    Array.isArray(item.linkedResourceIds) &&
    item.customFields !== null &&
    typeof item.customFields === "object" &&
    isValidWorkItemDateRange(item.startDate, item.dueDate)
  )
}

export function wouldCreateDependencyCycle(
  workItemsById: Readonly<Record<string, WorkItem>>,
  itemId: string,
  dependencyIds: readonly string[]
) {
  const visiting = new Set<string>()
  const visited = new Set<string>()

  function visit(currentId: string): boolean {
    if (visiting.has(currentId)) {
      return true
    }

    if (visited.has(currentId)) {
      return false
    }

    visiting.add(currentId)

    const currentDependencies =
      currentId === itemId
        ? dependencyIds
        : (workItemsById[currentId]?.dependencyIds ?? [])

    for (const dependencyId of currentDependencies) {
      if (visit(dependencyId)) {
        return true
      }
    }

    visiting.delete(currentId)
    visited.add(currentId)
    return false
  }

  return visit(itemId)
}
