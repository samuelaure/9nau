'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'
import { EditNoteModal } from '@/components/notes/EditNoteModal'

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <EditNoteModal />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
