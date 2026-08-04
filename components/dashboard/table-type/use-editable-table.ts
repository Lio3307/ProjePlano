import { useState } from "react"

import {
  DEFAULT_STATUS_OPTIONS,
  INITIAL_COLUMNS,
  INITIAL_ROWS,
  coerceCell,
  emptyCell,
  newId,
  revokeAttachments,
  type CellValue,
  type Column,
  type ColumnType,
  type Row,
  type StatusColor,
  type StatusOption,
} from "./model"

export function useEditableTable() {
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
    setRows((current) =>
      current.map((row) =>
        row.cells[columnId] === optionId
          ? { ...row, cells: { ...row.cells, [columnId]: "" } }
          : row
      )
    )
  }

  const addRow = () => {
    setRows((current) => [
      ...current,
      {
        id: newId(),
        cells: Object.fromEntries(
          columns.map((column) => [column.id, emptyCell(column.type)])
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
