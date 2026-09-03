"use client"

import {
  useState,
  type FormEvent,
  type RefObject,
} from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

type NewDocumentDialogProps = {
  open: boolean
  finalFocus: RefObject<HTMLButtonElement | null>
  onOpenChange: (open: boolean) => void
  onCreate: (title: string) => boolean
}

export function NewDocumentDialog({
  open,
  finalFocus,
  onOpenChange,
  onCreate,
}: NewDocumentDialogProps) {
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)

  function resetForm() {
    setName("")
    setError(null)
  }

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setError(null)
    }

    onOpenChange(nextOpen)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const title = name.trim()

    if (!title) {
      setError("Enter a document name.")
      return
    }

    setError(null)

    if (!onCreate(title)) {
      setError("The document could not be created.")
      return
    }

    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      onOpenChangeComplete={(nextOpen) => {
        if (!nextOpen) {
          resetForm()
        }
      }}
    >
      <DialogContent finalFocus={finalFocus} className="max-w-md">
        <form onSubmit={handleSubmit} className="space-y-5">
          <DialogHeader>
            <DialogTitle>New document</DialogTitle>
            <DialogDescription>
              Add another document to this project. Its content stays local
              and resets when the page is reloaded.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label htmlFor="document-name" className="text-xs font-medium">
              Document name
            </label>
            <Input
              id="document-name"
              name="documentName"
              value={name}
              required
              autoFocus
              autoComplete="off"
              placeholder="Release notes"
              aria-invalid={error ? true : undefined}
              onChange={(event) => setName(event.target.value)}
            />
          </div>

          {error ? (
            <p role="alert" className="text-xs text-destructive">
              {error}
            </p>
          ) : null}

          <DialogFooter className="border-t pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={name.trim().length === 0}>
              Create document
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
