import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  CalendarClock,
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
    <div className="space-y-6">
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
            <p className="text-sm text-muted-foreground">
              {summary.completedWorkItems} of {summary.totalWorkItems} tasks complete
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

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              <h2>Work views</h2>
            </CardTitle>
          </CardHeader>
          <CardContent data-overview-work-views>
            {workViews.length > 0 ? (
              <ul className="divide-y rounded-md border">
                {workViews.map((view) => (
                  <li key={view.id}>
                    <Button
                      nativeButton={false}
                      variant="ghost"
                      className="h-auto min-h-11 w-full justify-between rounded-none px-3 py-3 whitespace-normal text-left"
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
                      <span className="min-w-0 font-medium wrap-anywhere">
                        {view.title}
                      </span>
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
                No work views yet
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              <h2>Pinned resources</h2>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.pinnedDocuments.length > 0 ? (
              <div className="space-y-2">
                {summary.pinnedDocuments.map((document) => (
                  <Button
                    key={document.id}
                    nativeButton={false}
                    variant="outline"
                    className="h-auto min-h-11 w-full justify-start whitespace-normal text-left wrap-anywhere"
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
      </div>
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
