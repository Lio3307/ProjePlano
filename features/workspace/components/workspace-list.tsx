import { ArrowUpRight } from "lucide-react"
import Link from "next/link"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { WorkspaceActions } from "./workspace-actions"
import type { Workspace } from "../types"

type WorkspaceListProps = {
  workspaces: Workspace[]
}

export function WorkspaceList({ workspaces }: WorkspaceListProps) {
  if (workspaces.length === 0) {
    return (
      <div className="flex items-center justify-center">
        <p className="text-lg text-muted-foreground">No workspaces found</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {workspaces.map((workspace) => (
        <div key={workspace.id} className="relative">
          <Link
            href={`/dashboard/workspaces/${workspace.id}`}
            aria-label={"Open " + workspace.title}
            className="block h-full rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Card className="h-full min-h-52 rounded-md transition-colors hover:bg-muted/40">
              <CardHeader className="gap-2 pr-16">
                <p className="text-xs text-muted-foreground">Workspace</p>
                <CardTitle className="text-lg font-semibold">
                  <h2 className="wrap-anywhere">{workspace.title}</h2>
                </CardTitle>
                <CardDescription className="text-sm leading-6">
                  {workspace.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
                <time
                  dateTime={workspace.createdAt}
                  className="text-xs text-muted-foreground"
                >
                  Created {workspace.createdAt}
                </time>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                  Open workspace
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                </span>
              </CardContent>
            </Card>
          </Link>

          <div className="absolute top-2 right-2 z-10">
            <WorkspaceActions workspace={workspace} />
          </div>
        </div>
      ))}
    </div>
  )
}
