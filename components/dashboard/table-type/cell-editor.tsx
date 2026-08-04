import { cn } from "@/lib/utils"
import { EditableInput } from "./primitives"
import { FileCell } from "./file-cell"
import { StatusCell } from "./status-cell"
import type { CellValue, Column, StatusOptionActions } from "./model"

const HOVER_PLACEHOLDER =
  "placeholder:text-transparent hover:placeholder:text-muted-foreground/60 focus-visible:placeholder:text-muted-foreground/60"

type CellEditorProps = {
  column: Column
  value: CellValue
  rowNumber: number
  statusOptionActions: StatusOptionActions
  onChange: (value: CellValue) => void
}

export function CellEditor({
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
          className={cn(
            HOVER_PLACEHOLDER,
            "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          )}
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
          className={HOVER_PLACEHOLDER}
        />
      )
  }
}
