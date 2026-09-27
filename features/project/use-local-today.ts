"use client"

import { useSyncExternalStore } from "react"

import { getLocalDateKey } from "./overview.ts"

function subscribe(onChange: () => void) {
  const interval = window.setInterval(onChange, 60_000)
  window.addEventListener("focus", onChange)
  document.addEventListener("visibilitychange", onChange)

  return () => {
    window.clearInterval(interval)
    window.removeEventListener("focus", onChange)
    document.removeEventListener("visibilitychange", onChange)
  }
}

function getSnapshot() {
  return getLocalDateKey(new Date())
}

function getServerSnapshot() {
  // The browser's timezone is not available during server rendering.
  return null
}

export function useLocalToday() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
