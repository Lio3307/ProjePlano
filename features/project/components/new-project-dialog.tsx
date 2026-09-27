"use client"

import { useRef, useState, type FormEvent } from "react"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useProjectStore } from "@/features/project/store-provider"
import { cn } from "@/lib/utils"
import { getProjectViewHref } from "../query-state"
import {
  PROJECT_TEMPLATES,
  getProjectTemplate,
  type ProjectTemplate,
  type ProjectTemplateId,
} from "../templates"
import { PROJECT_VIEW_DEFINITIONS } from "../view-definitions"

type NewProjectDialogProps = {
  workspaceId: string
}

export function NewProjectDialog({
  workspaceId,
}: NewProjectDialogProps) {
  const router = useRouter()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<1 | 2>(1)
  const [templateId, setTemplateId] =
    useState<ProjectTemplateId | null>(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const createProjectFromTemplate = useProjectStore(
    (state) => state.createProjectFromTemplate
  )
  const selectedTemplate = getProjectTemplate(templateId)

  function resetForm() {
    setStep(1)
    setTemplateId(null)
    setName("")
    setDescription("")
    setError(null)
    setIsCreating(false)
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)

    if (nextOpen) {
      setError(null)
    }
  }

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedTemplate || name.trim().length === 0) {
      setError("Choose a template and enter a project name.")
      return
    }

    setIsCreating(true)

    const projectId = "project-" + crypto.randomUUID()
    const created = createProjectFromTemplate({
      id: projectId,
      workspaceId,
      templateId: selectedTemplate.id,
      title: name,
      description,
    })

    if (!created) {
      setError("The project could not be created.")
      setIsCreating(false)
      return
    }

    setOpen(false)
    router.push(
      getProjectViewHref(workspaceId, projectId, "overview")
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      onOpenChangeComplete={(nextOpen) => {
        if (!nextOpen) {
          resetForm()
        }
      }}
    >
      <Button
        ref={triggerRef}
        type="button"
        size="lg"
        data-new-project-trigger
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Plus aria-hidden="true" />
        New project
      </Button>

      <DialogContent
        finalFocus={triggerRef}
        className="flex max-w-3xl flex-col overflow-hidden p-0"
      >
        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={handleCreate}
        >
          <DialogHeader className="shrink-0 border-b bg-popover py-5 pl-6 pr-14">
            <DialogTitle>
              {step === 1 ? "Choose a template" : "Project details"}
            </DialogTitle>
          </DialogHeader>

          <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-6 py-5">
            {step === 1 ? (
              <div
                role="group"
                aria-label="Project template"
                className="grid gap-3 sm:grid-cols-2"
              >
                {PROJECT_TEMPLATES.map((template) => {
                  const selected = template.id === templateId

                  return (
                    <Card
                      key={template.id}
                      className={cn(
                        "h-full py-0 transition-colors hover:bg-muted/40",
                        selected && "bg-primary/5 ring-2 ring-primary"
                      )}
                    >
                      <button
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setTemplateId(template.id)}
                        className="flex h-full w-full flex-col gap-2 rounded-lg p-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                      >
                        <span className="font-heading text-sm font-medium">
                          {template.name}
                        </span>
                        <span className="text-sm/relaxed text-muted-foreground">
                          {template.description}
                        </span>
                        <span className="mt-auto text-xs/relaxed text-muted-foreground">
                          {getTemplateSummary(template)}
                        </span>
                      </button>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <div className="space-y-5">
                <div className="space-y-2">
                  <label
                    htmlFor="project-name"
                    className="text-sm font-medium"
                  >
                    Project name
                  </label>
                  <Input
                    id="project-name"
                    name="projectName"
                    value={name}
                    required
                    autoFocus
                    autoComplete="off"
                    placeholder="Developer portal"
                    onChange={(event) => setName(event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="project-description"
                    className="text-sm font-medium"
                  >
                    Description (optional)
                  </label>
                  <Textarea
                    id="project-description"
                    name="projectDescription"
                    value={description}
                    placeholder="What are you planning or building?"
                    onChange={(event) => setDescription(event.target.value)}
                  />
                </div>

                {selectedTemplate ? (
                  <Card size="sm">
                    <CardHeader>
                      <CardTitle>{selectedTemplate.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <p>{getTemplateSummary(selectedTemplate)}</p>
                    </CardContent>
                  </Card>
                ) : null}

                {error ? (
                  <p role="alert" className="text-xs text-destructive">
                    {error}
                  </p>
                ) : null}
              </div>
            )}
          </div>

          <DialogFooter className="shrink-0 border-t bg-popover px-6 py-4 sm:items-center sm:justify-between">
            {step === 1 ? (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={!selectedTemplate}
                  onClick={() => setStep(2)}
                >
                  Continue
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={isCreating}
                  onClick={() => setStep(1)}
                >
                  Back
                </Button>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={isCreating}
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={name.trim().length === 0 || isCreating}
                  >
                    {isCreating ? "Creating..." : "Create project"}
                  </Button>
                </div>
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function getTemplateSummary(template: ProjectTemplate) {
  const capabilities: string[] = template.viewTypes.map(
    (type) => PROJECT_VIEW_DEFINITIONS[type].title
  )

  if (template.documentTitle) {
    capabilities.push(template.documentTitle)
  }

  return capabilities.length > 0
    ? capabilities.join(" / ")
    : "Overview only"
}
