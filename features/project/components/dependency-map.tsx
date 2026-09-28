"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { buildDependencyGraph, traceDependencyPath } from "../dependency-graph"
import type { ProjectWorkspaceState } from "../model"

type DependencyMapProps = {
  state: ProjectWorkspaceState
  projectId: string
  onOpenTask: (id: string) => void
}

const NODE_WIDTH = 184
const NODE_HEIGHT = 68
const COLUMN_GAP = 48
const ROW_GAP = 24

export function DependencyMap({ state, projectId, onOpenTask }: DependencyMapProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const tasks = Object.values(state.workItemsById).filter(task => task.projectId === projectId)
    .sort((a, b) => a.title.localeCompare(b.title) || a.id.localeCompare(b.id))
  if (tasks.length === 0) return <p className="text-sm text-muted-foreground">No tasks to map yet.</p>

  const byId = new Map(tasks.map(task => [task.id, task]))
  const { predecessors, successors, levels } = buildDependencyGraph(tasks)
  const columns = new Map<number, string[]>()
  for (const task of tasks) {
    const level = levels.get(task.id) ?? 0
    columns.set(level, [...(columns.get(level) ?? []), task.id])
  }
  const positions = new Map<string, { x: number; y: number }>()
  for (const [level, ids] of columns) ids.forEach((id, index) => positions.set(id, {
    x: level * (NODE_WIDTH + COLUMN_GAP), y: index * (NODE_HEIGHT + ROW_GAP),
  }))
  const width = Math.max(...levels.values()) * (NODE_WIDTH + COLUMN_GAP) + NODE_WIDTH
  const height = Math.max(...[...columns.values()].map(ids => ids.length)) * (NODE_HEIGHT + ROW_GAP) - ROW_GAP

  const selected = selectedId ? byId.get(selectedId) : undefined
  const upstream = selected ? traceDependencyPath(selected.id, predecessors) : new Set<string>()
  const downstream = selected ? traceDependencyPath(selected.id, successors) : new Set<string>()
  const directPredecessors = selected ? predecessors.get(selected.id) ?? [] : []
  const directSuccessors = selected ? successors.get(selected.id) ?? [] : []
  const blockers = directPredecessors.filter(id => state.taskBoardsById[byId.get(id)?.boardId ?? ""]?.stage !== "done")

  return <div className="space-y-4">
    <p className="text-sm text-muted-foreground">Prerequisite → dependent task</p>
    <div className="max-h-[32rem] max-w-full overflow-auto rounded-lg border bg-muted/20 p-4" role="region" aria-label="Task dependency graph" tabIndex={0}>
      <div className="relative" style={{ width, height }}>
        <svg width={width} height={height} className="absolute inset-0" aria-hidden="true">
          <defs><marker id="dependency-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" /></marker></defs>
          {tasks.flatMap(task => (predecessors.get(task.id) ?? []).map(id => {
            const from = positions.get(id)
            const to = positions.get(task.id)
            if (!from || !to) return null
            const x1 = from.x + NODE_WIDTH, y1 = from.y + NODE_HEIGHT / 2, x2 = to.x, y2 = to.y + NODE_HEIGHT / 2
            const active = selected && (
              (selected.id === task.id || upstream.has(task.id)) && upstream.has(id) ||
              (selected.id === id || downstream.has(id)) && downstream.has(task.id)
            )
            return <path key={`${id}-${task.id}`} d={`M ${x1} ${y1} C ${x1 + 23} ${y1}, ${x2 - 23} ${y2}, ${x2} ${y2}`} fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 1.5} className={active ? "text-primary" : "text-border"} markerEnd="url(#dependency-arrow)" />
          }))}
        </svg>
        {tasks.map(task => {
          const position = positions.get(task.id)!
          const active = task.id === selected?.id || upstream.has(task.id) || downstream.has(task.id)
          return <button key={task.id} type="button" aria-pressed={task.id === selected?.id} onClick={() => setSelectedId(task.id)}
            className={`absolute flex flex-col justify-center rounded-md border bg-background px-3 text-left text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring ${active ? "border-primary" : "border-border"}`}
            style={{ left: position.x, top: position.y, width: NODE_WIDTH, height: NODE_HEIGHT }}>
            <span className="truncate font-medium" title={task.title}>{task.title}</span>
            <span className="text-xs text-muted-foreground">{task.archived ? "Archived" : state.taskBoardsById[task.boardId]?.stage === "done" ? "Completed" : "Unfinished"}</span>
          </button>
        })}
      </div>
    </div>
    {selected ? <div className="space-y-3 rounded-lg border p-4" aria-live="polite">
      <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">{selected.title}</h3><Button variant="outline" onClick={() => onOpenTask(selected.id)}>Open task</Button></div>
      <p className="text-sm text-muted-foreground">{upstream.size} upstream, {downstream.size} downstream, {blockers.length} unfinished direct blockers</p>
      <RelationList title="Predecessors" ids={directPredecessors} byId={byId} onOpenTask={onOpenTask} />
      <RelationList title="Blocking now" ids={blockers} byId={byId} onOpenTask={onOpenTask} />
      <RelationList title="Successors" ids={directSuccessors} byId={byId} onOpenTask={onOpenTask} />
    </div> : null}
  </div>
}

function RelationList({ title, ids, byId, onOpenTask }: { title: string; ids: string[]; byId: Map<string, { title: string }>; onOpenTask: (id: string) => void }) {
  return <div className="text-sm"><h4 className="font-medium">{title}</h4>{ids.length ? <ul className="flex flex-wrap gap-2 pt-1">{ids.map(id => <li key={id}><Button variant="outline" size="sm" onClick={() => onOpenTask(id)}>{byId.get(id)?.title ?? id}</Button></li>)}</ul> : <p className="text-muted-foreground">None</p>}</div>
}
