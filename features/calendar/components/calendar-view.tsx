"use client"

import { useState } from "react"
import { DragDropProvider } from "@dnd-kit/react"

import type { BoardLabel } from "@/features/project/board"
import type { WorkItem } from "@/features/work-item/model"
import {
  getBlockingDependencyCounts,
  type WorkItemStagesByBoardId,
} from "@/features/work-item/dependencies"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  getCalendarMonthFromIsoDate,
  getCalendarMonthLabel,
  shiftCalendarMonth,
} from "../date-utils"
import {
  groupCalendarWorkItemsByMonth,
  parseCalendarDateDropId,
  parseCalendarTaskDragId,
  partitionCalendarWorkItems,
} from "../model"
import { CalendarAgenda } from "./calendar-agenda"
import { CalendarGrid } from "./calendar-grid"
import { CalendarToolbar } from "./calendar-toolbar"
import { CalendarUnscheduled } from "./calendar-unscheduled"

interface CalendarViewProps {
  workItems: readonly WorkItem[]
  visibleWorkItemIds: ReadonlySet<string>
  labels: readonly BoardLabel[]
  stagesByBoardId: WorkItemStagesByBoardId
  todayIsoDate: string
  onOpenWorkItem: (workItemId: string, trigger: HTMLElement) => void
  onMoveWorkItemDate: (workItemId: string, dueDate: string) => void
}

export function CalendarView({
  workItems,
  visibleWorkItemIds,
  labels,
  stagesByBoardId,
  todayIsoDate,
  onOpenWorkItem,
  onMoveWorkItemDate,
}: CalendarViewProps) {
  const isMobile = useIsMobile()
  const [activeMonth, setActiveMonth] = useState(
    () =>
      getCalendarMonthFromIsoDate(todayIsoDate) ?? {
        year: 1970,
        month: 0,
      }
  )
  const visibleWorkItems = workItems.filter(
    (workItem) => visibleWorkItemIds.has(workItem.id)
  )
  const { scheduled, unscheduled } =
    partitionCalendarWorkItems(visibleWorkItems)
  const agendaGroups = groupCalendarWorkItemsByMonth(
    scheduled,
    activeMonth
  )
  const blockingCountsByWorkItemId =
    getBlockingDependencyCounts(workItems, stagesByBoardId)

  return (
    <div
      data-calendar-work-item-count={visibleWorkItems.length}
      className="min-w-0 space-y-4"
    >
      <CalendarToolbar
        monthLabel={getCalendarMonthLabel(activeMonth)}
        onPrevious={() =>
          setActiveMonth((month) => shiftCalendarMonth(month, -1))
        }
        onNext={() =>
          setActiveMonth((month) => shiftCalendarMonth(month, 1))
        }
        onToday={() => {
          const month = getCalendarMonthFromIsoDate(todayIsoDate)

          if (month) {
            setActiveMonth(month)
          }
        }}
      />

      <CalendarUnscheduled
        workItems={unscheduled}
        labels={labels}
        stagesByBoardId={stagesByBoardId}
        blockingCountsByWorkItemId={blockingCountsByWorkItemId}
        onOpenWorkItem={onOpenWorkItem}
      />

      {isMobile ? (
        <CalendarAgenda
          groups={agendaGroups}
          labels={labels}
          stagesByBoardId={stagesByBoardId}
          blockingCountsByWorkItemId={blockingCountsByWorkItemId}
          onOpenWorkItem={onOpenWorkItem}
        />
      ) : (
        <DragDropProvider
          onDragEnd={(event) => {
            if (event.canceled) {
              return
            }

            const sourceId = event.operation.source?.id
            const targetId = event.operation.target?.id

            if (sourceId == null || targetId == null) {
              return
            }

            const workItemId = parseCalendarTaskDragId(sourceId)
            const dueDate = parseCalendarDateDropId(targetId)
            const current = scheduled.find(
              (workItem) => workItem.id === workItemId
            )

            if (
              workItemId &&
              dueDate &&
              current?.dueDate !== dueDate
            ) {
              onMoveWorkItemDate(workItemId, dueDate)
            }
          }}
        >
          <CalendarGrid
            activeMonth={activeMonth}
            tasks={scheduled}
            labels={labels}
            stagesByBoardId={stagesByBoardId}
            blockingCountsByWorkItemId={blockingCountsByWorkItemId}
            todayIsoDate={todayIsoDate}
            onOpenWorkItem={onOpenWorkItem}
          />
        </DragDropProvider>
      )}
    </div>
  )
}
