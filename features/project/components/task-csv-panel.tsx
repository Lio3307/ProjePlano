"use client"

import { useRef, useState } from "react"
import { Download, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { WorkItem } from "@/features/work-item/model"
import {
  buildCsvTasks, exportTaskCsv, MAX_TASK_CSV_BYTES, parseTaskCsv,
  type ParsedTaskCsv, type TaskCsvField, type TaskCsvMapping,
} from "../task-csv"

type TaskCsvPanelProps = {
  tasks: readonly WorkItem[]
  projectId: string
  boardId: string
  onImport: (tasks: WorkItem[]) => boolean
}

const FIELDS: { key: TaskCsvField; label: string }[] = [
  { key: "title", label: "Title" },
  { key: "description", label: "Description" },
  { key: "priority", label: "Priority" },
  { key: "type", label: "Type" },
  { key: "startDate", label: "Start date" },
  { key: "dueDate", label: "Due date" },
  { key: "estimate", label: "Estimate" },
]
const SELECT_CLASS = "h-11 w-full min-w-0 rounded-md border border-input bg-background px-3 text-base md:text-sm"

function suggestMapping(headers: readonly string[]): TaskCsvMapping {
  const mapping: TaskCsvMapping = {}
  for (const field of FIELDS) {
    const index = headers.findIndex(header => header.toLowerCase().replace(/[\s_-]/g, "") === field.key.toLowerCase())
    if (index >= 0) mapping[field.key] = index
  }
  return mapping
}

export function TaskCsvPanel({ tasks, projectId, boardId, onImport }: TaskCsvPanelProps) {
  const [parsed, setParsed] = useState<ParsedTaskCsv | null>(null)
  const [mapping, setMapping] = useState<TaskCsvMapping>({})
  const [filename, setFilename] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const request = useRef(0)
  const preview = parsed ? buildCsvTasks(parsed, mapping, projectId, boardId, () => "preview") : null

  async function readFile(file: File | undefined) {
    if (!file) return
    const current = ++request.current
    setParsed(null)
    setError(null)
    setMessage(null)
    if (file.size > MAX_TASK_CSV_BYTES) {
      setError("Choose a CSV file of 2 MB or smaller.")
      return
    }
    setBusy(true)
    try {
      const result = parseTaskCsv(await file.text())
      if (current !== request.current) return
      setParsed(result)
      setMapping(suggestMapping(result.headers))
      setFilename(file.name)
    } catch (cause) {
      if (current === request.current) setError(cause instanceof Error ? cause.message : "The CSV file could not be read.")
    } finally {
      if (current === request.current) setBusy(false)
    }
  }

  function importTasks() {
    if (!parsed || !boardId) return
    setError(null)
    setMessage(null)
    const result = buildCsvTasks(parsed, mapping, projectId, boardId, () => `work-item-${crypto.randomUUID()}`)
    if (result.errors.length) return
    if (!onImport(result.tasks)) {
      setError("Tasks could not be imported. Check the destination board and try again.")
      return
    }
    setParsed(null)
    setFilename("")
    setMessage(`${result.tasks.length} tasks imported.`)
  }

  function download() {
    setError(null)
    setMessage(null)
    try {
      const blob = new Blob([exportTaskCsv(tasks)], { type: "text/csv;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = `projeplano-tasks-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.append(anchor)
      anchor.click()
      anchor.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      setMessage("CSV download started.")
    } catch {
      setError("The CSV could not be downloaded. Try again.")
    }
  }

  return (
    <section aria-label="Task CSV import and export" className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={download}>
          <Download aria-hidden="true" /> Export tasks CSV
        </Button>
      </div>
      <div className="space-y-2">
        <label htmlFor="task-csv-file" className="text-sm font-medium">Import tasks CSV</label>
        <Input id="task-csv-file" type="file" accept=".csv,text/csv" disabled={!boardId || busy}
          onChange={event => {
            void readFile(event.target.files?.[0])
            event.target.value = ""
          }} />
        {!boardId ? <p className="text-sm text-muted-foreground">Create or select a destination board to import tasks.</p> : null}
      </div>
      {busy ? <p role="status" className="text-sm">Reading CSV…</p> : null}
      {parsed ? (
        <div className="space-y-4">
          <p className="break-all text-sm font-medium">{filename} · {parsed.rows.length} task rows</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {FIELDS.map(field => (
              <label key={field.key} className="grid min-w-0 gap-1.5 text-sm font-medium">
                {field.label}{field.key === "title" ? " *" : ""}
                <select className={SELECT_CLASS} value={mapping[field.key] ?? ""}
                  onChange={event => setMapping(current => ({
                    ...current, [field.key]: event.target.value === "" ? undefined : Number(event.target.value),
                  }))}>
                  <option value="">{field.key === "title" ? "Select column" : "Skip / use default"}</option>
                  {parsed.headers.map((header, index) => <option key={index} value={index}>{header || `Column ${index + 1}`}</option>)}
                </select>
              </label>
            ))}
          </div>
          <div className="min-w-0 overflow-x-auto rounded-md border">
            <table className="w-full text-left text-sm">
              <caption className="p-3 text-left font-medium">Preview: first {Math.min(parsed.rows.length, 5)} rows</caption>
              <thead><tr>{parsed.headers.map((header, index) => <th key={index} scope="col" className="border-t px-3 py-2">{header || `Column ${index + 1}`}</th>)}</tr></thead>
              <tbody>{parsed.rows.slice(0, 5).map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, columnIndex) => <td key={columnIndex} className="border-t px-3 py-2">{cell}</td>)}</tr>)}</tbody>
            </table>
          </div>
          {preview?.errors.length ? (
            <div role="alert" className="max-h-40 overflow-y-auto text-sm text-destructive">
              <p>Fix all CSV errors before importing:</p>
              <ul className="list-disc pl-5">{preview.errors.map((item, index) => <li key={index}>{item}</li>)}</ul>
            </div>
          ) : null}
          <Button type="button" disabled={!boardId || !preview?.tasks.length || Boolean(preview.errors.length)} onClick={importTasks}>
            <Upload aria-hidden="true" /> Import {parsed.rows.length} tasks
          </Button>
        </div>
      ) : null}
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
      {message ? <p role="status" className="text-sm text-muted-foreground">{message}</p> : null}
    </section>
  )
}
