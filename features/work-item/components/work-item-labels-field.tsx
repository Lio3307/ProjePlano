"use client"

import { ChevronDown, Tags } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { BoardLabel } from "@/features/project/board"
import { cn } from "@/lib/utils"
import { BOARD_LABEL_STYLES } from "./work-item-meta"

interface WorkItemLabelsFieldProps {
  labels: readonly BoardLabel[]
  value: string[]
  disabled?: boolean
  onChange: (labelIds: string[]) => void
}

export function WorkItemLabelsField({
  labels,
  value,
  disabled,
  onChange,
}: WorkItemLabelsFieldProps) {
  function updateLabel(labelId: string, checked: boolean) {
    onChange(
      checked
        ? [...value, labelId]
        : value.filter((candidateId) => candidateId !== labelId)
    )
  }

  return (
    <fieldset className="space-y-2" disabled={disabled}>
      <legend className="text-xs font-medium">Labels</legend>

      {labels.length > 0 ? (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                type="button"
                variant="outline"
                className="w-full justify-between"
                disabled={disabled}
              />
            }
          >
            <span className="inline-flex min-w-0 items-center gap-2">
              <Tags aria-hidden="true" />
              <span className="truncate">
                {value.length === 0
                  ? "Select labels"
                  : `${value.length} ${
                      value.length === 1 ? "label" : "labels"
                    } selected`}
              </span>
            </span>
            <ChevronDown aria-hidden="true" />
          </DropdownMenuTrigger>

          <DropdownMenuContent align="start">
            {labels.map((label) => (
              <DropdownMenuCheckboxItem
                key={label.id}
                checked={value.includes(label.id)}
                closeOnClick={false}
                label={label.name}
                onCheckedChange={(checked) =>
                  updateLabel(label.id, checked)
                }
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "size-2 shrink-0 rounded-full",
                    BOARD_LABEL_STYLES[label.color]
                  )}
                />
                <span className="truncate">{label.name}</span>
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <p className="rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
          Use Set labels above the Board list before assigning labels to
          tasks.
        </p>
      )}
    </fieldset>
  )
}
