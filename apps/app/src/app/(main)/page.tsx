'use client'

import { useMemo } from 'react'
import { NoteInput } from '@/components/notes/note-input'
import { Dashboard } from '@/components/dashboard/Dashboard'
import { JournalView } from '@/components/journal/JournalView'
import { SearchView } from '@/components/search/SearchView'
import { useGetBlocks } from '@/hooks/use-blocks-api'
import { groupBlocksByDate, buildHierarchy, formatDisplayDate } from '@9nau/core'
import { Block } from '@9nau/types'
import { useDashboardStore } from '@/lib/state/dashboard-store'
import { useUiStore } from '@/lib/state/ui-store'
import { NoteGrid } from '@/components/notes/NoteGrid'

export default function HomePage() {
  const activeView = useUiStore((s) => s.activeView)
  const setAllBlocks = useDashboardStore((s) => s.actions.setAllBlocks)

  const queryParams = useMemo(() => {
    if (activeView === 'home') {
      return {}
    }
    return { status: activeView }
  }, [activeView])

  const { data: blocks, isLoading, isError } = useGetBlocks(queryParams)

  useMemo(() => {
    if (blocks) {
      setAllBlocks(blocks)
    }
  }, [blocks, setAllBlocks])

  const processedData = useMemo(() => {
    if (!blocks) {
      return {
        notesByDate: new Map<string, Block[]>(),
        actionsHierarchy: [],
        experiencesHierarchy: [],
        groupedNotes: {},
      }
    }
    const notes = blocks.filter((b: Block) => b.type === 'note')
    const actions = blocks.filter((b: Block) => b.type === 'action')
    const experiences = blocks.filter((b: Block) => b.type === 'experience')

    const notesByDate = groupBlocksByDate(notes)
    const actionsHierarchy = buildHierarchy(actions)
    const experiencesHierarchy = buildHierarchy(experiences)

    const groupedNotes = notes
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .reduce(
        (acc, note) => {
          const dateProp = note.properties.date as string | undefined
          const dateKey = formatDisplayDate(dateProp || new Date(note.createdAt).toISOString().split('T')[0])
          if (!acc[dateKey]) {
            acc[dateKey] = []
          }
          acc[dateKey].push(note)
          return acc
        },
        {} as Record<string, Block[]>
      )

    return { notesByDate, actionsHierarchy, experiencesHierarchy, groupedNotes }
  }, [blocks])

  if (isLoading) {
    return <div className="text-center text-gray-500 dark:text-gray-400 mt-10">Loading data...</div>
  }

  if (isError) {
    return <div className="text-center text-red-500 mt-10">Failed to load data. Please try again later.</div>
  }

  // Route to special views
  if (activeView === 'journal') {
    return <JournalView />
  }

  if (activeView === 'search') {
    return <SearchView />
  }

  return (
    <>
      <NoteInput />
      {activeView === 'home' ? (
        <Dashboard
          notesByDate={processedData.notesByDate}
          actions={processedData.actionsHierarchy}
          experiences={processedData.experiencesHierarchy}
        />
      ) : (
        <div className="space-y-8">
          {Object.keys(processedData.groupedNotes).length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 mt-20">This section is empty.</div>
          ) : (
            Object.entries(processedData.groupedNotes).map(([date, notesForDate]) => (
              <div key={date}>
                <div className="flex items-center mb-4">
                  <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider pr-3 whitespace-nowrap">
                    {date}
                  </div>
                  <div className="flex-grow h-px bg-gray-200 dark:bg-gray-700"></div>
                </div>
                <NoteGrid notes={notesForDate} />
              </div>
            ))
          )}
        </div>
      )}
    </>
  )
}

