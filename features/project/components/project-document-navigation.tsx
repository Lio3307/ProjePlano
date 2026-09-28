"use client"

import { useId, useMemo, useRef, useState } from "react"
import { Check, ChevronDown, FileText, Plus } from "lucide-react"
import { DocumentNavigationLink as Link } from "@/features/document/components/document-navigation"
import { getDocumentText, matchesDocumentSearch } from "@/features/document/content"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

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
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState("")
  const searchTrigger = useRef<HTMLButtonElement>(null)
  const searchable = useMemo(() => searchOpen ? documents.map(document => ({
    document, text: getDocumentText(document.content),
  })) : [], [documents, searchOpen])
  const matches = searchable.filter(({ document, text }) => matchesDocumentSearch(document.title, text, query))
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
        <Button ref={searchTrigger} variant="ghost" className="rounded-none border-0 px-3"
          onClick={() => { setQuery(""); setSearchOpen(true) }}>Search documents</Button>
      </nav>
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent finalFocus={searchTrigger} className="flex max-w-xl flex-col overflow-hidden p-0">
          <DialogHeader className="shrink-0 border-b py-5 pl-6 pr-14"><DialogTitle>Search documents</DialogTitle></DialogHeader>
          <div className="no-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
            <Input autoFocus aria-label="Search document titles and saved content" placeholder="Search titles and saved content…"
              value={query} onChange={event => setQuery(event.target.value)} />
            <p role="status" className="text-sm text-muted-foreground">{matches.length} documents found</p>
            <ul className="space-y-2">
              {matches.map(({ document, text }) => <li key={document.id}>
                <Link href={getProjectViewHref(workspaceId, projectId, "documents", { resourceId: document.id })}
                  onClick={() => setSearchOpen(false)} className="block rounded-md border p-3 hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring">
                  <p className="font-medium wrap-anywhere">{document.title}</p>
                  <p className="line-clamp-2 text-sm text-muted-foreground wrap-anywhere">{text || "Empty document"}</p>
                </Link>
              </li>)}
            </ul>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
