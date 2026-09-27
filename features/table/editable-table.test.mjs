import assert from "node:assert/strict"
import test from "node:test"
import { createProjectStore } from "../project/store.ts"
import { createTableActions } from "./editable-table.ts"
import { encodeAttachment } from "./attachments.ts"
import { isPortableAttachment } from "./snapshot.ts"

test("Table column and status changes are atomic and remain exportable", () => {
  const store = createProjectStore()
  const viewId = "view-3-table"
  const actions = createTableActions(update => store.getState().updateTable(viewId, update))
  assert.equal(typeof actions.changeColumnType, "function")
  actions.changeColumnType("status", "text")
  assert.equal(store.getState().tablesByViewId[viewId].rows[0].cells.status, "In progress")
  actions.changeColumnType("status", "status")
  assert.equal(store.getState().tablesByViewId[viewId].rows[0].cells.status, "")
  const option = actions.statusOptionActions.add("status", "Waiting")
  actions.updateCell("r1", "status", option.id)
  actions.statusOptionActions.remove("status", option.id)
  assert.equal(store.getState().tablesByViewId[viewId].rows[0].cells.status, "")
  actions.changeColumnType("status", "file")
  assert.equal(store.getState().tablesByViewId[viewId].columns.find(c => c.id === "status").type, "file")
  assert.deepEqual(store.getState().tablesByViewId[viewId].rows[0].cells.status, [])
  actions.deleteColumn("attachments")
  actions.addColumn()
  actions.addRow()
  actions.updateCell("r1", "name", "Final table name")
  assert.equal(store.getState().importBackup(store.getState().exportBackup()).ok, true)
  assert.equal(store.getState().tablesByViewId[viewId].rows[0].cells.name, "Final table name")
})

test("files carry their bytes through JSON and enforce the upload limit", async () => {
  const file = new File(["backup contents"], "notes.txt", { type: "text/plain" })
  const attachment = await encodeAttachment(file)
  assert.equal(isPortableAttachment(attachment), true)
  assert.equal(atob(JSON.parse(JSON.stringify(attachment)).url.split(",")[1]), "backup contents")
  assert.equal(attachment.name, "notes.txt")
  const largest = await encodeAttachment(new File([new Uint8Array(2 * 1024 * 1024)], "max.bin"))
  assert.equal(isPortableAttachment(largest), true)
  await assert.rejects(encodeAttachment(new File([new Uint8Array(2 * 1024 * 1024 + 1)], "large.bin")), /2 MB/)
})
