import type { ReactNode } from "react"
import Link from "next/link"
import { CheckCircle2, Circle } from "lucide-react"

import type { WorkspaceMember } from "@/features/member/model"
import type { BoardLabel } from "@/features/project/board"
import type { WorkItem, WorkItemStatus } from "../model"
import type { WorkItemStagesByBoardId } from "../dependencies"
import type { WorkItemDocumentOption } from "./work-item-documents-field"
import {
  WorkItemAssignee,
  WorkItemLabelList,
  WorkItemPriorityBadge,
  WorkItemStatusBadge,
  WorkItemTypeBadge,
  formatWorkItemDate,
  getWorkItemChecklistProgress,
} from "./work-item-meta"

interface WorkItemDetailsProps {
  workItem: WorkItem
  boardTitle: string
  boardStage: WorkItemStatus
  boardLabels: readonly BoardLabel[]
  projectWorkItems: readonly WorkItem[]
  stagesByBoardId: WorkItemStagesByBoardId
  workspaceMembers: readonly WorkspaceMember[]
  documents: readonly WorkItemDocumentOption[]
}

export function WorkItemDetails({
  workItem,
  boardTitle,
  boardStage,
  boardLabels,
  projectWorkItems,
  stagesByBoardId,
  workspaceMembers,
  documents,
}: WorkItemDetailsProps) {
  const assignee = workItem.assigneeId
    ? (workspaceMembers.find(
        (member) => member.id === workItem.assigneeId
      ) ?? null)
    : null
  const labels = workItem.labelIds.flatMap((labelId) => {
    const label = boardLabels.find((candidate) => candidate.id === labelId)
    return label ? [label] : []
  })
  const workItemsById = Object.fromEntries(
    projectWorkItems.map((candidate) => [candidate.id, candidate])
  )
  const dependencies = workItem.dependencyIds.flatMap((dependencyId) => {
    const dependency = workItemsById[dependencyId]
    return dependency ? [dependency] : []
  })
  const linkedIds = new Set(workItem.linkedResourceIds)
  const linkedDocuments = documents.filter((document) =>
    linkedIds.has(document.id)
  )
  const checklistProgress = getWorkItemChecklistProgress(
    workItem.checklist
  )

  return (
    <div className="space-y-6">
      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Detail label="Board">{boardTitle}</Detail>
        <Detail label="Status">
          <WorkItemStatusBadge status={boardStage} />
        </Detail>
        <Detail label="Type">
          <WorkItemTypeBadge type={workItem.type} />
        </Detail>
        <Detail label="Priority">
          <WorkItemPriorityBadge priority={workItem.priority} />
        </Detail>
        <Detail label="Assignee">
          <WorkItemAssignee assignee={assignee} showName />
        </Detail>
        <Detail label="Estimate">
          {workItem.estimate === null
            ? "Not estimated"
            : `${workItem.estimate} ${
                workItem.estimate === 1 ? "point" : "points"
              }`}
        </Detail>
        <Detail label="Start date">
          {workItem.startDate
            ? formatWorkItemDate(workItem.startDate)
            : "Not set"}
        </Detail>
        <Detail label="Due date">
          {workItem.dueDate
            ? formatWorkItemDate(workItem.dueDate)
            : "Not set"}
        </Detail>
      </dl>

      <DetailSection title="Description">
        <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
          {workItem.description || "No description."}
        </p>
      </DetailSection>

      <DetailSection title="Labels">
        {labels.length > 0 ? (
          <WorkItemLabelList labels={labels} />
        ) : (
          <EmptyValue>No labels.</EmptyValue>
        )}
      </DetailSection>

      <DetailSection title="Dependencies">
        {dependencies.length > 0 ? (
          <ul className="space-y-2">
            {dependencies.map((dependency) => (
              <li
                key={dependency.id}
                className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm"
              >
                <span className="min-w-0 flex-1 truncate">
                  {dependency.title}
                </span>
                <WorkItemStatusBadge
                  status={stagesByBoardId[dependency.boardId]}
                />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyValue>No dependencies.</EmptyValue>
        )}
      </DetailSection>

      <DetailSection
        title={`Checklist (${checklistProgress.completed}/${checklistProgress.total})`}
      >
        {workItem.checklist.length > 0 ? (
          <ul className="space-y-2">
            {workItem.checklist.map((item) => (
              <li
                key={item.id}
                className="flex items-start gap-2 text-sm text-muted-foreground"
              >
                {item.completed ? (
                  <CheckCircle2
                    className="mt-0.5 size-4 shrink-0 text-emerald-600"
                    aria-hidden="true"
                  />
                ) : (
                  <Circle
                    className="mt-0.5 size-4 shrink-0"
                    aria-hidden="true"
                  />
                )}
                <span>{item.label}</span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyValue>No checklist items.</EmptyValue>
        )}
      </DetailSection>

      <DetailSection title="Linked documents">
        {linkedDocuments.length > 0 ? (
          <ul className="space-y-2">
            {linkedDocuments.map((document) => (
              <li key={document.id}>
                <Link
                  href={document.href}
                  className="block rounded-md border px-3 py-2 text-sm font-medium outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {document.title}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyValue>No linked documents.</EmptyValue>
        )}
      </DetailSection>
    </div>
  )
}

function Detail({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="space-y-1.5 rounded-lg bg-muted/45 p-3">
      <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="text-sm">{children}</dd>
    </div>
  )
}

function DetailSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold">{title}</h3>
      {children}
    </section>
  )
}

function EmptyValue({ children }: { children: ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>
}
