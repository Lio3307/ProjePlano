import type { ComponentProps, ReactNode } from "react"
import { EllipsisVertical } from "lucide-react"
import { Popover } from "@base-ui/react/popover"

import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu"

export function EditableInput({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      spellCheck={false}
      className={cn(
        "h-9 w-full rounded-sm bg-transparent px-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring/70",
        className
      )}
      {...props}
    />
  )
}

export function IconButton({
  className,
  reveal,
  ...props
}: ComponentProps<"button"> & { reveal?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        "flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
        reveal &&
          "opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 data-popup-open:opacity-100",
        className
      )}
      {...props}
    />
  )
}

export function EmptyLabel() {
  return (
    <span className="text-transparent transition-colors group-hover:text-muted-foreground/60">
      Empty
    </span>
  )
}

export function Popup({ children }: { children: ReactNode }) {
  return (
    <Popover.Portal>
      <Popover.Positioner
        side="bottom"
        align="start"
        sideOffset={4}
        className="isolate z-50 outline-none"
      >
        <Popover.Popup className="w-56 rounded-lg bg-popover/80 p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 backdrop-blur-xl outline-none duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
          {children}
        </Popover.Popup>
      </Popover.Positioner>
    </Popover.Portal>
  )
}

export function PopupItem({ className, ...props }: ComponentProps<"button">) {
  return (
    <button
      type="button"
      className={cn(
        "flex h-7 w-full items-center gap-2 rounded-md px-2 text-xs transition-colors hover:bg-accent",
        className
      )}
      {...props}
    />
  )
}

export function PopupInput({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-7 w-full rounded-md bg-muted px-2 text-xs outline-none placeholder:text-muted-foreground/70 focus-visible:ring-1 focus-visible:ring-ring",
        className
      )}
      {...props}
    />
  )
}

type ActionsMenuProps = {
  triggerLabel: string
  deleteLabel: string
  onDelete: () => void
  deleteDisabled?: boolean
  triggerClassName?: string
  children?: ReactNode
}

export function ActionsMenu({
  triggerLabel,
  deleteLabel,
  onDelete,
  deleteDisabled,
  triggerClassName,
  children,
}: ActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={triggerLabel}
        render={<IconButton reveal className={triggerClassName} />}
      >
        <EllipsisVertical className="size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {children}
        {children ? <DropdownMenuSeparator /> : null}
        <DropdownMenuItem
          variant="destructive"
          disabled={deleteDisabled}
          onClick={onDelete}
        >
          {deleteLabel}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
