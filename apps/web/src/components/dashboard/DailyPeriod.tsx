import { useState } from 'react';
import { cn } from '@9nau/ui/lib/utils';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Block } from '@9nau/types';
import { HierarchicalSection } from './HierarchicalSection';
import { NotesInboxSection } from '../notes/NotesInboxSection';
import { formatDisplayDate, isDateToday, HierarchicalBlock } from '@9nau/core';
import { useDashboardStore } from '@/lib/state/dashboard-store';

interface DailyPeriodProps {
  dateStr: string;
  dailyActions: HierarchicalBlock[];
  dailyExperiences: HierarchicalBlock[];
  dailyNotes: Block[];
  showHeader?: boolean;
}

export function DailyPeriod({
  dateStr,
  dailyActions,
  dailyExperiences,
  dailyNotes,
  showHeader = true,
}: DailyPeriodProps) {
  const [isOpen, setIsOpen] = useState(() => isDateToday(dateStr));
  const { setDropTarget, setDraggedItem, draggedItem } = useDashboardStore(s => ({
    setDropTarget: s.actions.setDropTarget,
    setDraggedItem: s.actions.setDraggedItem,
    draggedItem: s.draggedItem,
  }));

  const handleDateHeaderDrop = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedItem) return;
    setDraggedItem(null);
  };

  const inboxNotes = dailyNotes.filter(note => note.properties.status === 'inbox');
  const sortedNotes = [...inboxNotes].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const content = (
    <div className={cn(showHeader && 'pt-4 pl-4 border-l-2 ml-2')}>
      <HierarchicalSection
        dateStr={dateStr}
        sectionType="action"
        title="Actions"
        items={dailyActions}
      />
      <HierarchicalSection
        dateStr={dateStr}
        sectionType="experience"
        title="Experiences & Gratitude"
        items={dailyExperiences}
      />
      <NotesInboxSection title="Notes Inbox" notes={sortedNotes} />
    </div>
  );

  if (!showHeader) return content;

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-2 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors"
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (draggedItem) {
            const correctSection = draggedItem.type;
            setDropTarget({
              id: null,
              position: 'end',
              date: dateStr,
              section: correctSection,
            });
          }
        }}
        onDrop={handleDateHeaderDrop}
      >
        <span className="text-sm font-bold text-gray-600">
          {formatDisplayDate(dateStr)}
        </span>
        <ChevronDown
          className={cn(
            'h-5 w-5 text-gray-500 transition-transform',
            isOpen ? 'rotate-180' : ''
          )}
        />
      </button>
      {isOpen && content}
    </div>
  );
}
