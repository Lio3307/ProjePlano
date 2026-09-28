"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  Fragment,
  type ReactNode,
} from "react"
import { useStore } from "zustand"

import {
  createProjectStore,
  type ProjectStore,
  type ProjectStoreApi,
} from "./store"
import { watchUnexportedChanges } from "./unexported-changes"
import { DocumentNavigationProvider } from "@/features/document/components/document-navigation"

const ProjectStoreContext = createContext<ProjectStoreApi | null>(null)

export function ProjectStoreProvider({
  children,
}: {
  children: ReactNode
}) {
  const [store] = useState<ProjectStoreApi>(() => createProjectStore())
  const revision = useStore(store, state => state.dataRevision)
  useEffect(() => watchUnexportedChanges(store, window), [store])

  return (
    <ProjectStoreContext.Provider value={store}>
      <Fragment key={revision}><DocumentNavigationProvider>{children}</DocumentNavigationProvider></Fragment>
    </ProjectStoreContext.Provider>
  )
}

export function useProjectStore<T>(
  selector: (state: ProjectStore) => T
) {
  const store = useContext(ProjectStoreContext)

  if (store === null) {
    throw new Error(
      "useProjectStore must be used within ProjectStoreProvider"
    )
  }

  return useStore(store, selector)
}
