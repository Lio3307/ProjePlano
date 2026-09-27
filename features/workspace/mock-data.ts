import type { Workspace } from "./types"

export const WORKSPACES: Workspace[] = [
  {
    id: "project-alpha",
    title: "Project Alpha",
    description: "Frontend revamp",
    createdAt: "2026-03-12",
  },
  {
    id: "project-beta",
    title: "Project Beta",
    description: "API migration",
    createdAt: "2026-03-12",
  },
  {
    id: "project-gamma",
    title: "Project Gamma",
    description: "Design system",
    createdAt: "2026-03-12",
  },
  {
    id: "project-delta",
    title: "Project Delta",
    description: "Mobile app",
    createdAt: "2026-03-12",
  },
  {
    id: "project-echo",
    title: "Project Echo",
    description: "Data pipeline",
    createdAt: "2026-03-12",
  },
  {
    id: "project-foxtrot",
    title: "Project Foxtrot",
    description: "Docs portal",
    createdAt: "2026-03-12",
  },
]

export function getWorkspaceById(id: string) {
  return WORKSPACES.find((workspace) => workspace.id === id)
}
