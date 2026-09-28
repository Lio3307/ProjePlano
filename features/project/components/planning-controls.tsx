import type { ReactNode } from "react"

export const planningSelectClass = "h-11 w-full min-w-0 rounded-md border bg-background px-3 text-sm"

export function PlanningField({ label, children }: { label: string; children: ReactNode }) {
  return <label className="grid min-w-0 gap-2 text-sm font-medium"><span>{label}</span>{children}</label>
}
