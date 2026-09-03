"use client"

import { useState } from "react"
import { Save } from "lucide-react"

import { Button } from "@/components/ui/button"

import { RichEditor } from "./rich-editor"

interface DocumentViewProps {
  resourceId: string
  resourceTitle: string
  savedContent: string
  onSave: (resourceId: string, content: string) => boolean
}

export function DocumentView({
  resourceId,
  resourceTitle,
  savedContent,
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
      <div className="flex shrink-0 items-center justify-between gap-3 border-b px-4 py-2.5">
        <div className="min-w-0">
          <p className="text-[0.625rem] uppercase tracking-wide text-muted-foreground">
            Local editor content
          </p>
          <h2 className="truncate text-sm font-semibold">
            {resourceTitle}
          </h2>
        </div>
        <div className="flex shrink-0 items-center gap-3">
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
            size="sm"
            disabled={!hasChanges}
            onClick={handleSave}
          >
            <Save aria-hidden="true" />
            Save
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
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

  return saveState === "saved" ? "Saved locally" : "Up to date"
}
