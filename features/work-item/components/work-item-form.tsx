"use client"

import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { WorkItemFormValue } from "../form"
import {
  WORK_ITEM_PRIORITIES,
  WORK_ITEM_STATUSES,
  WORK_ITEM_TYPES,
} from "../model"
import {
  WORK_ITEM_PRIORITY_LABELS,
  WORK_ITEM_STATUS_LABELS,
  WORK_ITEM_TYPE_LABELS,
} from "./work-item-meta"

interface WorkItemFormProps {
  value: WorkItemFormValue
  disabled?: boolean
  onChange: (value: WorkItemFormValue) => void
}

const CONTROL_CLASS =
  "h-7 w-full rounded-md border border-input bg-input/20 px-2 text-xs/relaxed outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"

export function WorkItemForm({
  value,
  disabled,
  onChange,
}: WorkItemFormProps) {
  const [checklistLabel, setChecklistLabel] = useState("")

  function setField<Key extends keyof WorkItemFormValue>(
    key: Key,
    nextValue: WorkItemFormValue[Key]
  ) {
    onChange({ ...value, [key]: nextValue })
  }

  function handleAddChecklistItem() {
    const label = checklistLabel.trim()

    if (!label) {
      return
    }

    setField("checklist", [
      ...value.checklist,
      {
        id: crypto.randomUUID(),
        label,
        completed: false,
      },
    ])
    setChecklistLabel("")
  }

  function updateChecklistItem(
    itemId: string,
    patch: Partial<WorkItemFormValue["checklist"][number]>
  ) {
    setField(
      "checklist",
      value.checklist.map((item) =>
        item.id === itemId ? { ...item, ...patch } : item
      )
    )
  }

  return (
    <div className="space-y-5">
      <label className="grid gap-1.5 text-xs font-medium">
        Title
        <Input
          required
          autoFocus
          autoComplete="off"
          value={value.title}
          disabled={disabled}
          onChange={(event) => setField("title", event.target.value)}
        />
      </label>

      <label className="grid gap-1.5 text-xs font-medium">
        Description
        <Textarea
          value={value.description}
          disabled={disabled}
          placeholder="What needs to be done?"
          onChange={(event) =>
            setField("description", event.target.value)
          }
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="grid gap-1.5 text-xs font-medium">
          Type
          <select
            className={CONTROL_CLASS}
            value={value.type}
            disabled={disabled}
            onChange={(event) => {
              const type = WORK_ITEM_TYPES.find(
                (candidate) => candidate === event.target.value
              )

              if (type) {
                setField("type", type)
              }
            }}
          >
            {WORK_ITEM_TYPES.map((type) => (
              <option key={type} value={type}>
                {WORK_ITEM_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1.5 text-xs font-medium">
          Status
          <select
            className={CONTROL_CLASS}
            value={value.status}
            disabled={disabled}
            onChange={(event) => {
              const status = WORK_ITEM_STATUSES.find(
                (candidate) => candidate === event.target.value
              )

              if (status) {
                setField("status", status)
              }
            }}
          >
            {WORK_ITEM_STATUSES.map((status) => (
              <option key={status} value={status}>
                {WORK_ITEM_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1.5 text-xs font-medium">
          Priority
          <select
            className={CONTROL_CLASS}
            value={value.priority}
            disabled={disabled}
            onChange={(event) => {
              const priority = WORK_ITEM_PRIORITIES.find(
                (candidate) => candidate === event.target.value
              )

              if (priority) {
                setField("priority", priority)
              }
            }}
          >
            {WORK_ITEM_PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {WORK_ITEM_PRIORITY_LABELS[priority]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="grid gap-1.5 text-xs font-medium">
          Assignee
          <Input
            value={value.assigneeName}
            disabled={disabled}
            placeholder="Name"
            onChange={(event) =>
              setField("assigneeName", event.target.value)
            }
          />
        </label>

        <label className="grid gap-1.5 text-xs font-medium">
          Due date
          <Input
            type="date"
            value={value.dueDate}
            disabled={disabled}
            onChange={(event) => setField("dueDate", event.target.value)}
          />
        </label>

        <label className="grid gap-1.5 text-xs font-medium">
          Estimate
          <Input
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            value={value.estimate}
            disabled={disabled}
            placeholder="Story points"
            onChange={(event) => setField("estimate", event.target.value)}
          />
        </label>
      </div>

      <label className="grid gap-1.5 text-xs font-medium">
        Labels
        <Input
          value={value.labels}
          disabled={disabled}
          placeholder="Frontend, API"
          onChange={(event) => setField("labels", event.target.value)}
        />
        <span className="font-normal text-muted-foreground">
          Separate labels with commas.
        </span>
      </label>

      <fieldset className="space-y-3" disabled={disabled}>
        <legend className="text-xs font-medium">Checklist</legend>
        <ul className="space-y-2">
          {value.checklist.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-2 rounded-lg bg-muted/50 p-2"
            >
              <input
                type="checkbox"
                checked={item.completed}
                aria-label={"Mark " + item.label + " complete"}
                onChange={(event) =>
                  updateChecklistItem(item.id, {
                    completed: event.target.checked,
                  })
                }
              />
              <Input
                value={item.label}
                aria-label="Checklist item"
                onChange={(event) =>
                  updateChecklistItem(item.id, {
                    label: event.target.value,
                  })
                }
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={"Remove " + item.label}
                onClick={() =>
                  setField(
                    "checklist",
                    value.checklist.filter(
                      (candidate) => candidate.id !== item.id
                    )
                  )
                }
              >
                <Trash2 aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>

        <div className="flex gap-2">
          <Input
            value={checklistLabel}
            placeholder="New checklist item"
            aria-label="New checklist item"
            onChange={(event) => setChecklistLabel(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault()
                handleAddChecklistItem()
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            disabled={!checklistLabel.trim()}
            onClick={handleAddChecklistItem}
          >
            <Plus aria-hidden="true" />
            Add
          </Button>
        </div>
      </fieldset>
    </div>
  )
}
