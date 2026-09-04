import { Link2 } from "lucide-react"

export function WorkItemBlockedBadge({ count }: { count: number }) {
  if (count === 0) {
    return null
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive">
      <Link2 className="size-3" aria-hidden="true" />
      Blocked: {count}
    </span>
  )
}
