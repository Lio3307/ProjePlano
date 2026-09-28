"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { ResolvedWorkItem } from "../selectors"

export function TaskArchive({ items, onArchive }: {
  items: readonly ResolvedWorkItem[]
  onArchive: (id: string, archived: boolean) => boolean
}) {
  const [open, setOpen] = useState(false)
  const [archivedOnly, setArchivedOnly] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const listHeading = useRef<HTMLDivElement>(null)
  const archivedCount = items.filter(({ workItem }) => workItem.archived).length
  const visible = items.filter(({ workItem, stage }) => archivedOnly ? workItem.archived : stage === "done" && !workItem.archived)
  return <>
    <Button ref={trigger} variant="outline" onClick={() => { setError(null); setMessage(null); setOpen(true) }}>
      Archived tasks ({archivedCount})
    </Button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent finalFocus={trigger} className="flex max-w-xl flex-col overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b py-5 pl-6 pr-14"><DialogTitle>Task archive</DialogTitle></DialogHeader>
        <div className="no-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <div ref={listHeading} tabIndex={-1} className="flex flex-wrap gap-2" role="group" aria-label="Archive lists">
            <Button variant={archivedOnly ? "secondary" : "outline"} aria-pressed={archivedOnly} onClick={() => setArchivedOnly(true)}>Archived ({archivedCount})</Button>
            <Button variant={!archivedOnly ? "secondary" : "outline"} aria-pressed={!archivedOnly} onClick={() => setArchivedOnly(false)}>Completed tasks</Button>
          </div>
          {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
          {message ? <p role="status" className="text-sm text-muted-foreground">{message}</p> : null}
          {visible.length === 0 ? <p role="status" className="text-sm text-muted-foreground">{archivedOnly ? "No archived tasks." : "No completed tasks to archive."}</p> : null}
          <ul className="space-y-2">
            {visible.map(({ workItem, board }) => <li key={workItem.id} className="flex items-center justify-between gap-3 rounded-md border p-3">
              <div className="min-w-0"><p className="font-medium wrap-anywhere">{workItem.title}</p><p className="text-sm text-muted-foreground wrap-anywhere">{board.title}</p></div>
              <Button variant="outline" aria-label={(archivedOnly ? "Restore " : "Archive ") + workItem.title} onClick={() => {
                if (!onArchive(workItem.id, !archivedOnly)) {
                  setMessage(null)
                  setError("The task could not be updated.")
                  return
                }
                setError(null)
                setMessage(workItem.title + (archivedOnly ? " restored." : " archived."))
                listHeading.current?.focus()
              }}>{archivedOnly ? "Restore" : "Archive"}</Button>
            </li>)}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  </>
}
