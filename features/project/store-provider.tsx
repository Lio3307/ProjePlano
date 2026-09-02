"use client"

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react"
import { useStore } from "zustand"

import {
  createProjectStore,
  type ProjectStore,
  type ProjectStoreApi,
} from "./store"

const ProjectStoreContext = createContext<ProjectStoreApi | null>(null)

export function ProjectStoreProvider({
  children,
}: {
  children: ReactNode
}) {
  const [store] = useState<ProjectStoreApi>(() => createProjectStore())

  return (
    <ProjectStoreContext.Provider value={store}>
      {children}
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
