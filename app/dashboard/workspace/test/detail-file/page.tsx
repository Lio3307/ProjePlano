"use client"

import { useState, useRef } from "react"
import { RichEditor } from "@/components/dashboard/rich-editor"
import { Button } from "@/components/ui/button"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"

export default function DetailFilePage() {
  const [content, setContent] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 border-b px-4 py-2.5 shrink-0">
        <Button variant="ghost" size="icon" nativeButton={false} render={<Link href="/dashboard/workspace/test" />}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold truncate">Untitled Document</h1>
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
                  render={<Link href="/dashboard/workspace/test" />}
                >
                  Workspace
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="truncate">
                  Untitled Document
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <Button size="sm" onClick={() => console.log("Saved:", content)}>
          <Save />
          Save
        </Button>
      </div>
      <div ref={containerRef} className="flex-1 overflow-y-auto">
        <div className="max-w-3xl w-full mx-auto px-6 py-2">
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
