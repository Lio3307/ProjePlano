export const BOARD_LABEL_COLORS = [
  "gray",
  "orange",
  "yellow",
  "green",
  "blue",
  "purple",
  "pink",
  "red",
] as const

export type BoardLabelColor = (typeof BOARD_LABEL_COLORS)[number]

export type BoardLabel = {
  id: string
  name: string
  color: BoardLabelColor
}

export function resolveBoardLabels(
  labels: readonly BoardLabel[],
  labelIds: readonly string[]
): BoardLabel[] {
  return labelIds.flatMap((labelId) => {
    const label = labels.find((candidate) => candidate.id === labelId)

    return label ? [label] : []
  })
}

export function isBoardLabelColor(value: string): value is BoardLabelColor {
  return BOARD_LABEL_COLORS.some((color) => color === value)
}

export function normalizeBoardLabels(
  values: readonly BoardLabel[]
): BoardLabel[] | null {
  const labelIds = new Set<string>()
  const labelNames = new Set<string>()
  const labels: BoardLabel[] = []

  for (const label of values) {
    const id = label.id.trim()
    const name = label.name.trim()
    const normalizedName = name.toLowerCase()

    if (
      id.length === 0 ||
      name.length === 0 ||
      labelIds.has(id) ||
      labelNames.has(normalizedName) ||
      !isBoardLabelColor(label.color)
    ) {
      return null
    }

    labelIds.add(id)
    labelNames.add(normalizedName)
    labels.push({ id, name, color: label.color })
  }

  return labels
}
