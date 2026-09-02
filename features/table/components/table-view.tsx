"use client"

import { Plus } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu"
import { ActionsMenu, EditableInput, IconButton } from "./primitives"
import { CellEditor } from "./cell-editor"
import { useEditableTable } from "../use-editable-table"
import {
  COLUMN_TYPES,
  emptyCell,
  type CellValue,
  type Column,
  type ColumnType,
  type Row,
  type StatusOptionActions,
} from "../model"

const GUTTER_CELL = "w-8 p-0"
const DATA_CELL = "min-w-44 border-l border-border p-0"

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
    <TableHead className={cn(DATA_CELL, "group z-20 h-9")}>
      <div className="flex h-9 items-center gap-1.5 pr-1 pl-2">
        <TypeIcon className="size-3.5 shrink-0 text-muted-foreground/70" />
        <EditableInput
          value={column.title}
          onChange={(event) => onRename(event.target.value)}
          aria-label="Column name"
          placeholder="Untitled"
          className="h-7 px-1 font-medium text-muted-foreground placeholder:text-muted-foreground/50 focus-visible:bg-muted/60 focus-visible:ring-0"
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
      <TableCell className={GUTTER_CELL}>
        <div className="flex h-9 items-center justify-center">
          <ActionsMenu
            triggerLabel={`Actions for row ${rowNumber}`}
            deleteLabel="Delete row"
            onDelete={onDelete}
          />
        </div>
      </TableCell>

      {columns.map((column) => (
        <TableCell key={column.id} className={DATA_CELL}>
          <CellEditor
            column={column}
            value={row.cells[column.id] ?? emptyCell(column.type)}
            rowNumber={rowNumber}
            statusOptionActions={statusOptionActions}
            onChange={(value) => onUpdateCell(column.id, value)}
          />
        </TableCell>
      ))}
    </TableRow>
  )
}

export function TableView() {
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
    <div className="overflow-hidden border bg-background">
      <Table className="min-w-max text-sm">
        <TableHeader className="[&_th]:sticky [&_th]:top-0 [&_th]:bg-background">
          <TableRow className="hover:bg-transparent">
            <TableHead
              className={cn(GUTTER_CELL, "z-20 h-9")}
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

            <TableHead className={cn(DATA_CELL, "z-20 h-9 w-9 min-w-9")}>
              <div className="flex h-9 items-center justify-center">
                <IconButton onClick={addColumn} aria-label="Add column">
                  <Plus className="size-4" />
                </IconButton>
              </div>
            </TableHead>
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

          <TableRow className="hover:bg-transparent">
            <TableCell colSpan={columns.length + 1} className="p-0">
              <div className="flex px-1 py-1">
                <button
                  type="button"
                  onClick={addRow}
                  className="flex h-7 items-center gap-1.5 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                >
                  <Plus className="size-4" />
                  New
                </button>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )
}
