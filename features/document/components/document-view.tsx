"use client"

import { useState } from "react"
import { Save } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"

import { RichEditor } from "./rich-editor"

export type DocumentLinkedWorkLink = {
  boardId: string
  boardTitle: string
  workItemId: string
  workItemTitle: string
  href: string
}

interface DocumentViewProps {
  resourceId: string
  resourceTitle: string
  savedContent: string
  linkedWorkItems: readonly DocumentLinkedWorkLink[]
  onSave: (resourceId: string, content: string) => boolean
}

export function DocumentView({
  resourceId,
  resourceTitle,
  savedContent,
  linkedWorkItems,
  onSave,
}: DocumentViewProps) {
  const [content, setContent] = useState(savedContent)
  const [saveState, setSaveState] = useState<
    "idle" | "saved" | "error"
  >("idle")
  const hasChanges = content !== savedContent
  const saveMessage = getSaveMessage(hasChanges, saveState)

  function handleSave() {
    if (!hasChanges) {
      return
    }

    if (!onSave(resourceId, content)) {
      setSaveState("error")
      return
    }

    setSaveState("saved")
  }

  function handleChange(nextContent: string) {
    setContent(nextContent)
    setSaveState("idle")
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-3 border-b px-4 py-3">
        <div className="min-w-0 flex-1 basis-56">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Project document
          </p>
          <h2 className="wrap-anywhere text-lg font-semibold">
            {resourceTitle}
          </h2>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          {saveState === "error" ? (
            <p role="alert" className="text-xs text-destructive">
              Save failed
            </p>
          ) : (
            <p
              role="status"
              aria-live="polite"
              className="text-xs text-muted-foreground"
            >
              {saveMessage}
            </p>
          )}
          <Button
            type="button"
            disabled={!hasChanges}
            onClick={handleSave}
          >
            <Save aria-hidden="true" />
            Save
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <section
          aria-labelledby="document-linked-work-title"
          className="min-w-0 space-y-2 border-b px-4 py-2.5"
        >
          <div className="flex min-w-0 items-center gap-2">
            <h3
              id="document-linked-work-title"
              className="text-xs font-semibold"
            >
              Linked work
            </h3>
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[0.625rem] text-muted-foreground">
              {linkedWorkItems.length}
            </span>
          </div>
          {linkedWorkItems.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Not linked to any task
            </p>
          ) : (
            <ul className="grid min-w-0 gap-1.5 sm:grid-cols-2">
              {linkedWorkItems.map((linkedWorkItem) => (
                <li
                  key={linkedWorkItem.workItemId}
                  className="flex min-w-0 items-start justify-between gap-3 rounded-md border px-2.5 py-2 text-xs"
                >
                  <div className="min-w-0">
                    <p
                      className="truncate font-medium"
                      title={linkedWorkItem.boardTitle}
                    >
                      {linkedWorkItem.boardTitle}
                    </p>
                    <p className="break-words text-muted-foreground">
                      {linkedWorkItem.workItemTitle}
                    </p>
                  </div>
                  <Link
                    href={linkedWorkItem.href}
                    className="shrink-0 font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    Open board
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <div className="mx-auto w-full max-w-3xl px-6 py-2">
          <RichEditor
            content={content}
            onChange={handleChange}
            placeholder="Type / to insert blocks..."
          />
        </div>
      </div>
    </div>
  )
}

function getSaveMessage(
  hasChanges: boolean,
  saveState: "idle" | "saved" | "error"
) {
  if (hasChanges) {
    return "Unsaved changes"
  }

  return saveState === "saved"
    ? "Saved for this session"
    : "Saved version loaded"
}
