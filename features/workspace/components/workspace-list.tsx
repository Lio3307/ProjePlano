import {
  ArrowUpRight,
  EllipsisVertical,
  Pencil,
  Trash2,
  UsersRound,
} from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
                <p className="text-xs text-muted-foreground">
                  Created by {workspace.author}
                </p>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                  Open workspace
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                </span>
              </CardContent>
            </Card>
          </Link>

          <div className="absolute top-2 right-2 z-10">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={"Open actions for " + workspace.title}
                  />
                }
              >
                <EllipsisVertical aria-hidden="true" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  render={
                    <Link href={`/dashboard/workspaces/${workspace.id}/members`} />
                  }
                >
                  <UsersRound aria-hidden="true" /> Manage members
                </DropdownMenuItem>
                <DropdownMenuItem disabled>
                  <Pencil /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem variant="destructive" disabled>
                  <Trash2 /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      ))}
    </div>
  )
}
