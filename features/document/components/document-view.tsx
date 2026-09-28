"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Save } from "lucide-react"
import { DocumentNavigationLink as Link, useDocumentNavigation } from "./document-navigation"
import { createDocumentHtml, getDocumentFilename, getDocumentPlainText } from "../content"
import { createDocumentMarkdown } from "../markdown"
import { DocumentActions, type DocumentManagement } from "./document-actions"

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
  draftContent?: string
  onDraftChange: (resourceId: string, content: string) => void
  onDiscardDraft: (resourceId: string) => void
  linkedWorkItems: readonly DocumentLinkedWorkLink[]
  onSave: (resourceId: string, content: string) => boolean
  onDuplicate: (resourceId: string) => boolean
  management: DocumentManagement
}

export function DocumentView({
  resourceId,
  resourceTitle,
  savedContent,
  draftContent,
  onDraftChange,
  onDiscardDraft,
  linkedWorkItems,
  onSave,
  onDuplicate,
  management,
}: DocumentViewProps) {
  const navigation = useDocumentNavigation()
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const content = draftContent ?? savedContent
  const [editorRevision, setEditorRevision] = useState(0)
  const [focused, setFocused] = useState(false)
  const container = useRef<HTMLDivElement>(null)
  const [saveState, setSaveState] = useState<
    "idle" | "saved" | "error"
  >("idle")
  const hasChanges = content !== savedContent
  const saveMessage = getSaveMessage(hasChanges, saveState)

  const handleSave = useCallback(() => {
    if (!hasChanges) {
      return true
    }

    if (!onSave(resourceId, content)) {
      setSaveState("error")
      return false
    }

    setSaveState("saved")
    return true
  }, [hasChanges, onSave, resourceId, content])

  const handleDiscard = useCallback(() => {
    onDiscardDraft(resourceId)
    setEditorRevision(value => value + 1)
    setSaveState("idle")
  }, [onDiscardDraft, resourceId])

  useEffect(() => {
    if (!hasChanges) return
    return navigation.register({ save: handleSave, discard: handleDiscard })
  }, [hasChanges, navigation, handleSave, handleDiscard])

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.defaultPrevented || event.isComposing || (event.target instanceof Element && event.target.closest('[role="dialog"], [role="alertdialog"]'))) return
      if ((event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey && event.key.toLowerCase() === "s") {
        event.preventDefault()
        handleSave()
      }
      if (event.key === "Escape") setFocused(false)
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [handleSave])

  useEffect(() => {
    if (!focused || !container.current) return
    const siblings = new Map<HTMLElement, string>()
    let current: HTMLElement = container.current
    // Keep body portals available for menus and dialogs while isolating the app shell.
    while (current.parentElement && current.parentElement !== document.body) {
      for (const sibling of current.parentElement.children) {
        if (sibling instanceof HTMLElement && sibling !== current) {
          siblings.set(sibling, sibling.style.display)
          sibling.style.display = "none"
        }
      }
      current = current.parentElement
    }
    const overflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      for (const [sibling, display] of siblings) sibling.style.display = display
      document.body.style.overflow = overflow
    }
  }, [focused])

  function reportAction(ok: boolean, message: string) {
    setActionMessage(ok ? message : null)
    setActionError(ok ? null : "The document action could not be completed.")
  }

  async function copyText() {
    try {
      await navigator.clipboard.writeText(getDocumentPlainText(content))
      reportAction(true, "Current text copied, including unsaved changes.")
    } catch {
      setActionMessage(null)
      setActionError("Text could not be copied. Check clipboard permissions or select and copy it manually.")
    }
  }

  function exportDocument(format: "html" | "md") {
    setActionError(null)
    setActionMessage(null)
    try {
      const output = format === "html" ? createDocumentHtml(resourceTitle, savedContent) : createDocumentMarkdown(resourceTitle, savedContent)
      const blob = new Blob([output], { type: format === "html" ? "text/html;charset=utf-8" : "text/markdown;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = getDocumentFilename(resourceTitle, format)
      document.body.append(anchor)
      anchor.click()
      anchor.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      setActionMessage("Saved document download started.")
    } catch {
      setActionError("The document could not be exported.")
    }
  }

  function handleChange(nextContent: string) {
    onDraftChange(resourceId, nextContent)
    setSaveState("idle")
  }

  return (
    <div ref={container} className={focused ? "fixed inset-0 flex flex-col bg-background" : "flex h-full min-h-0 flex-col"}>
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
          <DocumentActions title={resourceTitle} management={management} onResult={reportAction}
            onDuplicate={() => reportAction(onDuplicate(resourceId), "Saved document copied. Available in Select document.")}
            onExport={exportDocument} onCopy={copyText} />
          <Button type="button" variant="outline" aria-pressed={focused} onClick={() => setFocused(value => !value)}>
            {focused ? "Exit focus" : "Focus mode"}
          </Button>
          <Button type="button" variant="outline" disabled={!hasChanges} onClick={handleDiscard}>Discard draft</Button>
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
            aria-keyshortcuts="Control+s Meta+s"
          >
            <Save aria-hidden="true" />
            Save
          </Button>
        </div>
      </div>
      {actionMessage ? <p role="status" className="px-4 py-2 text-sm text-muted-foreground">{actionMessage}</p> : null}
      {actionError ? <p role="alert" className="px-4 py-2 text-sm text-destructive">{actionError}</p> : null}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {!focused ? <section
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
        </section> : null}
        <div className="mx-auto w-full max-w-3xl px-6 py-2">
          <RichEditor
            key={editorRevision}
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
    return "Unsaved draft"
  }

  return saveState === "saved"
    ? "Saved for this session"
    : "Saved version loaded"
}
