"use client"

import { useRef, useState } from "react"
import { Download, HardDrive, Upload } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { MAX_BACKUP_BYTES, parseBackup, type BackupResult } from "../backup"
import { useProjectStore } from "../store-provider"

type Preview = { text: string; filename: string; backup: Extract<BackupResult, { ok: true }> }

export function BackupDialog() {
  const router = useRouter()
  const exportBackup = useProjectStore(state => state.exportBackup)
  const importBackup = useProjectStore(state => state.importBackup)
  const [open, setOpen] = useState(false)
  const [preview, setPreview] = useState<Preview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [reading, setReading] = useState(false)
  const request = useRef(0)
  const trigger = useRef<HTMLButtonElement>(null)

  function changeOpen(next: boolean) {
    request.current++
    setReading(false)
    setPreview(null)
    setError(null)
    setMessage(null)
    setOpen(next)
  }

  function download() {
    setError(null)
    try {
      const text = exportBackup()
      const blob = new Blob([text], { type: "application/json" })
      if (blob.size > MAX_BACKUP_BYTES) {
        setError("Backup exceeds 20 MB. Remove some attachments before exporting.")
        return
      }
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = `projeplano-backup-${new Date().toISOString().slice(0, 10)}.json`
      document.body.append(anchor)
      anchor.click()
      anchor.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      setMessage("Backup download started.")
    } catch {
      setError("The backup could not be downloaded. Try again.")
    }
  }

  async function readFile(file: File | undefined) {
    if (!file) return
    const currentRequest = ++request.current
    setPreview(null)
    setError(null)
    setMessage(null)
    if (file.size > MAX_BACKUP_BYTES) {
      setError("Choose a JSON backup of 20 MB or smaller.")
      return
    }
    setReading(true)
    try {
      const text = await file.text()
      if (currentRequest !== request.current) return
      const backup = parseBackup(text)
      if (!backup.ok) {
        setError(backup.error)
        return
      }
      setPreview({ text, filename: file.name, backup })
    } catch {
      if (currentRequest === request.current) setError("The file could not be read.")
    } finally {
      if (currentRequest === request.current) setReading(false)
    }
  }

  function restore() {
    if (!preview) return
    const result = importBackup(preview.text)
    if (!result.ok) {
      setError(result.error)
      return
    }
    changeOpen(false)
    router.replace("/dashboard")
  }

  return (
    <div className="ml-auto flex min-w-0 items-center gap-3">
      <Button ref={trigger} variant="outline" onClick={() => changeOpen(true)}>
        <HardDrive aria-hidden="true" />
        Backup
      </Button>
      <Dialog open={open} onOpenChange={changeOpen}>
        <DialogContent finalFocus={trigger} className="max-w-lg space-y-5">
          <DialogHeader>
            <DialogTitle>Backup & restore</DialogTitle>
            <DialogDescription>
              Export your data before reloading or closing the page. Unsaved document changes are not included.
            </DialogDescription>
          </DialogHeader>
          {preview ? (
            <div className="space-y-3 rounded-lg border p-4 text-sm">
              <p className="break-all font-medium">{preview.filename}</p>
              <p className="text-muted-foreground">Exported {new Date(preview.backup.exportedAt).toLocaleString()}</p>
              <dl className="grid grid-cols-2 gap-2">
                <dt>Projects</dt><dd>{Object.keys(preview.backup.data.projectsById).length}</dd>
                <dt>Tasks</dt><dd>{Object.keys(preview.backup.data.workItemsById).length}</dd>
                <dt>Tables</dt><dd>{Object.keys(preview.backup.data.tablesByViewId).length}</dd>
                <dt>Documents</dt><dd>{Object.values(preview.backup.data.resourcesById).filter(resource => resource.type === "document").length}</dd>
              </dl>
              <p>This replaces all current data and unsaved drafts. Export your current data first if you want to keep it.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <Button variant="outline" className="w-full" onClick={download}>
                <Download aria-hidden="true" />Export JSON
              </Button>
              <div className="space-y-2">
                <label htmlFor="backup-file" className="text-sm font-medium">Import JSON</label>
                <Input id="backup-file" type="file" accept=".json,application/json" disabled={reading}
                  onChange={event => {
                    void readFile(event.target.files?.[0])
                    event.target.value = ""
                  }} />
              </div>
            </div>
          )}
          {reading ? <p role="status" className="text-sm">Checking backup…</p> : null}
          {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
          {message ? <p role="status" className="text-sm text-muted-foreground">{message}</p> : null}
          {preview ? (
            <DialogFooter>
              <Button variant="outline" onClick={() => { setPreview(null); setError(null) }}>Cancel import</Button>
              <Button variant="outline" onClick={download}>Export current data</Button>
              <Button variant="destructive" onClick={restore}><Upload aria-hidden="true" />Replace data</Button>
            </DialogFooter>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
