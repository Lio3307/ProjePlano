"use client"

import { useState, type FormEvent, type ReactNode, type RefObject } from "react"
import { Button } from "./button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./dialog"
import { Input } from "./input"
import { Textarea } from "./textarea"

type RecordDetails = { title: string; description: string }

export function RecordDetailsDialog({
  title, initialValue, submitLabel = "Save", children, finalFocus, onClose, onSave,
}: {
  title: string
  initialValue: RecordDetails
  submitLabel?: string
  children?: ReactNode
  finalFocus: RefObject<HTMLButtonElement | null>
  onClose: () => void
  onSave: (value: RecordDetails) => boolean
}) {
  const [value, setValue] = useState(initialValue)
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const details = { title: value.title.trim(), description: value.description.trim() }
    if (!details.title) {
      setError("Enter a name.")
      return
    }
    if (!onSave(details)) {
      setError("Your changes could not be saved. Check that this record is still available.")
      return
    }
    onClose()
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent finalFocus={finalFocus} className="flex max-w-lg flex-col overflow-hidden p-0">
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-col">
          <DialogHeader className="shrink-0 border-b p-6 pr-14">
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <div className="no-scrollbar min-h-0 flex-1 space-y-5 overflow-y-auto p-6">
            <label className="grid gap-1.5 text-sm font-medium">
              Name
              <Input autoFocus required value={value.title}
                onChange={(event) => setValue({ ...value, title: event.target.value })} />
            </label>
            <label className="grid gap-1.5 text-sm font-medium">
              Description (optional)
              <Textarea value={value.description}
                onChange={(event) => setValue({ ...value, description: event.target.value })} />
            </label>
            {children}
            {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
          </div>
          <DialogFooter className="shrink-0 border-t p-6">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={!value.title.trim()}>{submitLabel}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
