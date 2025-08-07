import { create } from 'zustand'
import { Block } from '@9nau/types'
import { RefObject } from 'react'

type ViewMode = 'list' | 'horizontal'

type DropTarget = {
  id: string | null
  position: 'above' | 'below' | 'on' | 'end'
  date: string
  section: string
}

export interface DashboardState {
  viewMode: ViewMode
  currentDate: Date
  visiblePastDays: number
  visibleFutureDays: number
  draggedItem: Block | null
  dropTarget: DropTarget | null
  editingNote: Block | null
  allBlocks: Block[]
  focusedItemId: string | null
  mainContentRef: RefObject<HTMLDivElement> | null
  todayRef: RefObject<HTMLDivElement> | null
  actions: {
    setViewMode: (mode: ViewMode) => void
    setCurrentDate: (date: Date) => void
    loadMorePastDays: () => void
    showFutureDays: () => void
    hideFutureDays: () => void
    setDraggedItem: (item: Block | null) => void
    setDropTarget: (target: DropTarget | null) => void
    setEditingNoteId: (id: string | null) => void
    setAllBlocks: (blocks: Block[]) => void
    setFocusedItemId: (id: string | null) => void
    setMainContentRef: (ref: RefObject<HTMLDivElement>) => void
    setTodayRef: (ref: RefObject<HTMLDivElement>) => void
  }
}

const useDashboardStore = create<DashboardState>((set, get) => ({
  viewMode: 'list',
  currentDate: new Date(),
  visiblePastDays: 7,
  visibleFutureDays: 0,
  draggedItem: null,
  dropTarget: null,
  editingNote: null,
  allBlocks: [],
  focusedItemId: null,
  mainContentRef: null,
  todayRef: null,
  actions: {
    setViewMode: (mode) => set({ viewMode: mode }),
    setCurrentDate: (date) => set({ currentDate: date }),
    loadMorePastDays: () => set((state) => ({ visiblePastDays: state.visiblePastDays + 7 })),
    showFutureDays: () => set((state) => ({ visibleFutureDays: state.visibleFutureDays + 1 })),
    hideFutureDays: () => set({ visibleFutureDays: 0 }),
    setDraggedItem: (item) => {
      set({ draggedItem: item })
      if (item === null) {
        set({ dropTarget: null })
      }
    },
    setDropTarget: (target) => set({ dropTarget: target }),
    setEditingNoteId: (id) => {
      if (!id) {
        set({ editingNote: null })
        return
      }
      const { allBlocks } = get()
      const noteToEdit = allBlocks.find((block) => block.id === id)
      set({ editingNote: noteToEdit || null })
    },
    setAllBlocks: (blocks) => set({ allBlocks: blocks }),
    setFocusedItemId: (id) => set({ focusedItemId: id }),
    setMainContentRef: (ref) => set({ mainContentRef: ref }),
    setTodayRef: (ref) => set({ todayRef: ref }),
  },
}))

export { useDashboardStore }
