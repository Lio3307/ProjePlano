"use client"

import { useRef, useState, type ComponentProps, type ReactNode } from "react"
import {
  ALargeSmall,
  Calendar,
  CircleDot,
  EllipsisVertical,
  File,
  Hash,
  Link2,
  Paperclip,
  Plus,
  X,
  type LucideIcon,
} from "lucide-react"
import { Popover } from "@base-ui/react/popover"

import { cn } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"

// --- Model -------------------------------------------------------------------

type ColumnType = "text" | "number" | "url" | "date" | "status" | "file"

type StatusColor =
  | "gray"
  | "orange"
  | "yellow"
  | "green"
  | "blue"
  | "purple"
  | "pink"
  | "red"

type StatusOption = { id: string; label: string; color: StatusColor }

type Column =
  | { id: string; title: string; type: "status"; options: StatusOption[] }
  | { id: string; title: string; type: Exclude<ColumnType, "status"> }

/** Column narrowed to the status variant (carries an options list). */
type StatusColumn = Extract<Column, { type: "status" }>

type FileAttachment = { id: string; name: string; type: string; url: string }

type CellValue = string | FileAttachment[]

type Row = { id: string; cells: Record<string, CellValue> }

/** Actions the status cell editor can perform on a column's option list. */
type StatusOptionActions = {
  add: (columnId: string, label: string) => StatusOption
  setColor: (columnId: string, optionId: string, color: StatusColor) => void
  remove: (columnId: string, optionId: string) => void
}

/** Property-type registry: drives the header icons and the "Type" submenu. */
const COLUMN_TYPES: Record<ColumnType, { label: string; icon: LucideIcon }> = {
  text: { label: "Text", icon: ALargeSmall },
  number: { label: "Number", icon: Hash },
  url: { label: "URL", icon: Link2 },
  date: { label: "Date", icon: Calendar },
  status: { label: "Status", icon: CircleDot },
  file: { label: "Files & media", icon: Paperclip },
}

/** Badge/dot classes per status color (static strings so Tailwind sees them). */
const STATUS_COLORS: Record<
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

/** Notion-like defaults, used when a column is converted to a status column. */
const DEFAULT_STATUS_OPTIONS: StatusOption[] = [
  { id: "todo", label: "Todo", color: "gray" },
  { id: "in-progress", label: "In progress", color: "blue" },
  { id: "done", label: "Done", color: "green" },
]

const newId = () => crypto.randomUUID()

/** Fresh empty value for a column type (arrays must never be shared). */
const emptyCellFor = (type: ColumnType): CellValue => (type === "file" ? [] : "")

/**
 * Best-effort conversion when a column changes type; incompatible data resets.
 * Status values are stored as option ids, so they are mapped to their label.
 */
