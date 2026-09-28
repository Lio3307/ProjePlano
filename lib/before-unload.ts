export function warnBeforeUnload(target: Pick<Window, "addEventListener" | "removeEventListener">) {
  function warn(event: BeforeUnloadEvent) {
    event.preventDefault()
    event.returnValue = "Unsaved changes"
  }
  target.addEventListener("beforeunload", warn)
  return () => target.removeEventListener("beforeunload", warn)
}
