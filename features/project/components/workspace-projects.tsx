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
        <h2 id="workspace-projects-title" className="text-lg font-semibold">
          Projects
        </h2>
        <NewProjectDialog workspaceId={workspaceId} />
      </div>
      <ProjectList workspaceId={workspaceId} />
    </section>
  )
}
