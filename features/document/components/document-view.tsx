"use client"

import { useRef, useState } from "react"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import type { Project } from "@/features/project/types"
import type { Workspace } from "@/features/workspace/types"

import { RichEditor } from "./rich-editor"

interface DocumentViewProps {
  workspace: Workspace
  project: Project
}

export function DocumentView({ workspace, project }: DocumentViewProps) {
  const [content, setContent] = useState("")
  const savedContentRef = useRef(content)

  function handleSave() {
    savedContentRef.current = content
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b px-4 py-2.5">
        <Button
          variant="ghost"
          size="icon"
          nativeButton={false}
          render={<Link href={`/dashboard/workspaces/${workspace.id}`} />}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-semibold">{project.title}</h1>
          <Breadcrumb>
            <BreadcrumbList className="flex-nowrap">
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link href="/dashboard" />}>
                  Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink
                  render={<Link href={`/dashboard/workspaces/${workspace.id}`} />}
                >
                  {workspace.title}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="truncate">
                  {project.title}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <Button size="sm" onClick={handleSave}>
          <Save />
          Save
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-6 py-2">
          <RichEditor
            content={content}
            onChange={setContent}
            placeholder="Type / to insert blocks..."
          />
        </div>
      </div>
    </div>
  )
}
