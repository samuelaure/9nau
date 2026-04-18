import { Block } from '@9nau/types'
import { NoteCard } from './NoteCard'

interface NoteGridProps {
  notes: Block[]
}

export function NoteGrid({ notes }: NoteGridProps) {
  return (
    <div
      style={{
        columnCount: 'auto',
        columnWidth: '240px',
        columnGap: '1rem',
      }}
    >
      {notes.map((note) => (
        <div key={note.id} className="mb-4 break-inside-avoid">
          <NoteCard note={note} />
        </div>
      ))}
    </div>
  )
}
