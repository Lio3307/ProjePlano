"use client"

import { useRef } from "react"
import { Ellipsis, Pencil, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { WorkspaceMemberSummary } from "../summary"
import type {
  WorkspaceMember,
  WorkspaceMemberRole,
  WorkspaceMemberStatus,
} from "../model"

const ROLE_LABELS: Record<WorkspaceMemberRole, string> = {
  owner: "Owner",
  editor: "Editor",
  viewer: "Viewer",
}

const STATUS_LABELS: Record<WorkspaceMemberStatus, string> = {
  active: "Active",
  inactive: "Inactive",
}

type WorkspaceMemberPresentationProps = {
  summaries: readonly WorkspaceMemberSummary[]
  onEdit: (member: WorkspaceMember, trigger: HTMLButtonElement) => void
  onRemove: (member: WorkspaceMember, trigger: HTMLButtonElement) => void
}

export function WorkspaceMemberTable({
  summaries,
  onEdit,
  onRemove,
}: WorkspaceMemberPresentationProps) {
  return (
    <div className="rounded-lg border bg-card">
      <Table className="min-w-[48rem]">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Member</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Active tasks</TableHead>
            <TableHead className="text-right">Projects</TableHead>
            <TableHead className="w-12">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {summaries.map((summary) => (
            <TableRow key={summary.member.id}>
              <TableCell>
                <div className="flex items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[0.625rem] font-semibold text-primary"
                  >
                    {summary.member.initials}
                  </span>
                  <span className="font-medium">{summary.member.name}</span>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {summary.member.email}
              </TableCell>
              <TableCell>
                <MemberBadge>{ROLE_LABELS[summary.member.role]}</MemberBadge>
              </TableCell>
              <TableCell>
                <MemberBadge muted={summary.member.status === "inactive"}>
                  {STATUS_LABELS[summary.member.status]}
                </MemberBadge>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {summary.activeTaskCount}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {summary.projectCount}
              </TableCell>
              <TableCell className="text-right">
                <MemberActions
                  member={summary.member}
                  onEdit={onEdit}
                  onRemove={onRemove}
                  compact
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export function WorkspaceMemberList({
  summaries,
  onEdit,
  onRemove,
}: WorkspaceMemberPresentationProps) {
  return (
    <ul
      aria-label="Workspace members"
      className="divide-y rounded-lg border bg-card"
    >
      {summaries.map((summary) => (
        <li key={summary.member.id} className="space-y-3 p-4">
          <div className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
            >
              {summary.member.initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {summary.member.name}
              </p>
              <p className="break-all text-xs text-muted-foreground">
                {summary.member.email}
              </p>
            </div>
            <MemberActions
              member={summary.member}
              onEdit={onEdit}
              onRemove={onRemove}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <MemberBadge>{ROLE_LABELS[summary.member.role]}</MemberBadge>
            <MemberBadge muted={summary.member.status === "inactive"}>
              {STATUS_LABELS[summary.member.status]}
            </MemberBadge>
          </div>

          <dl className="grid grid-cols-2 gap-2 rounded-md bg-muted/45 p-3 text-xs">
            <div>
              <dt className="text-muted-foreground">Active tasks</dt>
              <dd className="mt-1 font-medium tabular-nums">
                {summary.activeTaskCount}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Projects</dt>
              <dd className="mt-1 font-medium tabular-nums">
                {summary.projectCount}
              </dd>
            </div>
          </dl>
        </li>
      ))}
    </ul>
  )
}

function MemberActions({
  member,
  onEdit,
  onRemove,
  compact = false,
}: {
  member: WorkspaceMember
  onEdit: WorkspaceMemberPresentationProps["onEdit"]
  onRemove: WorkspaceMemberPresentationProps["onRemove"]
  compact?: boolean
}) {
  const triggerRef = useRef<HTMLButtonElement>(null)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            ref={triggerRef}
            type="button"
            variant="ghost"
            size={compact ? "icon-sm" : "icon"}
            aria-label={"Open actions for " + member.name}
          />
        }
      >
        <Ellipsis aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuItem
          aria-label={"Edit " + member.name}
          onClick={() => {
            if (triggerRef.current) {
              onEdit(member, triggerRef.current)
            }
          }}
        >
          <Pencil aria-hidden="true" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          aria-label={"Remove " + member.name}
          onClick={() => {
            if (triggerRef.current) {
              onRemove(member, triggerRef.current)
            }
          }}
        >
          <Trash2 aria-hidden="true" />
          Remove
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function MemberBadge({
  children,
  muted = false,
}: {
  children: string
  muted?: boolean
}) {
  return (
    <span
      className={
        muted
          ? "inline-flex rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
          : "inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
      }
    >
      {children}
    </span>
  )
}
