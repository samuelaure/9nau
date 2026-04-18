import { create } from 'zustand'

export type View = 'home' | 'inbox' | 'actions' | 'experiences' | 'information' | 'journal' | 'search' | 'schedule' | 'trash'

interface UiState {
  isSidebarOpen: boolean
  activeView: View
  isDarkMode: boolean
  searchQuery: string
  actions: {
    toggleSidebar: () => void
    setView: (view: View) => void
    toggleDarkMode: () => void
    setSearchQuery: (query: string) => void
  }
}

export const useUiStore = create<UiState>((set) => ({
  isSidebarOpen: true,
  activeView: 'home',
  isDarkMode: false,
  searchQuery: '',
  actions: {
    toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
    setView: (view) => set({ activeView: view }),
    toggleDarkMode: () => set((state) => {
      const newMode = !state.isDarkMode
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', newMode)
      }
      return { isDarkMode: newMode }
    }),
    setSearchQuery: (query) => set({ searchQuery: query }),
  },
}))

export const useUiActions = () => useUiStore((state) => state.actions)

