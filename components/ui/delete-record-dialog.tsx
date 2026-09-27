"use client"

import { useRef, useState, type RefObject } from "react"
import { Button } from "./button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./dialog"

export function DeleteRecordDialog({
  title, description, finalFocus, onClose, onDelete,
}: {
  title: string
  description: string
  finalFocus: RefObject<HTMLButtonElement | null>
  onClose: () => void
  onDelete: () => boolean
}) {
  const cancelRef = useRef<HTMLButtonElement>(null)
  const [error, setError] = useState(false)
  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent initialFocus={cancelRef} finalFocus={finalFocus} className="max-w-md space-y-5">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {error ? <p role="alert" className="text-sm text-destructive">This record could not be deleted.</p> : null}
        <DialogFooter>
          <Button ref={cancelRef} variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={() => {
            if (onDelete()) onClose()
            else setError(true)
          }}>Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
