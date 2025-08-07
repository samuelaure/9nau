import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { NoteCard } from './NoteCard';
import { useDashboardStore } from '@/lib/state/dashboard-store';
import { Block } from '@9nau/types';

jest.mock('@/lib/state/dashboard-store');

const useDashboardStoreMock = useDashboardStore as unknown as jest.Mock;

const mockNote: Block = {
  id: 'note-1',
  type: 'note',
  properties: { text: 'This is a test note.' },
  parentId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('NoteCard', () => {
  const setDraggedItem = jest.fn();
  const setEditingNoteId = jest.fn();

  beforeEach(() => {
    useDashboardStoreMock.mockImplementation((selector) => selector({
      draggedItem: null,
      actions: {
        setDraggedItem,
        setEditingNoteId,
      }
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render the note text', () => {
    render(<NoteCard note={mockNote} />);
    expect(screen.getByText('This is a test note.')).toBeInTheDocument();
  });

  it('should call setEditingNoteId on click', () => {
    render(<NoteCard note={mockNote} />);
    fireEvent.click(screen.getByText('This is a test note.'));
    expect(setEditingNoteId).toHaveBeenCalledWith(mockNote.id);
  });

  it('should call setDraggedItem on drag start', () => {
    render(<NoteCard note={mockNote} />);
    fireEvent.dragStart(screen.getByText('This is a test note.'));
    expect(setDraggedItem).toHaveBeenCalledWith(mockNote);
  });

  it('should call setDraggedItem with null on drag end', () => {
    render(<NoteCard note={mockNote} />);
    fireEvent.dragEnd(screen.getByText('This is a test note.'));
    expect(setDraggedItem).toHaveBeenCalledWith(null);
  });
});
