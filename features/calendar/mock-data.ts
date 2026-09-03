import type { CalendarMonth } from "./date-utils"
import type { Assignee, WorkItem } from "../work-item/model"

type CalendarSeedTask = Omit<
  Pick<
    WorkItem,
    | "id"
    | "title"
    | "description"
    | "status"
    | "priority"
    | "dueDate"
    | "labels"
    | "checklist"
  >,
  "dueDate"
> & {
  assignee: Assignee
  dueDate: string
}

export const INITIAL_CALENDAR_MONTH: CalendarMonth = {
  year: 2026,
  month: 8,
}

export const INITIAL_CALENDAR_TASKS: CalendarSeedTask[] = [
  {
    id: "launch-kickoff",
    title: "Launch planning kickoff",
    description:
      "Align the product, design, and engineering owners on the September launch plan and decision cadence.",
    dueDate: "2026-09-01",
    status: "done",
    priority: "high",
    assignee: { name: "Maya Chen", initials: "MC" },
    labels: ["Planning", "Launch"],
    checklist: [
      {
        id: "launch-kickoff-agenda",
        label: "Share the kickoff agenda",
        completed: true,
      },
      {
        id: "launch-kickoff-owners",
        label: "Confirm workstream owners",
        completed: true,
      },
    ],
  },
  {
    id: "onboarding-metrics",
    title: "Review onboarding metrics",
    description:
      "Review activation and drop-off metrics before confirming the onboarding improvements for this release.",
    dueDate: "2026-09-02",
    status: "review",
    priority: "medium",
    assignee: { name: "Nadia Putri", initials: "NP" },
    labels: ["Research", "Product"],
    checklist: [
      {
        id: "onboarding-metrics-export",
        label: "Export the current funnel",
        completed: true,
      },
      {
        id: "onboarding-metrics-findings",
        label: "Summarize key findings",
        completed: false,
      },
    ],
  },
  {
    id: "release-notes",
    title: "Draft release notes",
    description:
      "Prepare clear customer-facing notes for the workspace, document, table, and Kanban improvements.",
    dueDate: "2026-09-04",
    status: "in-progress",
    priority: "medium",
    assignee: { name: "Rafi Akbar", initials: "RA" },
    labels: ["Docs", "Launch"],
    checklist: [
      {
        id: "release-notes-outline",
        label: "Create the outline",
        completed: true,
      },
      {
        id: "release-notes-review",
        label: "Request product review",
        completed: false,
      },
    ],
  },
  {
    id: "stakeholder-sync",
    title: "Stakeholder launch sync",
    description:
      "Confirm scope, known risks, and final owners with the launch stakeholders before the QA window.",
    dueDate: "2026-09-08",
    status: "todo",
    priority: "high",
    assignee: { name: "Dina Mahesa", initials: "DM" },
    labels: ["Meeting", "Launch"],
    checklist: [
      {
        id: "stakeholder-sync-risks",
        label: "Update the risk list",
        completed: false,
      },
      {
        id: "stakeholder-sync-invite",
        label: "Confirm all attendees",
        completed: true,
      },
    ],
  },
  {
    id: "regression-pass",
    title: "Complete regression pass",
    description:
      "Run the agreed dashboard and project regression checks against the release candidate.",
    dueDate: "2026-09-12",
    status: "todo",
    priority: "high",
    assignee: { name: "Hadi Pratama", initials: "HP" },
    labels: ["Quality"],
    checklist: [
      {
        id: "regression-pass-routes",
        label: "Verify canonical routes",
        completed: false,
      },
      {
        id: "regression-pass-responsive",
        label: "Verify responsive layouts",
        completed: false,
      },
      {
        id: "regression-pass-build",
        label: "Verify production build",
        completed: false,
      },
    ],
  },
  {
    id: "launch-assets",
    title: "Prepare launch assets",
    description:
      "Collect the approved screenshots, product copy, and support references for the release announcement.",
    dueDate: "2026-09-18",
    status: "todo",
    priority: "medium",
    assignee: { name: "Sinta Lestari", initials: "SL" },
    labels: ["Design", "Launch"],
    checklist: [
      {
        id: "launch-assets-screenshots",
        label: "Capture product screenshots",
        completed: false,
      },
      {
        id: "launch-assets-copy",
        label: "Approve announcement copy",
        completed: false,
      },
    ],
  },
  {
    id: "readiness-review",
    title: "Production readiness review",
    description:
      "Review release evidence, rollback notes, and support readiness before approving production rollout.",
    dueDate: "2026-09-24",
    status: "todo",
    priority: "high",
    assignee: { name: "Bima Santoso", initials: "BS" },
    labels: ["Quality", "Product"],
    checklist: [
      {
        id: "readiness-review-evidence",
        label: "Collect verification evidence",
        completed: false,
      },
      {
        id: "readiness-review-rollback",
        label: "Review rollback notes",
        completed: false,
      },
    ],
  },
  {
    id: "launch-retrospective",
    title: "Launch retrospective",
    description:
      "Document what worked, what slowed the team down, and which follow-up actions belong in the next cycle.",
    dueDate: "2026-09-30",
    status: "todo",
    priority: "low",
    assignee: { name: "Farah Wijaya", initials: "FW" },
    labels: ["Planning"],
    checklist: [
      {
        id: "launch-retrospective-input",
        label: "Collect team input",
        completed: false,
      },
      {
        id: "launch-retrospective-actions",
        label: "Assign follow-up actions",
        completed: false,
      },
    ],
  },
]
