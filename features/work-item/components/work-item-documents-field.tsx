"use client"

import { ChevronDown, FileText } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export type WorkItemDocumentOption = {
  id: string
  title: string
  href: string
}

interface WorkItemDocumentsFieldProps {
  documents: readonly WorkItemDocumentOption[]
  linkedResourceIds: string[]
  disabled?: boolean
  onChange: (resourceIds: string[]) => void
}

export function WorkItemDocumentsField({
  documents,
  linkedResourceIds,
  disabled,
  onChange,
}: WorkItemDocumentsFieldProps) {
  function updateDocument(resourceId: string, checked: boolean) {
    onChange(
      checked
        ? [...linkedResourceIds, resourceId]
        : linkedResourceIds.filter(
            (candidateId) => candidateId !== resourceId
          )
    )
  }

  return (
    <fieldset className="space-y-2" disabled={disabled}>
      <legend className="text-xs font-medium">Documents</legend>

      {documents.length > 0 ? (
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
              <FileText aria-hidden="true" />
              <span className="truncate">
                {linkedResourceIds.length === 0
                  ? "Link documents"
                  : `${linkedResourceIds.length} ${
                      linkedResourceIds.length === 1
                        ? "document"
                        : "documents"
                    } linked`}
              </span>
            </span>
            <ChevronDown aria-hidden="true" />
          </DropdownMenuTrigger>

          <DropdownMenuContent align="start">
            {documents.map((document) => (
              <DropdownMenuCheckboxItem
                key={document.id}
                checked={linkedResourceIds.includes(document.id)}
                closeOnClick={false}
                label={document.title}
                onCheckedChange={(checked) =>
                  updateDocument(document.id, checked)
                }
              >
                <span className="min-w-0 flex-1 truncate">
                  {document.title}
                </span>
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <p className="rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
          This project has no documents yet.
        </p>
      )}

      <p className="text-xs text-muted-foreground">
        Existing project documents can be linked to this task.
      </p>
    </fieldset>
  )
}
