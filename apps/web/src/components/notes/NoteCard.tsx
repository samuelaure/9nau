import { Block } from '@9nau/types';
import { cn } from '@9nau/ui/lib/utils';
import { useDashboardStore } from '@/lib/state/dashboard-store';

interface NoteCardProps {
  note: Block;
}

export function NoteCard({ note }: NoteCardProps) {
  const { setDraggedItem, draggedItem, setEditingNoteId } = useDashboardStore(s => ({
    setDraggedItem: s.actions.setDraggedItem,
    draggedItem: s.draggedItem,
    setEditingNoteId: s.actions.setEditingNoteId,
  }));

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', note.id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedItem(note);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  return (
    <div
      onClick={() => setEditingNoteId(note.id)}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={cn(
        'bg-card border rounded-lg p-4 shadow-sm cursor-pointer break-inside-avoid',
        draggedItem?.id === note.id ? 'opacity-50' : 'opacity-100'
      )}
    >
      <p className="whitespace-pre-wrap text-sm text-card-foreground break-words max-h-80 overflow-hidden"> 
        {note.properties.text as string}
      </p>
    </div>
  );
}
