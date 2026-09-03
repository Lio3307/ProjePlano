"use client"

import { useState } from "react"
import { DragDropProvider } from "@dnd-kit/react"

import type { WorkItem } from "@/features/work-item/model"
import {
  getCalendarMonthFromIsoDate,
  getCalendarMonthLabel,
  shiftCalendarMonth,
} from "../date-utils"
import {
  parseCalendarDateDropId,
  parseCalendarTaskDragId,
  partitionCalendarWorkItems,
} from "../model"
import { CalendarGrid } from "./calendar-grid"
import { CalendarToolbar } from "./calendar-toolbar"
import { CalendarUnscheduled } from "./calendar-unscheduled"

interface CalendarViewProps {
  workItems: readonly WorkItem[]
  todayIsoDate: string
  onOpenWorkItem: (workItemId: string, trigger: HTMLElement) => void
  onMoveWorkItemDate: (workItemId: string, dueDate: string) => void
}

export function CalendarView({
  workItems,
  todayIsoDate,
  onOpenWorkItem,
  onMoveWorkItemDate,
}: CalendarViewProps) {
  const [activeMonth, setActiveMonth] = useState(
    () =>
      getCalendarMonthFromIsoDate(todayIsoDate) ?? {
        year: 1970,
        month: 0,
      }
  )
  const { scheduled, unscheduled } =
    partitionCalendarWorkItems(workItems)

  return (
    <div className="min-w-0 space-y-4">
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
        onOpenWorkItem={onOpenWorkItem}
      />

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
          todayIsoDate={todayIsoDate}
          onOpenWorkItem={onOpenWorkItem}
        />
      </DragDropProvider>
    </div>
  )
}
