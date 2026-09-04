import {
  normalizeBoardLabels,
  type BoardLabel,
} from "../project/board.ts"

export function cloneLabelCatalog(labels: readonly BoardLabel[]) {
  return labels.map((label) => ({ ...label }))
}

export function normalizeLabelCatalog(labels: readonly BoardLabel[]) {
  return normalizeBoardLabels(labels)
}

export function haveSameLabelCatalog(
  left: readonly BoardLabel[],
  right: readonly BoardLabel[]
) {
  return (
    left.length === right.length &&
    left.every((label, index) => {
      const candidate = right[index]

      return (
        label.id === candidate?.id &&
        label.name === candidate.name &&
        label.color === candidate.color
      )
    })
  )
}
