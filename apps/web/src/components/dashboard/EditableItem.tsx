import { useState, useEffect, useRef } from 'react';
import { Block } from '@9nau/types';
import { cn } from '@9nau/ui/lib/utils';
import { useUpdateBlock, useDeleteBlock, useCreateBlock } from '@/hooks/use-blocks-api';
import { useDashboardStore } from '@/lib/state/dashboard-store';

interface EditableItemProps {
  item: Block;
  dateStr: string;
  onDragStart: (e: React.DragEvent, item: Block) => void;
  onDragEnd: (e: React.DragEvent) => void;
}

export function EditableItem({ item, dateStr, onDragStart, onDragEnd }: EditableItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState((item.properties.text as string) || '');
  const inputRef = useRef<HTMLInputElement>(null);

  const { setDropTarget, dropTarget, setDraggedItem, draggedItem } = useDashboardStore(s => ({
    setDropTarget: s.actions.setDropTarget,
    dropTarget: s.dropTarget,
    setDraggedItem: s.actions.setDraggedItem,
    draggedItem: s.draggedItem,
  }));

  const updateBlock = useUpdateBlock();
  const deleteBlock = useDeleteBlock();
  const createBlock = useCreateBlock();

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (text !== item.properties.text) {
      updateBlock.mutate({ id: item.id, updateDto: { properties: { text } } });
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
      createBlock.mutate({ type: item.type, parentId: item.parentId, properties: { text: '' } });
    } else if (e.key === 'Escape') {
      setText((item.properties.text as string) || '');
      setIsEditing(false);
    } else if (e.key === 'Backspace' && text === '') {
      e.preventDefault();
      deleteBlock.mutate(item.id);
    } else if (e.key === 'Tab' && !e.shiftKey) {
      // Indent logic needs parent context, handled in HierarchicalSection
    } else if (e.key === 'Tab' && e.shiftKey) {
      // Outdent logic needs parent context, handled in HierarchicalSection
    }
  };

  const handleToggle = () => {
    updateBlock.mutate({
      id: item.id,
      updateDto: { properties: { completed: !item.properties.completed } },
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedItem || draggedItem.id === item.id) {
      setDropTarget(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;
    let position: 'above' | 'below' | 'on' = 'on';
    if (y < height * 0.3) position = 'above';
    else if (y > height * 0.7) position = 'below';
    setDropTarget({ id: item.id, position, date: dateStr, section: item.type });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedItem || draggedItem.id === item.id) return;

    let newParentId = item.parentId;
    if (dropTarget?.position === 'on') {
      newParentId = item.id;
    }

    updateBlock.mutate({ id: draggedItem.id, updateDto: { parentId: newParentId } });
    setDraggedItem(null);
  };

  const sharedClasses = cn(
    'w-full py-0.5 px-1 rounded-md text-sm',
    item.properties.completed ? 'line-through text-gray-500' : 'text-gray-700'
  );

  return (
    <div
      className="relative group"
      draggable
      onDragStart={(e) => onDragStart(e, item)}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragEnd={onDragEnd}
    >
      {dropTarget?.id === item.id && dropTarget.position === 'above' && (
        <div className="absolute -top-1 left-0 w-full h-0.5 bg-blue-500 rounded-full z-10" />
      )}
      <div className="relative flex items-start p-1">
        {item.type === 'action' && (
          <input
            type="checkbox"
            checked={!!item.properties.completed}
            onChange={handleToggle}
            className="w-4 h-4 mt-1 mr-3 bg-gray-100 border-gray-300 rounded text-yellow-500 focus:ring-yellow-600 cursor-pointer flex-shrink-0"
          />
        )}
        {item.type === 'experience' && (
          <span className="mr-3 mt-1.5 text-gray-400 flex-shrink-0">•</span>
        )}
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className={cn(sharedClasses, 'bg-yellow-50 focus:outline-none')}
          />
        ) : (
          <span
            className={cn(sharedClasses, 'cursor-text')}
            onClick={() => setIsEditing(true)}
          >
            {text || <span className="text-transparent select-none">Empty</span>}
          </span>
        )}
      </div>
      {dropTarget?.id === item.id && dropTarget.position === 'below' && (
        <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-blue-500 rounded-full z-10" />
      )}
      {dropTarget?.id === item.id && dropTarget.position === 'on' && (
        <div className="absolute inset-0 border-2 border-blue-500 rounded-md pointer-events-none z-10" />
      )}
    </div>
  );
}
