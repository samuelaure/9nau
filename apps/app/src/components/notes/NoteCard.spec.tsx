import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { NoteCard } from './NoteCard'
import { useDashboardStore } from '@/lib/state/dashboard-store'
import { Block } from '@9nau/types'
import { useDeleteBlock } from '@/hooks/use-blocks-api'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

jest.mock('@/lib/state/dashboard-store')
jest.mock('@/hooks/use-blocks-api')

const useDashboardStoreMock = useDashboardStore as unknown as jest.Mock
const mockDeleteBlock = jest.fn()
const queryClient = new QueryClient()

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
)

const mockNote: Block = {
  id: 'note-1',
  uuid: 'uuid-1',
  type: 'note',
  properties: { text: 'This is a test note.' },
  parentId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('NoteCard', () => {
  const setDraggedItem = jest.fn()
  const setEditingNoteId = jest.fn()

  beforeEach(() => {
    useDashboardStoreMock.mockImplementation((selector) =>
      selector({
        draggedItem: null,
        actions: {
          setDraggedItem,
          setEditingNoteId,
        },
      })
    )
    ;(useDeleteBlock as jest.Mock).mockReturnValue({ mutate: mockDeleteBlock })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should render the note text', () => {
    render(<NoteCard note={mockNote} />, { wrapper })
    expect(screen.getByText('This is a test note.')).toBeInTheDocument()
  })

  it('should call setEditingNoteId on click', () => {
    render(<NoteCard note={mockNote} />, { wrapper })
    fireEvent.click(screen.getByText('This is a test note.'))
    expect(setEditingNoteId).toHaveBeenCalledWith(mockNote.id)
  })

  it('should call setDraggedItem on drag start', () => {
    const mockDataTransfer = {
      setData: jest.fn(),
      effectAllowed: '',
    }
    render(<NoteCard note={mockNote} />, { wrapper })
    fireEvent.dragStart(screen.getByText('This is a test note.').parentElement!.parentElement!, {
      dataTransfer: mockDataTransfer,
    })
    expect(setDraggedItem).toHaveBeenCalledWith(mockNote)
    expect(mockDataTransfer.setData).toHaveBeenCalledWith('text/plain', mockNote.id)
  })

  it('should call setDraggedItem with null on drag end', () => {
    render(<NoteCard note={mockNote} />, { wrapper })
    fireEvent.dragEnd(screen.getByText('This is a test note.').parentElement!.parentElement!)
    expect(setDraggedItem).toHaveBeenCalledWith(null)
  })

  it('should call deleteBlock on delete button click', () => {
    render(<NoteCard note={mockNote} />, { wrapper })
    const menuButton = screen.getByTestId('note-card-menu-button')
    fireEvent.click(menuButton)

    const deleteButton = screen.getByText('Delete note')
    fireEvent.click(deleteButton)

    expect(mockDeleteBlock).toHaveBeenCalledWith(mockNote.id)
  })
})
