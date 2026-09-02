import type { Column, Row, StatusOption } from "./model"

export const DEFAULT_STATUS_OPTIONS: StatusOption[] = [
  { id: "todo", label: "Todo", color: "gray" },
  { id: "in-progress", label: "In progress", color: "blue" },
  { id: "done", label: "Done", color: "green" },
]

export const INITIAL_COLUMNS: Column[] = [
  { id: "name", title: "Name", type: "text" },
  {
    id: "status",
    title: "Status",
    type: "status",
    options: DEFAULT_STATUS_OPTIONS.map((option) => ({ ...option })),
  },
  {
    id: "priority",
    title: "Priority",
    type: "status",
    options: [
      { id: "high", label: "High", color: "red" },
      { id: "medium", label: "Medium", color: "yellow" },
      { id: "low", label: "Low", color: "gray" },
    ],
  },
  { id: "due", title: "Due date", type: "date" },
  { id: "attachments", title: "Attachments", type: "file" },
]

export const INITIAL_ROWS: Row[] = [
  {
    id: "r1",
    cells: {
      name: "Design review",
      status: "in-progress",
      priority: "high",
      due: "2026-08-10",
      attachments: [],
    },
  },
  {
    id: "r2",
    cells: {
      name: "API migration",
      status: "todo",
      priority: "medium",
      due: "2026-08-18",
      attachments: [],
    },
  },
  {
    id: "r3",
    cells: {
      name: "Write tests",
      status: "done",
      priority: "low",
      due: "2026-08-01",
      attachments: [],
    },
  },
]
