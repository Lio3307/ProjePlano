"use client"

import { ArrowUpRight, FolderPlus } from "lucide-react"
import { useState } from "react"
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
import { Button } from "@/components/ui/button"
import { selectProjectsByWorkspaceId } from "../selectors"
import { ProjectActions } from "./project-actions"

type ProjectListProps = {
  workspaceId: string
}

export function ProjectList({ workspaceId }: ProjectListProps) {
  const [showArchived, setShowArchived] = useState(false)
  const allProjects = useProjectStore(
    useShallow((state) =>
      selectProjectsByWorkspaceId(state, workspaceId)
    )
  )

  const projects = allProjects.filter(project => project.archived === showArchived)
  const archivedCount = allProjects.filter(project => project.archived).length

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2" aria-label="Project archive filter">
        <Button variant={!showArchived ? "secondary" : "ghost"} aria-pressed={!showArchived} onClick={() => setShowArchived(false)}>
          Projects ({allProjects.length - archivedCount})
        </Button>
        <Button variant={showArchived ? "secondary" : "ghost"} aria-pressed={showArchived} onClick={() => setShowArchived(true)}>
          Archived ({archivedCount})
        </Button>
      </div>
      {projects.length === 0 ? (
        <Card data-project-list-empty className="border-dashed">
          <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
            <span className="flex size-9 items-center justify-center rounded-full bg-muted">
              <FolderPlus
                aria-hidden="true"
                className="size-4 text-muted-foreground"
              />
            </span>
            <p className="text-base font-medium">{showArchived ? "No archived projects" : "No projects yet"}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <div key={project.id} className="relative">
              <Link
                href={
                  "/dashboard/workspaces/" +
                  project.workspaceId +
                  "/projects/" +
                  project.id
                }
                data-project-card={project.id}
                aria-label={"Open " + project.title}
                className="block h-full rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <Card className="h-full rounded-md transition-colors hover:bg-muted/40">
                  <CardHeader className="gap-2 pr-16">
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
              <div className="absolute top-2 right-2">
                <ProjectActions project={project} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
