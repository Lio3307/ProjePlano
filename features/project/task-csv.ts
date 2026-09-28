import {
  WORK_ITEM_PRIORITIES, WORK_ITEM_TYPES, isValidWorkItemDateRange,
  type WorkItem,
} from "../work-item/model.ts"

export const MAX_TASK_CSV_BYTES = 2 * 1024 * 1024
export const MAX_TASK_CSV_ROWS = 1000

export type TaskCsvField = "title" | "description" | "priority" | "type" | "startDate" | "dueDate" | "estimate"
export type TaskCsvMapping = Partial<Record<TaskCsvField, number>>
export type ParsedTaskCsv = { headers: string[]; rows: string[][] }

export function parseTaskCsv(text: string): ParsedTaskCsv {
  if (new TextEncoder().encode(text).length > MAX_TASK_CSV_BYTES) {
    throw new Error("CSV exceeds the 2 MB limit.")
  }
  const records: string[][] = []
  let row: string[] = []
  let field = ""
  let quoted = false
  let closedQuote = false
  let atFieldStart = true
  const source = text.startsWith("\uFEFF") ? text.slice(1) : text

  function finishField() {
    row.push(field)
    field = ""
    atFieldStart = true
    closedQuote = false
  }
  function finishRow() {
    finishField()
    if (row.some(value => value !== "")) records.push(row)
    row = []
    if (records.length > MAX_TASK_CSV_ROWS + 1) throw new Error("CSV exceeds 1000 task rows.")
  }

  for (let index = 0; index < source.length; index++) {
    const char = source[index]
    if (quoted) {
      if (char === '"' && source[index + 1] === '"') {
        field += '"'
        index++
      } else if (char === '"') {
        quoted = false
        closedQuote = true
      } else {
        field += char
      }
      continue
    }
    if (char === ",") {
      finishField()
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && source[index + 1] === "\n") index++
      finishRow()
    } else if (char === '"' && atFieldStart) {
      quoted = true
      atFieldStart = false
    } else if (char === '"' || closedQuote) {
      throw new Error(`Malformed CSV quote in row ${records.length + 1}.`)
    } else {
      field += char
      atFieldStart = false
    }
  }
  if (quoted) throw new Error("Malformed CSV: unclosed quote.")
  if (row.length || field || closedQuote) finishRow()
  const [headers, ...rows] = records
  if (!headers?.length || headers.every(value => !value.trim())) throw new Error("CSV needs a header row.")
  if (rows.some(record => record.length !== headers.length)) throw new Error("CSV rows must match the header columns.")
  return { headers, rows }
}

export function buildCsvTasks(
  parsed: ParsedTaskCsv,
  mapping: TaskCsvMapping,
  projectId: string,
  boardId: string,
  makeId: () => string
): { tasks: WorkItem[]; errors: string[] } {
  const errors: string[] = []
  if (mapping.title === undefined || !Number.isInteger(mapping.title) || mapping.title < 0 || mapping.title >= parsed.headers.length) {
    errors.push("Select a title column.")
  }
  const selected = Object.values(mapping).filter(index => index !== undefined)
  if (new Set(selected).size !== selected.length || selected.some(index => !Number.isInteger(index) || index < 0 || index >= parsed.headers.length)) {
    errors.push("Select a different valid column for each mapped field.")
  }
  if (!parsed.rows.length) errors.push("CSV has no task rows.")
  if (parsed.rows.length > MAX_TASK_CSV_ROWS) errors.push("CSV exceeds 1000 task rows.")
  const drafts: Omit<WorkItem, "id">[] = []
  for (const [index, row] of parsed.rows.entries()) {
    const value = (field: TaskCsvField) => mapping[field] === undefined ? "" : (row[mapping[field]] ?? "").trim()
    const title = value("title")
    const type = value("type") || "chore"
    const priority = value("priority") || "medium"
    const startDate = value("startDate") || null
    const dueDate = value("dueDate") || null
    const estimateText = value("estimate")
    const estimate = estimateText === "" ? null : Number(estimateText)
    const rowErrors: string[] = []
    if (!title) rowErrors.push("title is required")
    if (!WORK_ITEM_TYPES.some(item => item === type)) rowErrors.push("type is invalid")
    if (!WORK_ITEM_PRIORITIES.some(item => item === priority)) rowErrors.push("priority is invalid")
    if (!isValidWorkItemDateRange(startDate, dueDate)) rowErrors.push("date range is invalid")
    if (estimate !== null && (!/^\d+$/.test(estimateText) || !Number.isSafeInteger(estimate))) rowErrors.push("estimate must be a nonnegative whole number")
    if (rowErrors.length) {
      errors.push(`Row ${index + 2}: ${rowErrors.join("; ")}.`)
      continue
    }
    drafts.push({
      projectId, boardId, title, description: value("description"),
      type: type as WorkItem["type"], priority: priority as WorkItem["priority"],
      startDate, dueDate, estimate, position: 0, labelIds: [], checklist: [],
      milestoneId: null, dependencyIds: [], linkedResourceIds: [], customFields: {},
    })
  }
  return errors.length ? { tasks: [], errors } : { tasks: drafts.map(draft => ({ ...draft, id: makeId() })), errors: [] }
}

const EXPORT_FIELDS: TaskCsvField[] = ["title", "description", "priority", "type", "startDate", "dueDate", "estimate"]

export function exportTaskCsv(tasks: readonly WorkItem[]): string {
  const escapeCell = (value: string) => {
    const safe = /^[\s]*[=+@\-\t\r\n]/.test(value) ? `'${value}` : value
    return `"${safe.replaceAll('"', '""')}"`
  }
  const lines = [EXPORT_FIELDS.join(",")]
  for (const task of tasks) {
    lines.push(EXPORT_FIELDS.map(field => escapeCell(String(task[field] ?? ""))).join(","))
  }
  return `${lines.join("\r\n")}\r\n`
}
