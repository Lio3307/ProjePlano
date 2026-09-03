import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  FileText,
  Plus,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { ProjectOverviewSummary } from "../overview"
import { getProjectViewHref } from "../query-state"
import type { SupportedProjectView } from "../view-definitions"

const DEMO_ACTIVITY = [
  "Project workspace is ready",
  "Template structure is available",
  "Frontend planning data is local",
]

type ProjectOverviewProps = {
  workspaceId: string
  projectId: string
  summary: ProjectOverviewSummary
  workViews: readonly SupportedProjectView[]
  onAddDocument: (trigger: HTMLButtonElement) => void
}

export function ProjectOverview({
  workspaceId,
  projectId,
  summary,
  workViews,
  onAddDocument,
}: ProjectOverviewProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card size="sm">
          <CardHeader>
            <CardTitle>Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-2xl font-semibold">
              {summary.progressPercentage}%
            </p>
            <div
              role="progressbar"
              aria-label="Completed work"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={summary.progressPercentage}
              className="h-1.5 overflow-hidden rounded-full bg-muted"
            >
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: summary.progressPercentage + "%" }}
              />
            </div>
            <p className="text-muted-foreground">
              {summary.completedWorkItems} of {summary.totalWorkItems} complete
            </p>
          </CardContent>
        </Card>

        <MetricCard
          icon={Activity}
          label="Active work"
          value={summary.activeWorkItems}
        />
        <MetricCard
          icon={AlertTriangle}
          label="Overdue"
          value={summary.overdueWorkItems}
        />

        <Card size="sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock
                aria-hidden="true"
                className="size-4 text-muted-foreground"
              />
              Next milestone
            </CardTitle>
          </CardHeader>
          <CardContent>
            {summary.nextMilestone ? (
              <>
                <p className="font-medium">
                  {summary.nextMilestone.title}
                </p>
                <p className="text-muted-foreground">
                  {summary.nextMilestone.targetDate}
                </p>
              </>
            ) : (
              <p className="text-muted-foreground">
                No milestone planned yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pinned resources</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.pinnedDocuments.length > 0 ? (
              <div className="space-y-2">
                {summary.pinnedDocuments.map((document) => (
                  <Button
                    key={document.id}
                    nativeButton={false}
                    variant="outline"
                    className="w-full justify-start"
                    render={
                      <Link
                        href={getProjectViewHref(
                          workspaceId,
                          projectId,
                          "documents",
                          { resourceId: document.id }
                        )}
                      />
                    }
                  >
                    <FileText aria-hidden="true" />
                    {document.title}
                  </Button>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">
                No pinned resources yet
              </p>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={(event) => onAddDocument(event.currentTarget)}
            >
              <Plus aria-hidden="true" />
              Add document
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Demo activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {DEMO_ACTIVITY.map((activity) => (
                <li key={activity} className="flex items-start gap-2">
                  <CheckCircle2
                    aria-hidden="true"
                    className="mt-0.5 size-4 text-primary"
                  />
                  <span>{activity}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Work views</CardTitle>
        </CardHeader>
        <CardContent data-overview-work-views>
          {workViews.length > 0 ? (
            <ul className="divide-y rounded-md border">
              {workViews.map((view) => (
                <li key={view.id}>
                  <Button
                    nativeButton={false}
                    variant="ghost"
                    className="h-auto w-full justify-between rounded-none px-3 py-2.5"
                    render={
                      <Link
                        href={getProjectViewHref(
                          workspaceId,
                          projectId,
                          view.type,
                          { workViewId: view.id }
                        )}
                      />
                    }
                  >
                    {view.title}
                    <ArrowUpRight
                      aria-hidden="true"
                      className="text-muted-foreground"
                    />
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">
              No work views yet. Open Work and use + to add one.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: number
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon
            aria-hidden="true"
            className="size-4 text-muted-foreground"
          />
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  )
}
