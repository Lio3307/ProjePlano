"use client"

import { useId } from "react"
import { Check, ChevronDown, FileText, Plus } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { ProjectDocumentResource } from "../model"
import { getProjectViewHref } from "../query-state"

type ProjectDocumentNavigationProps = {
  workspaceId: string
  projectId: string
  documents: readonly ProjectDocumentResource[]
  activeDocumentId?: string
  onAddDocument: (trigger: HTMLButtonElement) => void
}

export function ProjectDocumentNavigation({
  workspaceId,
  projectId,
  documents,
  activeDocumentId,
  onAddDocument,
}: ProjectDocumentNavigationProps) {
  const availableDocumentsId = useId()
  const activeDocument =
    documents.find((document) => document.id === activeDocumentId) ??
    documents[0]

  return (
    <div className="overflow-x-auto border-t px-4 py-2">
      <p id={availableDocumentsId} className="sr-only">
        Available documents:{" "}
        {documents.map((document) => document.title).join(", ")}
      </p>
      <nav
        aria-label="Documents"
        data-project-tab-strip="secondary"
        className="flex min-w-max divide-x border-y border-x"
      >
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                type="button"
                variant="secondary"
                className="w-56 justify-between rounded-none border-0 px-3"
                aria-label="Select document"
                aria-describedby={availableDocumentsId}
                data-document-switcher
              />
            }
          >
            <span className="flex min-w-0 items-center gap-2">
              <FileText aria-hidden="true" />
              <span className="truncate">
                {activeDocument?.title ?? "Select document"}
              </span>
            </span>
            <ChevronDown aria-hidden="true" />
          </DropdownMenuTrigger>

          <DropdownMenuContent align="start" className="w-64">
            {documents.map((document) => {
              const active = document.id === activeDocument?.id

              return (
                <DropdownMenuItem
                  key={document.id}
                  render={
                    <Link
                      href={getProjectViewHref(
                        workspaceId,
                        projectId,
                        "documents",
                        { resourceId: document.id }
                      )}
                      aria-current={active ? "page" : undefined}
                    />
                  }
                >
                  <FileText aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate">
                    {document.title}
                  </span>
                  {active ? (
                    <Check aria-hidden="true" className="ml-auto" />
                  ) : null}
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          type="button"
          variant="ghost"
          className="rounded-none border-0 px-3"
          data-new-document-trigger
          onClick={(event) => onAddDocument(event.currentTarget)}
        >
          <Plus aria-hidden="true" />
          New document
        </Button>
      </nav>
    </div>
  )
}
