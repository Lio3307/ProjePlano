import { EllipsisVertical, Pencil, Trash2 } from "lucide-react"
import Link from "next/link"

import {
  Card,
  CardAction,
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
import { WorkspacePagination } from "./workspace-pagination"

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
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {workspaces.map((workspace) => (
          <Link
            key={workspace.id}
            href={`/dashboard/workspaces/${workspace.id}`}
            className="contents"
          >
            <Card className="hover:cursor-pointer">
              <CardHeader>
                <CardTitle>{workspace.title}</CardTitle>
                <CardDescription>{workspace.description}</CardDescription>
                <CardAction>
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <EllipsisVertical className="size-[18px]" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Pencil /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem variant="destructive">
                        <Trash2 /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardAction>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  BY {workspace.author}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      <WorkspacePagination />
    </>
  )
}
