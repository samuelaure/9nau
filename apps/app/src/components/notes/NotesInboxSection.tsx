import { useState } from 'react'
import { Block } from '@9nau/types'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { NoteGrid } from './NoteGrid'

interface NotesInboxSectionProps {
  title: string
  notes: Block[]
}

export function NotesInboxSection({ title, notes }: NotesInboxSectionProps) {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <div className="mb-4">
      <button
        className="flex items-center w-full text-left p-2 rounded-md hover:bg-gray-50"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <ChevronDown className="w-4 h-4 mr-2" /> : <ChevronRight className="w-4 h-4 mr-2" />}
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      </button>
      {isOpen && (
        <div className="pl-2 mt-2">
          {notes.length > 0 ? (
            <NoteGrid notes={notes} />
          ) : (
            <p className="text-gray-500 italic text-sm pl-8">No inbox notes for this day.</p>
          )}
        </div>
      )}
    </div>
  )
}
