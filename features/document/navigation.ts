export type DocumentDraft = { save: () => boolean; discard: () => void }

export function createDocumentNavigation(onBlocked: () => void) {
  let draft: DocumentDraft | null = null
  let pending: (() => void) | null = null
  return {
    register(next: DocumentDraft) {
      draft = next
      return () => { if (draft === next) draft = null }
    },
    request(action: () => void) {
      if (!draft) { action(); return }
      pending = action
      onBlocked()
    },
    resolve(choice: "save" | "discard" | "stay") {
      if (choice === "stay") { pending = null; return true }
      try {
        if (choice === "save" && draft && !draft.save()) return false
        if (choice === "discard") draft?.discard()
      } catch {
        return false
      }
      const action = pending
      draft = null
      pending = null
      action?.()
      return true
    },
  }
}
