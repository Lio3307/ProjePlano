"use client"

import { useId, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DeleteRecordDialog } from "@/components/ui/delete-record-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export type DocumentManagement = {
  pinned: boolean
  canMoveUp: boolean
  canMoveDown: boolean
  rename: (title: string) => boolean
  setPinned: (pinned: boolean) => boolean
  move: (direction: -1 | 1) => boolean
  delete: () => boolean
}

export function DocumentActions({ title, management, onDuplicate, onExport, onCopy, onResult }: {
  title: string
  management: DocumentManagement
  onDuplicate: () => void
  onExport: (format: "html" | "md") => void
  onCopy: () => void
  onResult: (ok: boolean, message: string) => void
}) {
  const trigger = useRef<HTMLButtonElement>(null)
  const nameId = useId()
  const [dialog, setDialog] = useState<"rename" | "delete" | null>(null)
  const [name, setName] = useState(title)
  const [error, setError] = useState(false)
  return <>
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button ref={trigger} variant="outline" />}>Document actions</DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => { setName(title); setError(false); setDialog("rename") }}>Rename</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onResult(management.setPinned(!management.pinned), management.pinned ? "Document unpinned." : "Document pinned to Overview.")}>
          {management.pinned ? "Unpin from Overview" : "Pin to Overview"}
        </DropdownMenuItem>
        <DropdownMenuItem disabled={!management.canMoveUp} onClick={() => onResult(management.move(-1), "Document moved up.")}>Move up</DropdownMenuItem>
        <DropdownMenuItem disabled={!management.canMoveDown} onClick={() => onResult(management.move(1), "Document moved down.")}>Move down</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onDuplicate}>Duplicate saved</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onExport("html")}>Export saved HTML</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onExport("md")}>Export saved Markdown</DropdownMenuItem>
        <DropdownMenuItem onClick={onCopy}>Copy current text</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => setDialog("delete")}>Delete document</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    {dialog === "rename" ? <Dialog open onOpenChange={open => { if (!open) setDialog(null) }}>
      <DialogContent finalFocus={trigger} className="max-w-md">
        <form className="space-y-5" onSubmit={event => {
          event.preventDefault()
          if (!name.trim()) { setError(true); return }
          if (name.trim() !== title && !management.rename(name)) { setError(true); return }
          setDialog(null)
          onResult(true, "Document renamed.")
        }}>
          <DialogHeader><DialogTitle>Rename document</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <label htmlFor={nameId} className="text-sm font-medium">Document name</label>
            <Input id={nameId} autoFocus required value={name} aria-invalid={error || undefined} onChange={event => setName(event.target.value)} />
          </div>
          {error ? <p role="alert" className="text-sm text-destructive">Enter a valid name. The document could not be renamed.</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
            <Button type="submit" disabled={!name.trim()}>Rename</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog> : null}
    {dialog === "delete" ? <DeleteRecordDialog title="Delete document?"
      description={`Delete “${title}”, its unsaved draft, and all task links to it? Tasks remain. This cannot be undone.`}
      finalFocus={trigger} onClose={() => setDialog(null)} onDelete={management.delete} /> : null}
  </>
}
