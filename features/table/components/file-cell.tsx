import { useRef, useState } from "react"
import Image from "next/image"
import { File, Link2, Plus, Upload } from "lucide-react"
import { Popover } from "@base-ui/react/popover"

import { cn } from "@/lib/utils"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import {
  ActionsMenu,
  EmptyLabel,
  IconButton,
  Popup,
  PopupInput,
  PopupItem,
} from "./primitives"
import {
  newId,
  parseLink,
  revokeAttachment,
  type FileAttachment,
} from "../model"

type AttachmentChipProps = {
  file: FileAttachment
  onRename: (name: string) => void
  onRemove: () => void
}

function AttachmentChip({ file, onRename, onRemove }: AttachmentChipProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(file.name)

  const isImage = file.kind === "file" && file.type.startsWith("image/")

  const commitRename = () => {
    const name = draft.trim()
    if (name) onRename(name)
    setEditing(false)
  }

  return (
    <span className="flex h-6 max-w-44 shrink-0 items-center gap-1.5 rounded-md bg-muted pr-1 pl-1.5 text-xs">
      {isImage ? (
        <Image
          src={file.url}
          alt=""
          width={16}
          height={16}
          className="size-4 shrink-0 rounded-sm object-cover"
        />
      ) : file.kind === "link" ? (
        <Link2 className="size-3.5 shrink-0 text-muted-foreground" />
      ) : (
        <File className="size-3.5 shrink-0 text-muted-foreground" />
      )}

      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commitRename}
          onKeyDown={(event) => {
            if (event.key === "Enter") commitRename()
            if (event.key === "Escape") {
              setDraft(file.name)
              setEditing(false)
            }
          }}
          aria-label={`Rename ${file.name}`}
          className="h-5 w-24 rounded-sm bg-background px-0.5 text-xs outline-none ring-1 ring-ring/70"
        />
      ) : (
        <a
          href={file.url}
          target="_blank"
          rel="noreferrer"
          className="truncate hover:underline"
        >
          {file.name}
        </a>
      )}

      <ActionsMenu
        triggerLabel={`Actions for ${file.name}`}
        deleteLabel="Remove"
        triggerClassName="size-5"
        onDelete={onRemove}
      >
        <DropdownMenuItem
          onClick={() => {
            setDraft(file.name)
            setEditing(true)
          }}
        >
          Rename
        </DropdownMenuItem>
      </ActionsMenu>
    </span>
  )
}

type FileCellProps = {
  value: FileAttachment[]
  label: string
  onChange: (value: FileAttachment[]) => void
}

export function FileCell({ value, label, onChange }: FileCellProps) {
  const pickerRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<"menu" | "link">("menu")
  const [linkUrl, setLinkUrl] = useState("")
  const [linkError, setLinkError] = useState(false)

  const reset = () => {
    setMode("menu")
    setLinkUrl("")
    setLinkError(false)
  }

  const addFiles = (files: FileList | null) => {
    if (!files?.length) return
    onChange([
      ...value,
      ...Array.from(files, (file) => ({
        id: newId(),
        name: file.name,
        type: file.type,
        url: URL.createObjectURL(file),
        kind: "file" as const,
      })),
    ])
  }

  const addLink = () => {
    const parsed = parseLink(linkUrl)
    if (!parsed) {
      setLinkError(true)
      return
    }
    onChange([
      ...value,
      { id: newId(), name: parsed.name, type: "", url: parsed.url, kind: "link" },
    ])
    reset()
    setOpen(false)
  }

  const removeFile = (id: string) => {
    const target = value.find((file) => file.id === id)
    if (target) revokeAttachment(target)
    onChange(value.filter((file) => file.id !== id))
  }

  return (
    <div className="flex h-9 items-center gap-1 px-2">
      {value.length > 0 ? (
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
          {value.map((file) => (
            <AttachmentChip
              key={file.id}
              file={file}
              onRename={(name) =>
                onChange(
                  value.map((item) =>
                    item.id === file.id ? { ...item, name } : item
                  )
                )
              }
              onRemove={() => removeFile(file.id)}
            />
          ))}
        </div>
      ) : null}

      <Popover.Root
        open={open}
        onOpenChange={(next) => {
          if (!next) reset()
          setOpen(next)
        }}
      >
        {value.length === 0 ? (
          <Popover.Trigger
            aria-label={label}
            className="flex h-7 w-full items-center px-1 text-left text-sm"
          >
            <EmptyLabel />
          </Popover.Trigger>
        ) : (
          <Popover.Trigger
            aria-label={label}
            render={<IconButton reveal className="shrink-0" />}
          >
            <Plus className="size-4" />
          </Popover.Trigger>
        )}

        <Popup>
          {mode === "menu" ? (
            <>
              <PopupItem
                onClick={() => {
                  setOpen(false)
                  pickerRef.current?.click()
                }}
              >
                <Upload className="size-3.5" />
                Upload file
              </PopupItem>
              <PopupItem onClick={() => setMode("link")}>
                <Link2 className="size-3.5" />
                Embed link
              </PopupItem>
            </>
          ) : (
            <div>
              <div className="flex items-center gap-1">
                <PopupInput
                  autoFocus
                  value={linkUrl}
                  onChange={(event) => {
                    setLinkUrl(event.target.value)
                    setLinkError(false)
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") addLink()
                  }}
                  placeholder="https://..."
                  aria-label="Link URL"
                  aria-invalid={linkError}
                  className={cn("flex-1", linkError && "ring-1 ring-destructive")}
                />
                <button
                  type="button"
                  onClick={addLink}
                  disabled={!linkUrl.trim()}
                  className="h-7 shrink-0 rounded-md bg-primary px-2 text-xs font-medium text-primary-foreground transition-opacity disabled:opacity-50"
                >
                  Add
                </button>
              </div>
              {linkError ? (
                <p className="px-1 pt-1 text-[0.6875rem] text-destructive">
                  Enter a valid URL
                </p>
              ) : null}
            </div>
          )}
        </Popup>
      </Popover.Root>

      <input
        ref={pickerRef}
        type="file"
        multiple
        tabIndex={-1}
        aria-hidden="true"
        className="hidden"
        onChange={(event) => {
          addFiles(event.target.files)
          event.target.value = ""
        }}
      />
    </div>
  )
}
