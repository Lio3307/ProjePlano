import {
  ALargeSmall,
  Calendar,
  CircleDot,
  Hash,
  Link2,
  Paperclip,
  type LucideIcon,
} from "lucide-react"

export type ColumnType = "text" | "number" | "url" | "date" | "status" | "file"

export type StatusColor =
  | "gray"
  | "orange"
  | "yellow"
  | "green"
  | "blue"
  | "purple"
  | "pink"
  | "red"

export type StatusOption = { id: string; label: string; color: StatusColor }

export type Column =
  | { id: string; title: string; type: "status"; options: StatusOption[] }
  | { id: string; title: string; type: Exclude<ColumnType, "status"> }

export type StatusColumn = Extract<Column, { type: "status" }>

export type FileAttachment = {
  id: string
  name: string
  type: string
  url: string
  kind: "file" | "link"
}

export type CellValue = string | FileAttachment[]

export type Row = { id: string; cells: Record<string, CellValue> }

export type StatusOptionActions = {
  add: (columnId: string, label: string) => StatusOption
  setColor: (columnId: string, optionId: string, color: StatusColor) => void
  remove: (columnId: string, optionId: string) => void
}

export const COLUMN_TYPES: Record<
  ColumnType,
  { label: string; icon: LucideIcon }
> = {
  text: { label: "Text", icon: ALargeSmall },
  number: { label: "Number", icon: Hash },
  url: { label: "URL", icon: Link2 },
  date: { label: "Date", icon: Calendar },
  status: { label: "Status", icon: CircleDot },
  file: { label: "Files & media", icon: Paperclip },
}

export const STATUS_COLORS: Record<
  StatusColor,
  { label: string; badge: string; dot: string }
> = {
  gray: {
    label: "Gray",
    badge: "bg-gray-500/15 text-gray-700 dark:text-gray-300",
    dot: "bg-gray-400",
  },
  orange: {
    label: "Orange",
    badge: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
    dot: "bg-orange-400",
  },
  yellow: {
    label: "Yellow",
    badge: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300",
    dot: "bg-yellow-400",
  },
  green: {
    label: "Green",
    badge: "bg-green-500/15 text-green-700 dark:text-green-300",
    dot: "bg-green-500",
  },
  blue: {
    label: "Blue",
    badge: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
    dot: "bg-blue-500",
  },
  purple: {
    label: "Purple",
    badge: "bg-purple-500/15 text-purple-700 dark:text-purple-300",
    dot: "bg-purple-500",
  },
  pink: {
    label: "Pink",
    badge: "bg-pink-500/15 text-pink-700 dark:text-pink-300",
    dot: "bg-pink-500",
  },
  red: {
    label: "Red",
    badge: "bg-red-500/15 text-red-700 dark:text-red-300",
    dot: "bg-red-500",
  },
}

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

export const newId = () => crypto.randomUUID()

export const emptyCell = (type: ColumnType): CellValue =>
  type === "file" ? [] : ""

export const coerceCell = (
  column: Column,
  value: CellValue,
  type: ColumnType
): CellValue => {
  if (column.type === "status" && type !== "status") {
    return column.options.find((option) => option.id === value)?.label ?? ""
  }
  if (type === "file") return Array.isArray(value) ? value : []
  return typeof value === "string" ? value : ""
}

export const revokeAttachment = (attachment: FileAttachment) => {
  if (attachment.url.startsWith("blob:")) URL.revokeObjectURL(attachment.url)
}

export const revokeAttachments = (value: CellValue | undefined) => {
  if (Array.isArray(value)) value.forEach(revokeAttachment)
}

export const parseLink = (raw: string) => {
  const trimmed = raw.trim()
  if (!trimmed) return null
  try {
    const url = new URL(
      trimmed.includes("://") ? trimmed : `https://${trimmed}`
    )
    return { url: url.href, name: url.hostname }
  } catch {
    return null
  }
}
