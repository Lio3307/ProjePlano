"use client"

import {
  useRef,
  useState,
  type ComponentProps,
  type FormEvent,
} from "react"
import { Plus, Trash2 } from "lucide-react"

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
import {
  BOARD_LABEL_COLORS,
  type BoardLabel,
  type BoardLabelColor,
} from "@/features/project/board"
import { BOARD_LABEL_STYLES } from "@/features/work-item/components/work-item-meta"
import { cn } from "@/lib/utils"
import {
  cloneLabelCatalog,
  haveSameLabelCatalog,
  normalizeLabelCatalog,
} from "../label-form"

type DialogFinalFocus = ComponentProps<
  typeof DialogContent
>["finalFocus"]

type LabelManagerDialogProps = {
  open: boolean
  labels: readonly BoardLabel[]
  finalFocus: DialogFinalFocus
  onOpenChange: (open: boolean) => void
  onSave: (labels: BoardLabel[]) => boolean
}

export function LabelManagerDialog({
  open,
  labels,
  finalFocus,
  onOpenChange,
  onSave,
}: LabelManagerDialogProps) {
  const [draft, setDraft] = useState(() => cloneLabelCatalog(labels))
  const [labelName, setLabelName] = useState("")
  const [labelColor, setLabelColor] =
    useState<BoardLabelColor>("gray")
  const [error, setError] = useState<string | null>(null)
  const errorRef = useRef<HTMLParagraphElement | null>(null)

  function focusError(message: string) {
    setError(message)
    requestAnimationFrame(() => {
      errorRef.current?.focus()
    })
  }

  function handleAddLabel() {
    const name = labelName.trim()

    if (!name) {
      return
    }

    setDraft((current) => [
      ...current,
      {
        id: "label-" + crypto.randomUUID(),
        name,
        color: labelColor,
      },
    ])
    setLabelName("")
    setError(null)
  }

  function updateLabel(labelId: string, patch: Partial<BoardLabel>) {
    setDraft((current) =>
      current.map((label) =>
        label.id === labelId ? { ...label, ...patch } : label
      )
    )
    setError(null)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const normalized = normalizeLabelCatalog(draft)

    if (!normalized) {
      focusError("Use unique, non-empty label names and valid colors.")
      return
    }

    if (haveSameLabelCatalog(labels, normalized)) {
      focusError("Change at least one label before saving.")
      return
    }

    if (!onSave(normalized)) {
      focusError("The shared labels could not be saved.")
      return
    }

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        finalFocus={finalFocus}
        className="flex max-w-2xl flex-col overflow-hidden p-0"
      >
        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={handleSubmit}
        >
          <DialogHeader className="shrink-0 border-b bg-popover py-5 pl-6 pr-14">
            <DialogTitle>Set labels</DialogTitle>
            <DialogDescription>
              These labels are shared by tasks in every Board in this
              Kanban view.
            </DialogDescription>
          </DialogHeader>

          <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <div className="space-y-5">
              {draft.length > 0 ? (
                <ul className="space-y-2">
                  {draft.map((label) => (
                    <li
                      key={label.id}
                      className="grid gap-2 rounded-lg border bg-muted/20 p-2 sm:grid-cols-[minmax(0,1fr)_9rem_auto] sm:items-center"
                    >
                      <Input
                        value={label.name}
                        aria-label="Label name"
                        onChange={(event) =>
                          updateLabel(label.id, {
                            name: event.target.value,
                          })
                        }
                      />
                      <label className="grid gap-1 text-[0.625rem] text-muted-foreground">
                        Color
                        <select
                          value={label.color}
                          aria-label={"Color for " + (label.name || "label")}
                          className="h-7 rounded-md border border-input bg-transparent px-2 text-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                          onChange={(event) => {
                            const color = BOARD_LABEL_COLORS.find(
                              (candidate) =>
                                candidate === event.target.value
                            )

                            if (color) {
                              updateLabel(label.id, { color })
                            }
                          }}
                        >
                          {BOARD_LABEL_COLORS.map((color) => (
                            <option key={color} value={color}>
                              {capitalize(color)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={"Remove " + (label.name || "label")}
                        onClick={() => {
                          setDraft((current) =>
                            current.filter(
                              (candidate) => candidate.id !== label.id
                            )
                          )
                          setError(null)
                        }}
                      >
                        <Trash2 aria-hidden="true" />
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
                  No labels yet.
                </p>
              )}

              <div className="space-y-3 rounded-lg border p-3">
                <label className="grid gap-1.5 text-xs font-medium">
                  New label name
                  <Input
                    value={labelName}
                    placeholder="Release"
                    onChange={(event) => setLabelName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault()
                        handleAddLabel()
                      }
                    }}
                  />
                </label>

                <div
                  className="flex flex-wrap gap-2"
                  aria-label="Label color"
                >
                  {BOARD_LABEL_COLORS.map((color) => (
                    <Button
                      key={color}
                      type="button"
                      size="sm"
                      variant={
                        color === labelColor ? "secondary" : "outline"
                      }
                      aria-pressed={color === labelColor}
                      className="capitalize"
                      onClick={() => setLabelColor(color)}
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          "size-2 rounded-full",
                          BOARD_LABEL_STYLES[color]
                        )}
                      />
                      {color}
                    </Button>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  disabled={!labelName.trim()}
                  onClick={handleAddLabel}
                >
                  <Plus aria-hidden="true" />
                  Add label
                </Button>
              </div>

              <p
                ref={errorRef}
                role="alert"
                aria-live="polite"
                tabIndex={-1}
                className="min-h-5 text-xs text-destructive"
              >
                {error}
              </p>
            </div>
          </div>

          <DialogFooter className="shrink-0 border-t bg-popover px-6 py-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Save labels</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
