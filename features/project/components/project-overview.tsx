import {
  Activity,
  AlertTriangle,
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
import {
  PROJECT_VIEW_DEFINITIONS,
  type SupportedProjectViewType,
} from "../view-definitions"

const DEMO_ACTIVITY = [
  "Project workspace is ready",
  "Template structure is available",
  "Frontend planning data is local",
]

type ProjectOverviewProps = {
  workspaceId: string
  projectId: string
  summary: ProjectOverviewSummary
  missingViewTypes: readonly SupportedProjectViewType[]
  canAddDocument: boolean
  onAddView: (type: SupportedProjectViewType) => void
  onAddDocument: () => void
}

export function ProjectOverview({
  workspaceId,
  projectId,
  summary,
  missingViewTypes,
  canAddDocument,
  onAddView,
  onAddDocument,
}: ProjectOverviewProps) {
  const hasQuickActions =
    missingViewTypes.length > 0 || canAddDocument

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
          <CardContent>
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
                          document.id
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

      {hasQuickActions ? (
        <Card>
          <CardHeader>
            <CardTitle>Build your workspace</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {missingViewTypes.map((type) => (
              <Button
                key={type}
                type="button"
                variant="outline"
                onClick={() => onAddView(type)}
              >
                <Plus aria-hidden="true" />
                Add {PROJECT_VIEW_DEFINITIONS[type].title}
              </Button>
            ))}
            {canAddDocument ? (
              <Button
                type="button"
                variant="outline"
                onClick={onAddDocument}
              >
                <Plus aria-hidden="true" />
                Add document
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
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
