"use client"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { setTaskBoardCompleted, type TaskBoardFormValue } from "../form"

type BoardFormProps = {
  value: TaskBoardFormValue
  onChange: (value: TaskBoardFormValue) => void
}

export function BoardForm({ value, onChange }: BoardFormProps) {
  function setField<Key extends keyof TaskBoardFormValue>(
    key: Key,
    nextValue: TaskBoardFormValue[Key]
  ) {
    onChange({ ...value, [key]: nextValue })
  }

  return (
    <div className="space-y-5">
      <label className="grid gap-1.5 text-sm font-medium">
        Board name
        <Input
          required
          autoFocus
          autoComplete="off"
          value={value.title}
          placeholder="Development"
          onChange={(event) => setField("title", event.target.value)}
        />
      </label>

      <label className="grid gap-1.5 text-sm font-medium">
        Description (optional)
        <Textarea
          value={value.description}
          placeholder="What belongs on this Board?"
          onChange={(event) =>
            setField("description", event.target.value)
          }
        />
      </label>
      <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm">
        <input
          type="checkbox"
          className="mt-1 size-4 accent-primary"
          checked={value.stage === "done"}
          onChange={(event) => onChange(setTaskBoardCompleted(value, event.target.checked))}
        />
        <span className="grid gap-1">
          <span className="font-medium">Completed board</span>
          <span className="text-muted-foreground">Tasks in this Board count as completed.</span>
        </span>
      </label>
    </div>
  )
}
