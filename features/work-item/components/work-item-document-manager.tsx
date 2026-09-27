"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { WorkItemDocumentOption } from "./work-item-documents-field"

interface WorkItemDocumentManagerProps {
  workItemId: string
  documents: readonly WorkItemDocumentOption[]
  linkedResourceIds: readonly string[]
  onLink: (workItemId: string, resourceId: string) => boolean
  onUnlink: (workItemId: string, resourceId: string) => boolean
  onCreateAndLink: (workItemId: string, title: string) => boolean
}

export function WorkItemDocumentManager({
  workItemId,
  documents,
  linkedResourceIds,
  onLink,
  onUnlink,
  onCreateAndLink,
}: WorkItemDocumentManagerProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [title, setTitle] = useState("")
  const [error, setError] = useState<string | null>(null)
  const linkedIds = new Set(linkedResourceIds)
  const linkedDocuments = documents.filter((document) =>
    linkedIds.has(document.id)
  )
  const panelId = "work-item-documents-" + workItemId

  function handleDocumentChange(resourceId: string, checked: boolean) {
    const changed = checked
      ? onLink(workItemId, resourceId)
      : onUnlink(workItemId, resourceId)

    setError(
      changed
        ? null
        : "The document relationship could not be changed."
    )
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const documentTitle = title.trim()

    if (!documentTitle) {
      setError("Enter a document name.")
      return
    }

    if (!onCreateAndLink(workItemId, documentTitle)) {
      setError("The document could not be created and linked.")
      return
    }

    setTitle("")
    setError(null)
  }

  function toggleManager() {
    setIsExpanded((current) => !current)
    setError(null)
  }

  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold">Linked documents</h3>

      {linkedDocuments.length > 0 ? (
        <ul className="space-y-2">
          {linkedDocuments.map((document) => (
            <li key={document.id}>
              <Link
                href={document.href}
                className="block rounded-md border px-3 py-2 text-sm font-medium outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
              >
                {document.title}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          No linked documents.
        </p>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        aria-expanded={isExpanded}
        aria-controls={panelId}
        onClick={toggleManager}
      >
        <Plus aria-hidden="true" />
        Add Docs
      </Button>

      {isExpanded ? (
        <div
          id={panelId}
          className="space-y-5 rounded-lg border bg-muted/20 p-4"
        >
          <fieldset className="space-y-2">
            <legend className="text-xs font-medium">
              Project documents
            </legend>
            {documents.length > 0 ? (
              <ul className="space-y-1">
                {documents.map((document) => (
                  <li key={document.id}>
                    <label className="flex cursor-pointer items-center gap-3 rounded-md border bg-background px-3 py-2 text-sm hover:bg-muted/60">
                      <input
                        type="checkbox"
                        checked={linkedResourceIds.includes(document.id)}
                        onChange={(event) =>
                          handleDocumentChange(
                            document.id,
                            event.target.checked
                          )
                        }
                      />
                      <span className="min-w-0 flex-1 truncate">
                        {document.title}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
                This project has no documents yet.
              </p>
            )}
          </fieldset>

          <form className="space-y-3 border-t pt-4" onSubmit={handleSubmit}>
            <label className="grid gap-1.5 text-xs font-medium">
              New blank document
              <Input
                value={title}
                autoComplete="off"
                placeholder="Task notes"
                onChange={(event) => setTitle(event.target.value)}
              />
            </label>
            <Button type="submit" disabled={!title.trim()}>
              Create and link
            </Button>
          </form>

          <p
            role="alert"
            aria-live="polite"
            className="min-h-5 text-xs text-destructive"
          >
            {error}
          </p>
        </div>
      ) : null}
    </section>
  )
}
