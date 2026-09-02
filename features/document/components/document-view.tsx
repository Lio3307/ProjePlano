"use client"

import { useRef, useState } from "react"
import { Save } from "lucide-react"

import { Button } from "@/components/ui/button"

import { RichEditor } from "./rich-editor"

interface DocumentViewProps {
  resourceTitle: string
}

export function DocumentView({ resourceTitle }: DocumentViewProps) {
  const [content, setContent] = useState("")
  const savedContentRef = useRef(content)

  function handleSave() {
    savedContentRef.current = content
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
        <Button type="button" size="sm" onClick={handleSave}>
          <Save aria-hidden="true" />
          Save
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-6 py-2">
          <RichEditor
            content={content}
            onChange={setContent}
            placeholder="Type / to insert blocks..."
          />
        </div>
      </div>
    </div>
  )
}
