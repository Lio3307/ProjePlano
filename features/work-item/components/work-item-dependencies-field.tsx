"use client"

import { ChevronDown, Link2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { wouldAcceptDependencySelection } from "../dependencies"
import type { WorkItem } from "../model"
import { WorkItemStatusBadge } from "./work-item-meta"

interface WorkItemDependenciesFieldProps {
  projectId: string
  workItemId: string | null
  workItems: readonly WorkItem[]
  value: string[]
  disabled?: boolean
  onChange: (dependencyIds: string[]) => void
}

export function WorkItemDependenciesField({
  projectId,
  workItemId,
  workItems,
  value,
  disabled,
  onChange,
}: WorkItemDependenciesFieldProps) {
  const workItemsById = Object.fromEntries(
    workItems.map((workItem) => [workItem.id, workItem])
  )
  const candidates = workItems.filter(
    (workItem) =>
      workItem.projectId === projectId && workItem.id !== workItemId
  )
  const selectedWorkItems = value.flatMap((dependencyId) => {
    const dependency = workItemsById[dependencyId]

    return dependency?.projectId === projectId ? [dependency] : []
  })

  function updateDependency(dependencyId: string, checked: boolean) {
    const dependencyIds = checked
      ? [...value, dependencyId]
      : value.filter((candidateId) => candidateId !== dependencyId)

    if (
      wouldAcceptDependencySelection(
        workItemsById,
        workItemId,
        projectId,
        dependencyIds
      )
    ) {
      onChange(dependencyIds)
    }
  }

  return (
    <fieldset className="space-y-2" disabled={disabled}>
      <legend className="text-xs font-medium">Dependencies</legend>

      {candidates.length > 0 ? (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                type="button"
                variant="outline"
                className="w-full justify-between"
              />
            }
          >
            <span className="inline-flex min-w-0 items-center gap-2">
              <Link2 aria-hidden="true" />
              <span className="truncate">
                {value.length === 0
                  ? "Add dependencies"
                  : `${value.length} ${
                      value.length === 1
                        ? "dependency"
                        : "dependencies"
                    } selected`}
              </span>
            </span>
            <ChevronDown aria-hidden="true" />
          </DropdownMenuTrigger>

          <DropdownMenuContent align="start">
            {candidates.map((candidate) => {
              const checked = value.includes(candidate.id)
              const createsCycle =
                !checked &&
                !wouldAcceptDependencySelection(
                  workItemsById,
                  workItemId,
                  projectId,
                  [...value, candidate.id]
                )

              return (
                <DropdownMenuCheckboxItem
                  key={candidate.id}
                  checked={checked}
                  disabled={createsCycle}
                  closeOnClick={false}
                  label={candidate.title}
                  onCheckedChange={(nextChecked) =>
                    updateDependency(candidate.id, nextChecked)
                  }
                >
                  <span className="min-w-0 flex-1 truncate">
                    {candidate.title}
                  </span>
                  {createsCycle ? (
                    <span className="shrink-0 text-[10px] text-destructive">
                      Creates a cycle
                    </span>
                  ) : (
                    <WorkItemStatusBadge status={candidate.status} />
                  )}
                </DropdownMenuCheckboxItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <p className="rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
          No other tasks available.
        </p>
      )}

      {selectedWorkItems.length > 0 ? (
        <ul className="space-y-2" aria-label="Selected dependencies">
          {selectedWorkItems.map((dependency) => (
            <li
              key={dependency.id}
              className="flex items-center gap-2 rounded-md border px-2 py-1.5"
            >
              <span className="min-w-0 flex-1 truncate text-xs">
                {dependency.title}
              </span>
              <WorkItemStatusBadge status={dependency.status} />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={"Remove dependency " + dependency.title}
                onClick={() => updateDependency(dependency.id, false)}
              >
                <X aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}

      <p className="text-xs text-muted-foreground">
        Select tasks that must be completed first.
      </p>
    </fieldset>
  )
}
