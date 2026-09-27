import type { UpdateTable } from "./snapshot"
import { DEFAULT_STATUS_OPTIONS } from "./mock-data.ts"
import { coerceCell, emptyCell, newId,
  type CellValue, type Column, type ColumnType, type StatusColor, type StatusOption,
} from "./model.ts"

export function createTableActions(update: UpdateTable) {
  function updateOptions(columnId: string, change: (options: StatusOption[]) => StatusOption[]) {
    update(table => ({ ...table, columns: table.columns.map(column =>
      column.id === columnId && column.type === "status"
        ? { ...column, options: change(column.options) } : column) }))
  }

  return {
    addColumn() {
      const id = newId()
      update(table => ({ ...table, columns: [...table.columns,
        { id, title: `Column ${table.columns.length + 1}`, type: "text" }] }))
    },
    renameColumn(columnId: string, title: string) {
      update(table => ({ ...table, columns: table.columns.map(column =>
        column.id === columnId ? { ...column, title } : column) }))
    },
    changeColumnType(columnId: string, type: ColumnType) {
      update(table => {
        const source = table.columns.find(column => column.id === columnId)
        if (!source || source.type === type) return table
        return {
          columns: table.columns.map((column): Column => {
            if (column.id !== columnId) return column
            return type === "status"
              ? { id: columnId, title: column.title, type, options: structuredClone(DEFAULT_STATUS_OPTIONS) }
              : { id: columnId, title: column.title, type }
          }),
          rows: table.rows.map(row => ({ ...row, cells: { ...row.cells,
            [columnId]: type === "status" ? "" : coerceCell(source, row.cells[columnId] ?? emptyCell(source.type), type),
          } })),
        }
      })
    },
    deleteColumn(columnId: string) {
      update(table => table.columns.length <= 1 ? table : ({
        columns: table.columns.filter(column => column.id !== columnId),
        rows: table.rows.map(row => ({ ...row,
          cells: Object.fromEntries(Object.entries(row.cells).filter(([id]) => id !== columnId)),
        })),
      }))
    },
    addRow() {
      const id = newId()
      update(table => ({ ...table, rows: [...table.rows, { id,
        cells: Object.fromEntries(table.columns.map(column => [column.id, emptyCell(column.type)])),
      }] }))
    },
    deleteRow(rowId: string) {
      update(table => ({ ...table, rows: table.rows.filter(row => row.id !== rowId) }))
    },
    updateCell(rowId: string, columnId: string, value: CellValue) {
      update(table => ({ ...table, rows: table.rows.map(row => row.id === rowId
        ? { ...row, cells: { ...row.cells, [columnId]: value } } : row) }))
    },
    statusOptionActions: {
      add(columnId: string, label: string): StatusOption {
        const option: StatusOption = { id: newId(), label, color: "gray" }
        updateOptions(columnId, options => [...options, option])
        return option
      },
      setColor(columnId: string, optionId: string, color: StatusColor) {
        updateOptions(columnId, options => options.map(option =>
          option.id === optionId ? { ...option, color } : option))
      },
      remove(columnId: string, optionId: string) {
        update(table => ({
          columns: table.columns.map(column => column.id === columnId && column.type === "status"
            ? { ...column, options: column.options.filter(option => option.id !== optionId) } : column),
          rows: table.rows.map(row => row.cells[columnId] === optionId
            ? { ...row, cells: { ...row.cells, [columnId]: "" } } : row),
        }))
      },
    },
  }
}
