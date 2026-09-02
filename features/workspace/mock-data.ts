import type { Workspace } from "./types"

export const WORKSPACES: Workspace[] = [
  {
    id: "project-alpha",
    title: "Project Alpha",
    author: "Aurelio",
    description: "Frontend revamp",
    createdAt: "2026-03-12",
  },
  {
    id: "project-beta",
    title: "Project Beta",
    author: "Sari",
    description: "API migration",
    createdAt: "2026-03-12",
  },
  {
    id: "project-gamma",
    title: "Project Gamma",
    author: "Budi",
    description: "Design system",
    createdAt: "2026-03-12",
  },
  {
    id: "project-delta",
    title: "Project Delta",
    author: "Citra",
    description: "Mobile app",
    createdAt: "2026-03-12",
  },
  {
    id: "project-echo",
    title: "Project Echo",
    author: "Dewi",
    description: "Data pipeline",
    createdAt: "2026-03-12",
  },
  {
    id: "project-foxtrot",
    title: "Project Foxtrot",
    author: "Eko",
    description: "Docs portal",
    createdAt: "2026-03-12",
  },
]

export function getWorkspaceById(id: string) {
  return WORKSPACES.find((workspace) => workspace.id === id)
}
