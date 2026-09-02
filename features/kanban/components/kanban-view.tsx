"use client"

import { useRef, useState } from "react"
import { DragDropProvider } from "@dnd-kit/react"

import {
  findKanbanCard,
  getKanbanDropDestination,
  moveKanbanCard,
} from "../model"
import { INITIAL_KANBAN_COLUMNS } from "../mock-data"
import { KanbanBoard } from "./kanban-board"
import { KanbanCardDialog } from "./kanban-card-dialog"

export function KanbanView() {
  const [columns, setColumns] = useState(() => INITIAL_KANBAN_COLUMNS)
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const selectedCardTriggerRef = useRef<HTMLButtonElement | null>(null)
  const selectedCard = selectedCardId
    ? findKanbanCard(columns, selectedCardId)
    : null

  function handleOpenCard(cardId: string, trigger: HTMLButtonElement) {
    selectedCardTriggerRef.current = trigger
    setSelectedCardId(cardId)
  }

  function handleDialogOpenChange(open: boolean) {
    if (!open) {
      setSelectedCardId(null)
    }
  }

  function handleDragEnd(
    canceled: boolean,
    sourceId: string | number | undefined,
    targetId: string | number | undefined
  ) {
    if (canceled || sourceId == null || targetId == null) {
      return
    }

    setColumns((currentColumns) => {
      const destination = getKanbanDropDestination(currentColumns, targetId)

      if (!destination) {
        return currentColumns
      }

      return moveKanbanCard(currentColumns, String(sourceId), destination)
    })
  }

  return (
    <>
      <DragDropProvider
        onDragEnd={(event) =>
          handleDragEnd(
            event.canceled,
            event.operation.source?.id,
            event.operation.target?.id
          )
        }
      >
        <KanbanBoard columns={columns} onOpenCard={handleOpenCard} />
      </DragDropProvider>

      <KanbanCardDialog
        cardLocation={selectedCard}
        finalFocus={selectedCardTriggerRef}
        open={selectedCard !== null}
        onOpenChange={handleDialogOpenChange}
      />
    </>
  )
}
