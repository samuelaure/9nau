import { create } from 'zustand'

export type View = 'home' | 'inbox' | 'actions' | 'experiences' | 'information' | 'schedule' | 'trash'

interface UiState {
  isSidebarOpen: boolean
  activeView: View
  actions: {
    toggleSidebar: () => void
    setView: (view: View) => void
  }
}

export const useUiStore = create<UiState>((set) => ({
  isSidebarOpen: true,
  activeView: 'home',
  actions: {
    toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
    setView: (view) => set({ activeView: view }),
  },
}))

export const useUiActions = () => useUiStore((state) => state.actions)
