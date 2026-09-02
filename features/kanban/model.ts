export type KanbanPriority = "low" | "medium" | "high"

export type KanbanChecklistItem = {
  id: string
  label: string
  completed: boolean
}

export type KanbanAssignee = {
  name: string
  initials: string
}

export type KanbanCard = {
  id: string
  title: string
  description: string
  priority: KanbanPriority
  assignee: KanbanAssignee
  dueDate: string
  labels: string[]
  checklist: KanbanChecklistItem[]
}

export type KanbanColumn = {
  id: string
  title: string
  cards: KanbanCard[]
}

export type KanbanDropDestination = {
  columnId: string
  index: number
}

export type KanbanCardLocation = {
  card: KanbanCard
  columnId: string
  columnTitle: string
}

export function findKanbanCard(
  columns: KanbanColumn[],
  cardId: string
): KanbanCardLocation | null {
  for (const column of columns) {
    const card = column.cards.find((candidate) => candidate.id === cardId)

    if (card) {
      return {
        card,
        columnId: column.id,
        columnTitle: column.title,
      }
    }
  }

  return null
}

export function getKanbanDropDestination(
  columns: KanbanColumn[],
  targetId: string | number
): KanbanDropDestination | null {
  const normalizedTargetId = String(targetId)
  const targetColumn = columns.find(
    (column) => column.id === normalizedTargetId
  )

  if (targetColumn) {
    return {
      columnId: targetColumn.id,
      index: targetColumn.cards.length,
    }
  }

  for (const column of columns) {
    const cardIndex = column.cards.findIndex(
      (card) => card.id === normalizedTargetId
    )

    if (cardIndex >= 0) {
      return {
        columnId: column.id,
        index: cardIndex,
      }
    }
  }

  return null
}

export function moveKanbanCard(
  columns: KanbanColumn[],
  cardId: string,
  destination: KanbanDropDestination
): KanbanColumn[] {
  const sourceColumnIndex = columns.findIndex((column) =>
    column.cards.some((card) => card.id === cardId)
  )
  const destinationColumnIndex = columns.findIndex(
    (column) => column.id === destination.columnId
  )

  if (sourceColumnIndex < 0 || destinationColumnIndex < 0) {
    return columns
  }

  const sourceColumn = columns[sourceColumnIndex]
  const sourceCardIndex = sourceColumn.cards.findIndex(
    (card) => card.id === cardId
  )

  if (sourceColumnIndex === destinationColumnIndex) {
    const cards = [...sourceColumn.cards]
    const [card] = cards.splice(sourceCardIndex, 1)

    if (!card) {
      return columns
    }

    const insertIndex = clampIndex(destination.index, cards.length)
    cards.splice(insertIndex, 0, card)

    const orderDidNotChange = cards.every(
      (candidate, index) => candidate === sourceColumn.cards[index]
    )

    if (orderDidNotChange) {
      return columns
    }

    return columns.map((column, index) =>
      index === sourceColumnIndex ? { ...column, cards } : column
    )
  }

  const sourceCards = [...sourceColumn.cards]
  const [card] = sourceCards.splice(sourceCardIndex, 1)

  if (!card) {
    return columns
  }

  const destinationColumn = columns[destinationColumnIndex]
  const destinationCards = [...destinationColumn.cards]
  const insertIndex = clampIndex(destination.index, destinationCards.length)
  destinationCards.splice(insertIndex, 0, card)

  return columns.map((column, index) => {
    if (index === sourceColumnIndex) {
      return { ...column, cards: sourceCards }
    }

    if (index === destinationColumnIndex) {
      return { ...column, cards: destinationCards }
    }

    return column
  })
}

function clampIndex(index: number, maximum: number) {
  return Math.min(Math.max(index, 0), maximum)
}
