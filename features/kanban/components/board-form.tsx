"use client"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { TaskBoardFormValue } from "../form"

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
      <label className="grid gap-1.5 text-xs font-medium">
        Board name
        <Input
          required
          autoFocus
          autoComplete="off"
          value={value.title}
          placeholder="Todo"
          onChange={(event) => setField("title", event.target.value)}
        />
      </label>

      <label className="grid gap-1.5 text-xs font-medium">
        Description
        <Textarea
          value={value.description}
          placeholder="What belongs on this Board?"
          onChange={(event) =>
            setField("description", event.target.value)
          }
        />
      </label>
    </div>
  )
}
