"use client"

import { NewProjectDialog } from "./new-project-dialog"
import { ProjectList } from "./project-list"

export function WorkspaceProjects({
  workspaceId,
}: {
  workspaceId: string
}) {
  return (
    <section aria-labelledby="workspace-projects-title" className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 id="workspace-projects-title" className="font-semibold">
            Projects
          </h2>
          <p className="text-sm text-muted-foreground">
            Plan programming work with views and project resources.
          </p>
        </div>
        <NewProjectDialog workspaceId={workspaceId} />
      </div>
      <ProjectList workspaceId={workspaceId} />
    </section>
  )
}
