"use client"

import { useRef, useState } from "react"
import { DragDropProvider } from "@dnd-kit/react"

import {
  getCalendarMonthFromIsoDate,
  getCalendarMonthLabel,
  getLocalTodayIsoDate,
  shiftCalendarMonth,
} from "../date-utils"
import {
  findCalendarTask,
  moveCalendarTask,
  parseCalendarDateDropId,
  parseCalendarTaskDragId,
} from "../model"
import {
  INITIAL_CALENDAR_MONTH,
  INITIAL_CALENDAR_TASKS,
} from "../mock-data"
import { CalendarGrid } from "./calendar-grid"
import { CalendarTaskDialog } from "./calendar-task-dialog"
import { CalendarToolbar } from "./calendar-toolbar"

export function CalendarView() {
  const [activeMonth, setActiveMonth] = useState(() => ({
    ...INITIAL_CALENDAR_MONTH,
  }))
  const [tasks, setTasks] = useState(() => INITIAL_CALENDAR_TASKS)
  const [todayIsoDate] = useState(() => getLocalTodayIsoDate())
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const selectedTaskTriggerRef = useRef<HTMLButtonElement | null>(null)
  const selectedTask = selectedTaskId
    ? findCalendarTask(tasks, selectedTaskId)
    : null

  function handlePreviousMonth() {
    setActiveMonth((currentMonth) =>
      shiftCalendarMonth(currentMonth, -1)
    )
  }

  function handleNextMonth() {
    setActiveMonth((currentMonth) => shiftCalendarMonth(currentMonth, 1))
  }

  function handleToday() {
    const currentMonth = getCalendarMonthFromIsoDate(todayIsoDate)

    if (currentMonth) {
      setActiveMonth(currentMonth)
    }
  }

  function handleOpenTask(taskId: string, trigger: HTMLButtonElement) {
    selectedTaskTriggerRef.current = trigger
    setSelectedTaskId(taskId)
  }

  function handleDialogOpenChange(open: boolean) {
    if (!open) {
      setSelectedTaskId(null)
    }
  }

  function handleDragEnd(
    canceled: boolean,
    sourceId: string | number | undefined,
    targetId: string | number | undefined
  ) {
    if (canceled || sourceId == null || targetId == null) {
      return
    }

    const taskId = parseCalendarTaskDragId(sourceId)
    const dueDate = parseCalendarDateDropId(targetId)

    if (!taskId || !dueDate) {
      return
    }

    setTasks((currentTasks) =>
      moveCalendarTask(currentTasks, taskId, dueDate)
    )
  }

  return (
    <div className="min-w-0 space-y-4">
      <CalendarToolbar
        monthLabel={getCalendarMonthLabel(activeMonth)}
        onNext={handleNextMonth}
        onPrevious={handlePreviousMonth}
        onToday={handleToday}
      />

      <DragDropProvider
        onDragEnd={(event) =>
          handleDragEnd(
            event.canceled,
            event.operation.source?.id,
            event.operation.target?.id
          )
        }
      >
        <CalendarGrid
          activeMonth={activeMonth}
          tasks={tasks}
          todayIsoDate={todayIsoDate}
          onOpenTask={handleOpenTask}
        />
      </DragDropProvider>

      <CalendarTaskDialog
        task={selectedTask}
        finalFocus={selectedTaskTriggerRef}
        open={selectedTask !== null}
        onOpenChange={handleDialogOpenChange}
      />
    </div>
  )
}
