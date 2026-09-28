import assert from "node:assert/strict"
import { test } from "node:test"
import { buildCsvTasks, exportTaskCsv, parseTaskCsv } from "./task-csv.ts"

test("parses quoted commas, escaped quotes, CRLF, and embedded newlines", () => {
  assert.deepEqual(parseTaskCsv('\uFEFFtitle,description\r\n"Fix, now","Line 1\nLine ""2"""\r\n').rows,
    [["Fix, now", 'Line 1\nLine "2"']])
})

test("rejects malformed CSV, inconsistent rows, oversized files, and too many tasks", () => {
  assert.throws(() => parseTaskCsv('title\n"open'), /quote/i)
  assert.throws(() => parseTaskCsv('title,priority\nA'), /columns/i)
  assert.throws(() => parseTaskCsv('title\n' + 'A\n'.repeat(1001)), /1000/)
  assert.throws(() => parseTaskCsv('x'.repeat(2 * 1024 * 1024 + 1)), /2 MB/)
})

test("validates all rows before generating IDs and defaults optional fields", () => {
  let ids = 0
  const makeId = () => `new-${++ids}`
  const parsed = parseTaskCsv('title,priority,dueDate\nGood,,2026-09-29\nBad,critical,2026-09-30')
  const invalid = buildCsvTasks(parsed, { title: 0, priority: 1, dueDate: 2 }, "project", "board", makeId)
  assert.equal(invalid.tasks.length, 0)
  assert.match(invalid.errors.join(" "), /Row 3.*priority/i)
  assert.equal(ids, 0)
  const valid = buildCsvTasks(parseTaskCsv('title,description\nHello,World'), { title: 0, description: 1 }, "project", "board", makeId)
  assert.deepEqual(valid.errors, [])
  assert.equal(valid.tasks[0].id, "new-1")
  assert.equal(valid.tasks[0].type, "chore")
  assert.equal(valid.tasks[0].priority, "medium")
  assert.deepEqual(valid.tasks[0].dependencyIds, [])
})

test("validates required title, dates, estimate, and mapping", () => {
  const parsed = parseTaskCsv('title,start,due,estimate\n ,2026-02-29,2026-02-28,-1')
  const result = buildCsvTasks(parsed, { title: 0, startDate: 1, dueDate: 2, estimate: 3 }, "p", "b", () => "id")
  assert.equal(result.tasks.length, 0)
  assert.match(result.errors.join(" "), /title/i)
  assert.match(result.errors.join(" "), /date/i)
  assert.match(result.errors.join(" "), /estimate/i)
  assert.match(buildCsvTasks(parsed, {}, "p", "b", () => "id").errors.join(" "), /title column/i)
})

test("exports round-trippable quoted fields and escapes spreadsheet formulas", () => {
  const { tasks } = buildCsvTasks(parseTaskCsv('title,description\n"=1+1","line\nnext"'), { title: 0, description: 1 }, "p", "b", () => "id")
  const csv = exportTaskCsv(tasks)
  const parsed = parseTaskCsv(csv)
  assert.equal(parsed.rows[0][0], "'=1+1")
  assert.equal(parsed.rows[0][1], "line\nnext")
  assert.equal(parsed.headers[0], "title")
})
