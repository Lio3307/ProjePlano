import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"

interface CalendarToolbarProps {
  monthLabel: string
  onNext: () => void
  onPrevious: () => void
  onToday: () => void
}

export function CalendarToolbar({
  monthLabel,
  onNext,
  onPrevious,
  onToday,
}: CalendarToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2
        className="font-heading text-lg font-semibold tracking-tight"
        aria-live="polite"
      >
        {monthLabel}
      </h2>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Previous month"
          onClick={onPrevious}
        >
          <ChevronLeft aria-hidden="true" />
        </Button>
        <Button type="button" variant="outline" onClick={onToday}>
          Today
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Next month"
          onClick={onNext}
        >
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}
