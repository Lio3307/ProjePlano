"use client"

import type { RefObject } from "react"
import { Search, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { BoardLabel } from "@/features/project/board"
import { createWorkItemFilters, type WorkItemFilters } from "../filters"
import { WORK_ITEM_PRIORITIES, WORK_ITEM_STATUSES } from "../model"
import {
  WORK_ITEM_PRIORITY_LABELS,
  WORK_ITEM_STATUS_LABELS,
} from "./work-item-meta"

type WorkItemFiltersToolbarProps = {
  value: WorkItemFilters
  labels: readonly BoardLabel[]
  matchingCount: number
  totalCount: number
  searchInputRef: RefObject<HTMLInputElement | null>
  onChange: (value: WorkItemFilters) => void
}

const SELECT_CLASS =
  "h-11 w-full min-w-0 rounded-md border border-input bg-background px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 md:text-sm dark:bg-input/30"

export function WorkItemFiltersToolbar({
  value,
  labels,
  matchingCount,
  totalCount,
  searchInputRef,
  onChange,
}: WorkItemFiltersToolbarProps) {
  const hasFilters =
    value.query.length > 0 ||
    value.labelId !== null ||
    value.priority !== null ||
    value.status !== null
  const labelWasRemoved =
    value.labelId !== null && !labels.some((label) => label.id === value.labelId)

  return (
    <section aria-label="Task filters" className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <label className="grid min-w-0 gap-1.5 text-sm font-medium">
          Search tasks
          <span className="relative">
            <Search aria-hidden="true" className="pointer-events-none absolute top-3.5 left-3 size-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              type="search"
              className="pl-9"
              placeholder="Search by title"
              autoComplete="off"
              value={value.query}
              onChange={(event) => onChange({ ...value, query: event.target.value })}
            />
          </span>
        </label>

        <label className="grid min-w-0 gap-1.5 text-sm font-medium">
          Label
          <select
            className={SELECT_CLASS}
            value={value.labelId ?? ""}
            onChange={(event) => onChange({
              ...value,
              labelId: labels.find((label) => label.id === event.target.value)?.id ?? null,
            })}
          >
            <option value="">All labels</option>
            {labelWasRemoved ? <option value={value.labelId ?? ""} disabled>Removed label</option> : null}
            {labels.map((label) => (
              <option key={label.id} value={label.id}>{label.name}</option>
            ))}
          </select>
        </label>

        <label className="grid min-w-0 gap-1.5 text-sm font-medium">
          Priority
          <select
            className={SELECT_CLASS}
            value={value.priority ?? ""}
            onChange={(event) => onChange({
              ...value,
              priority: WORK_ITEM_PRIORITIES.find((priority) => priority === event.target.value) ?? null,
            })}
          >
            <option value="">All priorities</option>
            {WORK_ITEM_PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>{WORK_ITEM_PRIORITY_LABELS[priority]}</option>
            ))}
          </select>
        </label>

        <label className="grid min-w-0 gap-1.5 text-sm font-medium">
          Status
          <select
            className={SELECT_CLASS}
            value={value.status ?? ""}
            onChange={(event) => onChange({
              ...value,
              status: WORK_ITEM_STATUSES.find((status) => status === event.target.value) ?? null,
            })}
          >
            <option value="">All statuses</option>
            {WORK_ITEM_STATUSES.map((status) => (
              <option key={status} value={status}>{WORK_ITEM_STATUS_LABELS[status]}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p role="status" aria-atomic="true" className="text-sm text-muted-foreground">
          {matchingCount} of {totalCount} project tasks
          {matchingCount === 0 && totalCount > 0 ? " · No matching tasks" : ""}
        </p>
        <Button
          type="button"
          variant="ghost"
          disabled={!hasFilters}
          onClick={() => {
            onChange(createWorkItemFilters())
            searchInputRef.current?.focus()
          }}
        >
          <X aria-hidden="true" />
          Clear filters
        </Button>
      </div>
    </section>
  )
}
