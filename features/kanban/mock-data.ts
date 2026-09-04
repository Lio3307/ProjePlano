import { WORKSPACE_MEMBER_IDS } from "../member/mock-data.ts"
import type { WorkItem, WorkItemStatus } from "../work-item/model"

type KanbanSeedCard = Omit<
  Pick<
    WorkItem,
    | "id"
    | "title"
    | "description"
    | "priority"
    | "assigneeId"
    | "dueDate"
    | "checklist"
  >,
  "dueDate"
> & {
  dueDate: string
  labels: string[]
}

type KanbanSeedColumn = {
  id: WorkItemStatus
  title: string
  cards: KanbanSeedCard[]
}

export const INITIAL_KANBAN_COLUMNS: KanbanSeedColumn[] = [
  {
    id: "backlog",
    title: "Backlog",
    cards: [
      {
        id: "audit-onboarding",
        title: "Audit the onboarding flow",
        description:
          "Review the first-run workspace experience and document friction points before the next design pass.",
        priority: "medium",
        assigneeId: WORKSPACE_MEMBER_IDS.mayaChen,
        dueDate: "2026-09-08",
        labels: ["Research", "UX"],
        checklist: [
          {
            id: "audit-onboarding-map",
            label: "Map the current flow",
            completed: true,
          },
          {
            id: "audit-onboarding-interviews",
            label: "Review user interviews",
            completed: false,
          },
          {
            id: "audit-onboarding-findings",
            label: "Summarize findings",
            completed: false,
          },
        ],
      },
      {
        id: "api-error-model",
        title: "Define the API error model",
        description:
          "Create a consistent error shape for project and workspace requests before backend integration begins.",
        priority: "high",
        assigneeId: WORKSPACE_MEMBER_IDS.hadiPratama,
        dueDate: "2026-09-10",
        labels: ["Backend", "API"],
        checklist: [
          {
            id: "api-error-cases",
            label: "List expected error cases",
            completed: true,
          },
          {
            id: "api-error-shape",
            label: "Agree on the response shape",
            completed: false,
          },
        ],
      },
    ],
  },
  {
    id: "todo",
    title: "To Do",
    cards: [
      {
        id: "workspace-filters",
        title: "Build workspace filters",
        description:
          "Add clear filters for workspace status and ownership while preserving the current card layout.",
        priority: "medium",
        assigneeId: WORKSPACE_MEMBER_IDS.nadiaPutri,
        dueDate: "2026-09-12",
        labels: ["Frontend"],
        checklist: [
          {
            id: "workspace-filter-states",
            label: "Define filter states",
            completed: true,
          },
          {
            id: "workspace-filter-ui",
            label: "Build the filter controls",
            completed: false,
          },
          {
            id: "workspace-filter-empty",
            label: "Verify the empty result state",
            completed: false,
          },
        ],
      },
      {
        id: "release-checklist",
        title: "Write the release checklist",
        description:
          "Document the required lint, build, route, and browser checks for a dashboard release.",
        priority: "low",
        assigneeId: WORKSPACE_MEMBER_IDS.rafiAkbar,
        dueDate: "2026-09-15",
        labels: ["Docs", "Quality"],
        checklist: [
          {
            id: "release-static",
            label: "Document static checks",
            completed: false,
          },
          {
            id: "release-browser",
            label: "Document browser checks",
            completed: false,
          },
        ],
      },
    ],
  },
  {
    id: "in-progress",
    title: "In Progress",
    cards: [
      {
        id: "kanban-interactions",
        title: "Polish Kanban interactions",
        description:
          "Make task movement, drop feedback, and card details feel predictable across pointer and keyboard input.",
        priority: "high",
        assigneeId: WORKSPACE_MEMBER_IDS.dinaMahesa,
        dueDate: "2026-09-06",
        labels: ["Frontend", "UX"],
        checklist: [
          {
            id: "kanban-columns",
            label: "Create droppable columns",
            completed: true,
          },
          {
            id: "kanban-reorder",
            label: "Support card reordering",
            completed: true,
          },
          {
            id: "kanban-modal",
            label: "Add task details",
            completed: false,
          },
        ],
      },
    ],
  },
  {
    id: "review",
    title: "Review",
    cards: [
      {
        id: "permission-states",
        title: "Review permission states",
        description:
          "Check the planned owner, editor, and viewer states for gaps before authentication work starts.",
        priority: "medium",
        assigneeId: WORKSPACE_MEMBER_IDS.sintaLestari,
        dueDate: "2026-09-05",
        labels: ["Product", "Security"],
        checklist: [
          {
            id: "permission-owner",
            label: "Review owner actions",
            completed: true,
          },
          {
            id: "permission-editor",
            label: "Review editor actions",
            completed: true,
          },
          {
            id: "permission-viewer",
            label: "Review viewer actions",
            completed: false,
          },
        ],
      },
    ],
  },
  {
    id: "testing",
    title: "Testing",
    cards: [],
  },
  {
    id: "done",
    title: "Done",
    cards: [
      {
        id: "editor-shortcuts",
        title: "Document editor shortcuts",
        description:
          "Publish the supported rich-text shortcuts and slash commands for the current document mockup.",
        priority: "low",
        assigneeId: WORKSPACE_MEMBER_IDS.bimaSantoso,
        dueDate: "2026-09-02",
        labels: ["Docs"],
        checklist: [
          {
            id: "editor-shortcuts-list",
            label: "List keyboard shortcuts",
            completed: true,
          },
          {
            id: "editor-shortcuts-slash",
            label: "List slash commands",
            completed: true,
          },
        ],
      },
    ],
  },
]
