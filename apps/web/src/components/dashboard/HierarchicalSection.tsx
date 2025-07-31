import { useState } from 'react';
import { Block } from '@9nau/types';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { EditableItem } from './EditableItem';
import { useDashboardStore } from '@/lib/state/dashboard-store';
import { useCreateBlock, useUpdateBlock } from '@/hooks/use-blocks-api';

interface HierarchicalSectionProps {
  dateStr: string;
  sectionType: 'action' | 'experience';
  title: string;
  items: Block[];
}

export function HierarchicalSection({
  dateStr,
  sectionType,
  title,
  items,
}: HierarchicalSectionProps) {
  const [isOpen, setIsOpen] = useState(true);
  const { setDraggedItem, setDropTarget, draggedItem } = useDashboardStore(s => ({
    setDraggedItem: s.actions.setDraggedItem,
    setDropTarget: s.actions.setDropTarget,
    draggedItem: s.draggedItem,
  }));
  const createBlock = useCreateBlock();
  const updateBlock = useUpdateBlock();

  const handleDragStart = (e: React.DragEvent, item: Block) => {
    e.dataTransfer.effectAllowed = 'move';
    setDraggedItem(item);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const handleSectionDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedItem) return;
    if (draggedItem.type === sectionType) {
      updateBlock.mutate({ id: draggedItem.id, updateDto: { parentId: null } });
    }
    setDraggedItem(null);
  };

  const renderList = (itemList: Block[], level = 0) => (
    <div>
      {itemList.map(item => (
        <div key={item.id} style={{ marginLeft: `${level * 1.5}rem` }}>
          <EditableItem
            item={item}
            dateStr={dateStr}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          />
          {((item as any).children as Block[])?.length > 0 &&
            renderList((item as any).children, level + 1)}
        </div>
      ))}
    </div>
  );

  return (
    <div className="mb-4">
      <button
        className="flex items-center w-full text-left p-2 rounded-md hover:bg-gray-50"
        onClick={() => setIsOpen(!isOpen)}
        onDragOver={e => {
          e.preventDefault();
          e.stopPropagation();
          setDropTarget({
            id: null,
            position: 'end',
            date: dateStr,
            section: sectionType,
          });
        }}
        onDrop={handleSectionDrop}
      >
        {isOpen ? (
          <ChevronDown className="w-4 h-4 mr-2" />
        ) : (
          <ChevronRight className="w-4 h-4 mr-2" />
        )}
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      </button>
      {isOpen && (
        <div
          className="pl-2 mt-2"
          onDragOver={e => {
            e.preventDefault();
            e.stopPropagation();
            setDropTarget({
              id: null,
              position: 'end',
              date: dateStr,
              section: sectionType,
            });
          }}
          onDrop={handleSectionDrop}
        >
          {items.length > 0 ? (
            renderList(items)
          ) : (
            <div
              className="text-gray-500 italic text-sm pl-8 cursor-pointer"
              onClick={() => createBlock.mutate({ type: sectionType, properties: { text: '' } })}
            >
              Click to add an entry.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
