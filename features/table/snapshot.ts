import type { Column, FileAttachment, Row, StatusOption } from "./model"
import { INITIAL_COLUMNS, INITIAL_ROWS } from "./mock-data.ts"
import {
  arrayOf, isId, isRecord, isString, objectOf, oneOf, recordOf,
} from "../../lib/json-validation.ts"

export type TableSnapshot = { columns: Column[]; rows: Row[] }
export type UpdateTable = (update: (current: TableSnapshot) => TableSnapshot) => void

export function createTableSnapshot(): TableSnapshot {
  return structuredClone({ columns: INITIAL_COLUMNS, rows: INITIAL_ROWS })
}

export function isHttpUrl(value: unknown): value is string {
  if (!isString(value)) return false
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

const isAttachmentShape = objectOf<FileAttachment>({
  id: isId, name: isString, type: isString, url: isString,
  kind: oneOf("file", "link"),
})

export function isPortableAttachment(value: unknown): value is FileAttachment {
  if (!isAttachmentShape(value)) return false
  if (value.kind === "link") return isHttpUrl(value.url)
  return /^data:application\/octet-stream;base64,(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value.url)
}

const isOption = objectOf<StatusOption>({
  id: isId, label: isString,
  color: oneOf("gray", "orange", "yellow", "green", "blue", "purple", "pink", "red"),
})
const isPlainColumn = objectOf<Exclude<Column, { type: "status" }>>({
  id: isId, title: isString, type: oneOf("text", "number", "url", "date", "file"),
})
const isStatusColumn = objectOf<Extract<Column, { type: "status" }>>({
  id: isId, title: isString, type: oneOf("status"), options: arrayOf(isOption),
})
const isColumn = (value: unknown): value is Column =>
  isPlainColumn(value) || (isStatusColumn(value) && hasUniqueIds(value.options))
const isCell = (value: unknown): value is Row["cells"][string] =>
  isString(value) || (arrayOf(isPortableAttachment)(value) && hasUniqueIds(value))
const isRow = objectOf<Row>({ id: isId, cells: recordOf(isCell) })
const isSnapshotShape = objectOf<TableSnapshot>({
  columns: arrayOf(isColumn), rows: arrayOf(isRow),
})

export function isTableSnapshot(value: unknown): value is TableSnapshot {
  if (!isSnapshotShape(value) || !value.columns.length ||
    !hasUniqueIds(value.columns) || !hasUniqueIds(value.rows)) return false
  const columns = new Map(value.columns.map(column => [column.id, column]))
  return value.rows.every(row => Object.entries(row.cells).every(([id, cell]) => {
    const column = columns.get(id)
    if (!column) return false
    if (column.type === "file") return Array.isArray(cell)
    if (typeof cell !== "string") return false
    return column.type !== "status" || cell === "" ||
      column.options.some(option => option.id === cell)
  }))
}

function hasUniqueIds(items: readonly { id: string }[]) {
  return new Set(items.map(item => item.id)).size === items.length
}

export function isTableMap(value: unknown): value is Record<string, TableSnapshot> {
  return isRecord(value) && recordOf(isTableSnapshot)(value)
}
