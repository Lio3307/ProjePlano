import Link from "next/link"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { PROJECT_TYPE_LABELS, type Project } from "../types"

type ProjectListProps = {
  workspaceId: string
  projects: Project[]
}

export function ProjectList({ workspaceId, projects }: ProjectListProps) {
  if (projects.length === 0) {
    return <p className="text-sm text-muted-foreground">No projects found</p>
  }

  return projects.map((project) => (
    <Link
      key={project.id}
      href={`/dashboard/workspaces/${workspaceId}/projects/${project.id}`}
      className="contents"
    >
      <Card className="hover:cursor-pointer">
        <CardHeader>
          <CardTitle>{project.title}</CardTitle>
          <CardDescription>
            Type: {PROJECT_TYPE_LABELS[project.type]}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            By: {project.author}
          </p>
        </CardContent>
      </Card>
    </Link>
  ))
}
