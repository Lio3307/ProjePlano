import { useState } from "react"
import { Plus } from "lucide-react"
import { Popover } from "@base-ui/react/popover"

import { cn } from "@/lib/utils"
import {
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
import { ActionsMenu, EmptyLabel, Popup, PopupInput } from "./primitives"
import {
  STATUS_COLORS,
  type StatusColor,
  type StatusColumn,
  type StatusOption,
  type StatusOptionActions,
} from "../model"

function StatusBadge({ option }: { option: StatusOption }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium",
        STATUS_COLORS[option.color].badge
      )}
    >
      {option.label}
    </span>
  )
}

type StatusCellProps = {
  column: StatusColumn
  value: string
  label: string
  actions: StatusOptionActions
  onChange: (value: string) => void
}

export function StatusCell({
  column,
  value,
  label,
  actions,
  onChange,
}: StatusCellProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")

  const selected = column.options.find((option) => option.id === value)
  const search = query.trim().toLowerCase()
  const matches = search
    ? column.options.filter((option) =>
        option.label.toLowerCase().includes(search)
      )
    : column.options
  const canCreate =
    search.length > 0 &&
    !column.options.some((option) => option.label.toLowerCase() === search)

  const select = (optionId: string) => {
    onChange(optionId)
    setQuery("")
    setOpen(false)
  }

  const createAndSelect = () => select(actions.add(column.id, query.trim()).id)

  return (
    <Popover.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setQuery("")
      }}
    >
      <Popover.Trigger
        aria-label={label}
        className="flex h-9 w-full items-center rounded-sm px-2 outline-none focus-visible:ring-1 focus-visible:ring-ring/70"
      >
        {selected ? <StatusBadge option={selected} /> : <EmptyLabel />}
      </Popover.Trigger>

      <Popup>
        <div className="p-1">
          <PopupInput
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return
              if (canCreate) createAndSelect()
              else if (matches[0]) select(matches[0].id)
            }}
            placeholder="Search or create..."
            aria-label="Search or create an option"
          />
        </div>

        <div className="max-h-48 overflow-y-auto overscroll-y-contain p-1">
          {matches.map((option) => (
            <div key={option.id} className="group flex items-center">
              <button
                type="button"
                onClick={() => select(option.id)}
                className="flex h-7 flex-1 items-center rounded-md px-1.5 text-left transition-colors hover:bg-accent"
              >
                <StatusBadge option={option} />
              </button>
              <ActionsMenu
                triggerLabel={`Edit option ${option.label}`}
                deleteLabel="Delete option"
                triggerClassName="size-5"
                onDelete={() => actions.remove(column.id, option.id)}
              >
                <DropdownMenuRadioGroup
                  value={option.color}
                  onValueChange={(color) =>
                    actions.setColor(column.id, option.id, color as StatusColor)
                  }
                >
                  {Object.entries(STATUS_COLORS).map(
                    ([color, { label: colorLabel, dot }]) => (
                      <DropdownMenuRadioItem key={color} value={color}>
                        <span className={cn("size-2.5 rounded-full", dot)} />
                        {colorLabel}
                      </DropdownMenuRadioItem>
                    )
                  )}
                </DropdownMenuRadioGroup>
              </ActionsMenu>
            </div>
          ))}

          {matches.length === 0 && !canCreate ? (
            <p className="px-2 py-1.5 text-xs text-muted-foreground">
              No options
            </p>
          ) : null}

          {canCreate ? (
            <button
              type="button"
              onClick={createAndSelect}
              className="flex h-7 w-full items-center gap-1.5 rounded-md px-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Plus className="size-3.5" />
              Create
              <span className="truncate font-medium text-foreground">
                &ldquo;{query.trim()}&rdquo;
              </span>
            </button>
          ) : null}
        </div>
      </Popup>
    </Popover.Root>
  )
}
