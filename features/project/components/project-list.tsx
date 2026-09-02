"use client"

import { FolderPlus } from "lucide-react"
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
          <p className="font-medium">No projects yet</p>
          <p className="max-w-sm text-muted-foreground">
            Create a project from a programming template or start empty.
          </p>
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
          <Card className="h-full transition-colors hover:bg-muted/40">
            <CardHeader>
              <CardTitle>{project.title}</CardTitle>
              <CardDescription>
                {project.description || "No description yet"}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-3">
              <span className="rounded-full bg-muted px-2 py-0.5 text-[0.625rem] font-medium capitalize text-muted-foreground">
                {project.status}
              </span>
              <span className="text-muted-foreground">
                {project.viewIds.length} views / {project.resourceIds.length}{" "}
                resources
              </span>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
