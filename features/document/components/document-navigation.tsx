"use client"

import { createContext, useContext, useState, type ComponentProps, type ReactNode } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { createDocumentNavigation } from "../navigation"

const DocumentNavigationContext = createContext<ReturnType<typeof createDocumentNavigation> | null>(null)

export function DocumentNavigationProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState(false)
  const [trigger, setTrigger] = useState<HTMLElement | null>(null)
  const [navigation] = useState(() => createDocumentNavigation(() => {
    setTrigger(document.activeElement instanceof HTMLElement ? document.activeElement : null)
    setError(false)
    setOpen(true)
  }))

  function decide(choice: "save" | "discard" | "stay") {
    if (!navigation.resolve(choice)) { setError(true); return }
    setOpen(false)
    setError(false)
  }

  return <DocumentNavigationContext.Provider value={navigation}>
    {children}
    <Dialog open={open} onOpenChange={next => { if (!next) decide("stay") }}>
      <DialogContent finalFocus={() => trigger?.isConnected ? trigger : null} className="max-w-lg space-y-4">
        <DialogHeader>
          <DialogTitle>Unsaved document changes</DialogTitle>
          <DialogDescription>Save this draft before leaving?</DialogDescription>
        </DialogHeader>
        {error ? <p role="alert" className="text-sm text-destructive">Save failed. Your draft is still open.</p> : null}
        <DialogFooter className="flex-wrap">
          <Button variant="outline" onClick={() => decide("stay")}>Stay</Button>
          <Button variant="outline" onClick={() => decide("discard")}>Discard</Button>
          <Button onClick={() => decide("save")}>Save &amp; leave</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </DocumentNavigationContext.Provider>
}

export function useDocumentNavigation() {
  const navigation = useContext(DocumentNavigationContext)
  if (!navigation) throw new Error("Document navigation requires DocumentNavigationProvider")
  return navigation
}

export function DocumentNavigationLink({ href, replace, scroll, ...props }:
  Omit<ComponentProps<typeof Link>, "href" | "onNavigate"> & { href: string }) {
  const router = useRouter()
  const navigation = useDocumentNavigation()
  return <Link {...props} href={href} replace={replace} scroll={scroll} onNavigate={event => {
    const target = new URL(href, window.location.href)
    if (target.pathname === window.location.pathname && target.search === window.location.search) return
    event.preventDefault()
    navigation.request(() => replace ? router.replace(href, { scroll }) : router.push(href, { scroll }))
  }} />
}
