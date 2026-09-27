"use client"

import { ArrowUpRight, FolderPlus } from "lucide-react"
import Link from "next/link"
import { useShallow } from "zustand/react/shallow"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useProjectStore } from "@/features/project/store-provider"
import { selectProjectsByWorkspaceId } from "../selectors"

type ProjectListProps = {
  workspaceId: string
}

export function ProjectList({ workspaceId }: ProjectListProps) {
  const projects = useProjectStore(
    useShallow((state) =>
      selectProjectsByWorkspaceId(state, workspaceId)
    )
  )

  if (projects.length === 0) {
    return (
      <Card data-project-list-empty className="border-dashed">
        <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
          <span className="flex size-9 items-center justify-center rounded-full bg-muted">
            <FolderPlus
              aria-hidden="true"
              className="size-4 text-muted-foreground"
            />
          </span>
          <p className="text-base font-medium">No projects yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {projects.map((project) => (
        <Link
          key={project.id}
          href={
            "/dashboard/workspaces/" +
            project.workspaceId +
            "/projects/" +
            project.id
          }
          data-project-card={project.id}
          aria-label={"Open " + project.title}
          className="block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Card className="h-full rounded-md transition-colors hover:bg-muted/40">
            <CardHeader className="gap-2">
              <CardTitle className="text-lg font-semibold">
                <h3 className="wrap-anywhere">{project.title}</h3>
              </CardTitle>
              <CardDescription className="text-sm leading-6 wrap-anywhere">
                {project.description || "No description yet"}
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-auto flex flex-wrap items-center justify-between gap-3">
              <span className="rounded-sm bg-muted px-2 py-1 text-xs font-medium capitalize text-muted-foreground">
                {project.status}
              </span>
              <span className="text-xs text-muted-foreground">
                {project.viewIds.length} views / {project.resourceIds.length}{" "}
                resources
              </span>
              <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                Open project <ArrowUpRight className="size-4" aria-hidden="true" />
              </span>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