const coerceCell = (
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

/** Release object URLs held by a cell value (no-op for non-file values). */
const revokeAttachments = (value: CellValue | undefined) => {
  if (Array.isArray(value)) {
    value.forEach((attachment) => URL.revokeObjectURL(attachment.url))
  }
}

const INITIAL_COLUMNS: Column[] = [
  { id: "name", title: "Name", type: "text" },
  {
    id: "status",
    title: "Status",
    type: "status",
    options: [
      { id: "todo", label: "Todo", color: "gray" },
      { id: "in-progress", label: "In progress", color: "blue" },
      { id: "done", label: "Done", color: "green" },
    ],
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

const INITIAL_ROWS: Row[] = [
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

// --- Shared styles -----------------------------------------------------------

/** Narrow leading column that holds the row action menu. */
const GUTTER_CELL_CLASS = "w-8"

/** Data columns: generous minimum width with a light Notion-style divider. */
const DATA_CELL_CLASS = "min-w-44 border-l border-border p-0"

const ICON_BUTTON_CLASS =
  "flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"

/** Hidden until the parent `group` (header cell or row) is hovered, focused, or has its menu open. */
const REVEAL_ON_HOVER_CLASS =
  "opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 data-popup-open:opacity-100"

/** Notion-style "Empty" hint, only visible while the cell is hovered or focused. */
const EMPTY_PLACEHOLDER_CLASS =
  "placeholder:text-transparent hover:placeholder:text-muted-foreground/60 focus-visible:placeholder:text-muted-foreground/60"

/** Ghost "Empty" label for non-input cells (e.g. files); the row provides `group`. */
const EMPTY_LABEL_CLASS =
  "text-transparent transition-colors group-hover:text-muted-foreground/60"

/** Hide native number spinners for a cleaner, Notion-like look. */
const NUMBER_INPUT_CLASS =
  "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"

// --- State -------------------------------------------------------------------

function useEditableTable() {
  const [columns, setColumns] = useState<Column[]>(INITIAL_COLUMNS)
  const [rows, setRows] = useState<Row[]>(INITIAL_ROWS)

  const addColumn = () => {
    setColumns((current) => [
      ...current,
      { id: newId(), title: `Column ${current.length + 1}`, type: "text" },
    ])
  }

  const renameColumn = (columnId: string, title: string) => {
    setColumns((current) =>
      current.map((column) =>
        column.id === columnId ? { ...column, title } : column
      )
    )
  }

  const changeColumnType = (columnId: string, type: ColumnType) => {
    const source = columns.find((column) => column.id === columnId)
    if (!source || source.type === type) return
    rows.forEach((row) => revokeAttachments(row.cells[columnId]))
    setColumns((current) =>
      current.map((column): Column => {
        if (column.id !== columnId) return column
        // Rebuild the column so the union stays valid (options only on status).
        return type === "status"
          ? {
              id: column.id,
              title: column.title,
              type,
              options: DEFAULT_STATUS_OPTIONS.map((option) => ({ ...option })),
            }
          : { id: column.id, title: column.title, type }
      })
    )
    setRows((current) =>
      current.map((row) => ({
        ...row,
        cells: {
          ...row.cells,
          [columnId]: coerceCell(source, row.cells[columnId], type),
        },
      }))
    )
  }

  /** Shared updater for a status column's option list. */
  const updateStatusOptions = (
    columnId: string,
    update: (options: StatusOption[]) => StatusOption[]
  ) => {
    setColumns((current) =>
      current.map((column) =>
        column.id === columnId && column.type === "status"
          ? { ...column, options: update(column.options) }
          : column
      )
    )
  }

  const addStatusOption = (columnId: string, label: string): StatusOption => {
    const option: StatusOption = { id: newId(), label, color: "gray" }
    updateStatusOptions(columnId, (options) => [...options, option])
    return option
  }

  const setStatusOptionColor = (
    columnId: string,
    optionId: string,
    color: StatusColor
  ) => {
    updateStatusOptions(columnId, (options) =>
      options.map((option) =>
        option.id === optionId ? { ...option, color } : option
      )
    )
  }

  const deleteStatusOption = (columnId: string, optionId: string) => {
    updateStatusOptions(columnId, (options) =>
      options.filter((option) => option.id !== optionId)
    )
    // Unset any cells that referenced the removed option.
    setRows((current) =>
      current.map((row) =>
        row.cells[columnId] === optionId
          ? { ...row, cells: { ...row.cells, [columnId]: "" } }
          : row
      )
    )
  }

  const deleteColumn = (columnId: string) => {
    rows.forEach((row) => revokeAttachments(row.cells[columnId]))
    setColumns((current) => current.filter((column) => column.id !== columnId))
    setRows((current) =>
      current.map((row) => ({
        ...row,
        cells: Object.fromEntries(
          Object.entries(row.cells).filter(([key]) => key !== columnId)
        ),
      }))
    )
  }

  const addRow = () => {
    setRows((current) => [
      ...current,
      {
        id: newId(),
        cells: Object.fromEntries(
          columns.map((column) => [column.id, emptyCellFor(column.type)])
        ),
      },
    ])
  }

  const deleteRow = (rowId: string) => {
    const target = rows.find((row) => row.id === rowId)
    if (target) Object.values(target.cells).forEach(revokeAttachments)
    setRows((current) => current.filter((row) => row.id !== rowId))
  }

  const updateCell = (rowId: string, columnId: string, value: CellValue) => {
    setRows((current) =>
      current.map((row) =>
        row.id === rowId
          ? { ...row, cells: { ...row.cells, [columnId]: value } }
          : row
      )
    )
  }

  return {
    columns,
    rows,
    addColumn,
    renameColumn,
    changeColumnType,
    deleteColumn,
    addRow,
    deleteRow,
    updateCell,
    statusOptionActions: {
      add: addStatusOption,
      setColor: setStatusOptionColor,
      remove: deleteStatusOption,
    },
  }
}

// --- Building blocks ---------------------------------------------------------

/** Borderless input that fills its cell and shows a subtle outline while editing. */
function EditableInput({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      spellCheck={false}
      className={cn(
        "h-9 w-full rounded-sm bg-transparent px-2 text-sm outline-none",
        "focus-visible:ring-1 focus-visible:ring-ring/70",
        className
      )}
      {...props}
    />
  )
}

type ActionsMenuProps = {
  triggerLabel: string
  deleteLabel: string
  onDelete: () => void
  deleteDisabled?: boolean
  /** Optional menu items rendered above the delete action. */
  children?: ReactNode
}

/** Hover-revealed "..." button that opens a menu with a destructive action. */
function ActionsMenu({
  triggerLabel,
  deleteLabel,
  onDelete,
  deleteDisabled,
  children,
}: ActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={triggerLabel}
        className={cn(ICON_BUTTON_CLASS, REVEAL_ON_HOVER_CLASS)}
      >
        <EllipsisVertical className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {children}
        {children ? <DropdownMenuSeparator /> : null}
        <DropdownMenuItem
          variant="destructive"
          disabled={deleteDisabled}
          onClick={onDelete}
        >
          {deleteLabel}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

type ColumnHeaderCellProps = {
  column: Column
  canDelete: boolean
  onRename: (title: string) => void
  onChangeType: (type: ColumnType) => void
  onDelete: () => void
}

function ColumnHeaderCell({
  column,
  canDelete,
  onRename,
  onChangeType,
  onDelete,
}: ColumnHeaderCellProps) {
  const { label: typeLabel, icon: TypeIcon } = COLUMN_TYPES[column.type]

  return (
    <TableHead className={cn(DATA_CELL_CLASS, "group h-9")}>
      <div className="flex h-9 items-center gap-1.5 pr-1 pl-2">
        <TypeIcon className="size-3.5 shrink-0 text-muted-foreground/70" />
        <EditableInput
          value={column.title}
          onChange={(event) => onRename(event.target.value)}
          aria-label="Column name"
          placeholder="Untitled"
          className="px-0 font-medium text-muted-foreground placeholder:text-muted-foreground/50"
        />
        <ActionsMenu
          triggerLabel={`Actions for column ${column.title || "Untitled"}`}
          deleteLabel="Delete column"
          onDelete={onDelete}
          deleteDisabled={!canDelete}
        >
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <TypeIcon />
              Type
              <span className="ml-auto text-muted-foreground">{typeLabel}</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup
                value={column.type}
                onValueChange={(value) => onChangeType(value as ColumnType)}
              >
                {Object.entries(COLUMN_TYPES).map(
                  ([type, { label, icon: Icon }]) => (
                    <DropdownMenuRadioItem key={type} value={type}>
                      <Icon />
                      {label}
                    </DropdownMenuRadioItem>
                  )
                )}
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </ActionsMenu>
      </div>
    </TableHead>
  )
}

function AddColumnCell({ onAdd }: { onAdd: () => void }) {
  return (
    <TableHead className={cn(DATA_CELL_CLASS, "h-9 w-9 min-w-9")}>
      <div className="flex h-9 items-center justify-center">
        <button
          type="button"
          onClick={onAdd}
          aria-label="Add column"
          className={ICON_BUTTON_CLASS}
        >
          <Plus className="size-4" />
        </button>
      </div>
    </TableHead>
  )
}

// --- Cell editors ------------------------------------------------------------

type CellEditorProps = {
  column: Column
  value: CellValue
  rowNumber: number
  statusOptionActions: StatusOptionActions
  onChange: (value: CellValue) => void
}

/** Renders the editor matching the column's property type. */
function CellEditor({
  column,
  value,
  rowNumber,
  statusOptionActions,
  onChange,
}: CellEditorProps) {
  const label = `${column.title || "Untitled"}, row ${rowNumber}`
  const text = typeof value === "string" ? value : ""

  switch (column.type) {
    case "number":
      return (
        <EditableInput
          type="number"
          inputMode="decimal"
          value={text}
          onChange={(event) => onChange(event.target.value)}
          aria-label={label}
          placeholder="Empty"
          className={cn(EMPTY_PLACEHOLDER_CLASS, NUMBER_INPUT_CLASS)}
        />
      )
    case "url":
      return (
        <EditableInput
          type="url"
          inputMode="url"
          value={text}
          onChange={(event) => onChange(event.target.value)}
          aria-label={label}
          placeholder="https://"
          className="text-blue-600 underline decoration-blue-600/40 underline-offset-2 placeholder:text-muted-foreground/50 dark:text-blue-400 dark:decoration-blue-400/40"
        />
      )
    case "date":
      return (
        <EditableInput
          type="date"
          value={text}
          onChange={(event) => onChange(event.target.value)}
          aria-label={label}
        />
      )
    case "status":
      return (
        <StatusCell
          column={column}
          value={text}
          label={label}
          actions={statusOptionActions}
          onChange={onChange}
        />
      )
    case "file":
      return (
        <FileCell
          value={Array.isArray(value) ? value : []}
          label={`Add file to ${label}`}
          onChange={onChange}
        />
      )
    default:
      return (
        <EditableInput
          value={text}
          onChange={(event) => onChange(event.target.value)}
          aria-label={label}
          placeholder="Empty"
          className={EMPTY_PLACEHOLDER_CLASS}
        />
      )
  }
}

type FileCellProps = {
  value: FileAttachment[]
  label: string
  onChange: (value: FileAttachment[]) => void
}

/** Files & media editor: attachment chips with image thumbnails and a picker. */
function FileCell({ value, label, onChange }: FileCellProps) {
  const pickerRef = useRef<HTMLInputElement>(null)

  const addFiles = (files: FileList | null) => {
    if (!files?.length) return
    const attachments = Array.from(files, (file) => ({
      id: newId(),
      name: file.name,
      type: file.type,
      url: URL.createObjectURL(file),
    }))
    onChange([...value, ...attachments])
  }

  const removeFile = (id: string) => {
    const target = value.find((file) => file.id === id)
    if (target) URL.revokeObjectURL(target.url)
    onChange(value.filter((file) => file.id !== id))
  }

  return (
    <div className="flex min-h-9 flex-wrap items-center gap-1 px-2 py-1">
      {value.map((file) => (
        <AttachmentChip
          key={file.id}
          file={file}
          onRemove={() => removeFile(file.id)}
        />
      ))}

      <button
        type="button"
        onClick={() => pickerRef.current?.click()}
        aria-label={label}
        className={
          value.length === 0
            ? "flex h-7 w-full items-center px-1 text-left text-sm"
            : cn(ICON_BUTTON_CLASS, REVEAL_ON_HOVER_CLASS)
        }
      >
        {value.length === 0 ? (
          <span className={EMPTY_LABEL_CLASS}>Empty</span>
        ) : (
          <Plus className="size-4" />
        )}
      </button>

      <input
        ref={pickerRef}
        type="file"
        multiple
        tabIndex={-1}
        aria-hidden="true"
        className="hidden"
        onChange={(event) => {
          addFiles(event.target.files)
          event.target.value = ""
        }}
      />
    </div>
  )
}

function AttachmentChip({
  file,
  onRemove,
}: {
  file: FileAttachment
  onRemove: () => void
}) {
  const isImage = file.type.startsWith("image/")

  return (
    <span className="group/chip flex h-6 max-w-44 items-center gap-1.5 rounded-md bg-muted pr-1 pl-1.5 text-xs">
      {isImage ? (
        // Object URLs can't go through next/image; a plain img is intentional.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={file.url}
          alt=""
          className="size-4 shrink-0 rounded-sm object-cover"
        />
      ) : (
        <File className="size-3.5 shrink-0 text-muted-foreground" />
      )}
      <a
        href={file.url}
        target="_blank"
        rel="noreferrer"
        className="truncate hover:underline"
      >
        {file.name}
      </a>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${file.name}`}
        className="shrink-0 rounded-sm text-muted-foreground opacity-0 transition-opacity group-hover/chip:opacity-100 hover:text-foreground focus-visible:opacity-100"
      >
        <X className="size-3" />
      </button>
    </span>
  )
}

// --- Status cell ---------------------------------------------------------------

function StatusBadge({ option }: { option: StatusOption }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium",
        STATUS_COLORS[option.color].badge
      )}
    >
      {option.label}
    </span>
  )
}

type StatusOptionMenuProps = {
  option: StatusOption
  onSetColor: (color: StatusColor) => void
  onDelete: () => void
}

/** Per-option "..." menu: pick a color or delete the option. */
function StatusOptionMenu({
  option,
  onSetColor,
  onDelete,
}: StatusOptionMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Edit option ${option.label}`}
        className={cn(
          ICON_BUTTON_CLASS,
          "size-5 opacity-0 transition-opacity group-hover/option:opacity-100 focus-visible:opacity-100 data-popup-open:opacity-100"
        )}
      >
        <EllipsisVertical className="size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuRadioGroup
          value={option.color}
          onValueChange={(color) => onSetColor(color as StatusColor)}
        >
          {Object.entries(STATUS_COLORS).map(([color, { label, dot }]) => (
            <DropdownMenuRadioItem key={color} value={color}>
              <span className={cn("size-2.5 rounded-full", dot)} />
              {label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={onDelete}>
          Delete option
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

type StatusCellProps = {
  column: StatusColumn
  value: string
  label: string
  actions: StatusOptionActions
  onChange: (value: string) => void
}

/** Status editor: badge trigger opening a search-or-create option popover. */
function StatusCell({
  column,
  value,
  label,
  actions,
  onChange,
}: StatusCellProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")

  const selected = column.options.find((option) => option.id === value)
  const normalizedQuery = query.trim().toLowerCase()
  const filtered = normalizedQuery
    ? column.options.filter((option) =>
        option.label.toLowerCase().includes(normalizedQuery)
      )
    : column.options
  const canCreate =
    normalizedQuery.length > 0 &&
    !column.options.some(
      (option) => option.label.toLowerCase() === normalizedQuery
    )

  const select = (optionId: string) => {
    onChange(optionId)
    setOpen(false)
  }

  const createAndSelect = () => {
    select(actions.add(column.id, query.trim()).id)
  }

  return (
    <Popover.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setQuery("")
      }}
    >
      <Popover.Trigger
        aria-label={label}
        className="flex h-9 w-full items-center rounded-sm px-2 outline-none focus-visible:ring-1 focus-visible:ring-ring/70"
      >
        {selected ? (
          <StatusBadge option={selected} />
        ) : (
          <span className={EMPTY_LABEL_CLASS}>Empty</span>
        )}
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Positioner
          side="bottom"
          align="start"
          sideOffset={4}
          className="isolate z-50 outline-none"
        >
          <Popover.Popup className="w-56 rounded-lg bg-popover/80 p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 backdrop-blur-xl outline-none duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
            <div className="p-1">
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== "Enter") return
                  if (canCreate) createAndSelect()
                  else if (filtered[0]) select(filtered[0].id)
                }}
                placeholder="Search or create..."
                aria-label="Search or create an option"
                className="h-7 w-full rounded-md bg-muted px-2 text-xs outline-none placeholder:text-muted-foreground/70 focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            <div className="max-h-48 overflow-y-auto p-1">
              {filtered.map((option) => (
                <div key={option.id} className="group/option flex items-center">
                  <button
                    type="button"
                    onClick={() => select(option.id)}
                    className="flex h-7 flex-1 items-center rounded-md px-1.5 text-left transition-colors hover:bg-accent"
                  >
                    <StatusBadge option={option} />
                  </button>
                  <StatusOptionMenu
                    option={option}
                    onSetColor={(color) =>
                      actions.setColor(column.id, option.id, color)
                    }
                    onDelete={() => actions.remove(column.id, option.id)}
                  />
                </div>
              ))}

              {filtered.length === 0 && !canCreate ? (
                <p className="px-2 py-1.5 text-xs text-muted-foreground">
                  No options
                </p>
              ) : null}

              {canCreate ? (
                <button
                  type="button"
                  onClick={createAndSelect}
                  className="flex h-7 w-full items-center gap-1.5 rounded-md px-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <Plus className="size-3.5" />
                  Create
                  <span className="truncate font-medium text-foreground">
                    &ldquo;{query.trim()}&rdquo;
                  </span>
                </button>
              ) : null}
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}

type DataRowProps = {
  row: Row
  rowNumber: number
  columns: Column[]
  statusOptionActions: StatusOptionActions
  onUpdateCell: (columnId: string, value: CellValue) => void
  onDelete: () => void
}

function DataRow({
  row,
  rowNumber,
  columns,
  statusOptionActions,
  onUpdateCell,
  onDelete,
}: DataRowProps) {
  return (
    <TableRow className="group">
      <TableCell className={cn(GUTTER_CELL_CLASS, "p-0")}>
        <div className="flex h-9 items-center justify-center">
          <ActionsMenu
            triggerLabel={`Actions for row ${rowNumber}`}
            deleteLabel="Delete row"
            onDelete={onDelete}
          />
        </div>
      </TableCell>

      {columns.map((column) => (
        <TableCell key={column.id} className={DATA_CELL_CLASS}>
          <CellEditor
            column={column}
            value={row.cells[column.id] ?? emptyCellFor(column.type)}
            rowNumber={rowNumber}
            statusOptionActions={statusOptionActions}
            onChange={(value) => onUpdateCell(column.id, value)}
          />
        </TableCell>
      ))}
    </TableRow>
  )
}

function AddRowRow({ colSpan, onAdd }: { colSpan: number; onAdd: () => void }) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={colSpan} className="p-0">
        <button
          type="button"
          onClick={onAdd}
          className="flex h-9 w-full items-center gap-1.5 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
        >
          <Plus className="size-4" />
          New
        </button>
      </TableCell>
    </TableRow>
  )
}

// --- Component ---------------------------------------------------------------

export default function TableType() {
  const {
    columns,
    rows,
    addColumn,
    renameColumn,
    changeColumnType,
    deleteColumn,
    addRow,
    deleteRow,
    updateCell,
    statusOptionActions,
  } = useEditableTable()

  return (
    <div className="overflow-hidden rounded-lg border bg-background">
      {/* `min-w-max` lets the table outgrow its container so it scrolls
          horizontally inside the container instead of squeezing columns
          or pushing the dashboard root. */}
      <Table className="min-w-max text-sm">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead
              className={cn(GUTTER_CELL_CLASS, "h-9 px-0")}
              aria-hidden="true"
            />

            {columns.map((column) => (
              <ColumnHeaderCell
                key={column.id}
                column={column}
                canDelete={columns.length > 1}
                onRename={(title) => renameColumn(column.id, title)}
                onChangeType={(type) => changeColumnType(column.id, type)}
                onDelete={() => deleteColumn(column.id)}
              />
            ))}

            <AddColumnCell onAdd={addColumn} />
          </TableRow>
        </TableHeader>

        <TableBody>
          {rows.map((row, index) => (
            <DataRow
              key={row.id}
              row={row}
              rowNumber={index + 1}
              columns={columns}
              statusOptionActions={statusOptionActions}
              onUpdateCell={(columnId, value) =>
                updateCell(row.id, columnId, value)
              }
              onDelete={() => deleteRow(row.id)}
            />
          ))}

          <AddRowRow colSpan={columns.length + 1} onAdd={addRow} />
        </TableBody>
      </Table>
    </div>
  )
}
