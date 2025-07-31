import { useState, useEffect, useRef } from 'react'
import { Block } from '@9nau/types'
import { cn } from '@9nau/ui/lib/utils'
import { useDashboardStore } from '@/lib/state/dashboard-store'

interface EditableItemProps {
  item: Block
  onUpdate: (id: string, newText: string) => void
  onToggle: (id: string) => void
  onAddItem: (afterId: string) => void
  onIndent: (id: string) => void
  onOutdent: (id: string) => void
  onDelete: (id: string) => void
  onDragStart: (e: React.DragEvent, item: Block) => void
  onDragEnd: (e: React.DragEvent) => void
}

export function EditableItem({
  item,
  onUpdate,
  onToggle,
  onAddItem,
  onIndent,
  onOutdent,
  onDelete,
  onDragStart,
  onDragEnd,
}: EditableItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [text, setText] = useState((item.properties.text as string) || '')
  const inputRef = useRef<HTMLInputElement>(null)

  const {
    setDropTarget,
    dropTarget,
    draggedItem,
    focusedItemId,
    setFocusedItemId,
  } = useDashboardStore((s) => ({
    setDropTarget: s.actions.setDropTarget,
    dropTarget: s.dropTarget,
    draggedItem: s.draggedItem,
    focusedItemId: s.focusedItemId,
    setFocusedItemId: s.actions.setFocusedItemId,
  }))

  useEffect(() => {
    if (focusedItemId === item.id) {
      setIsEditing(true)
      setFocusedItemId(null) // Reset after focusing
    }
  }, [focusedItemId, item.id, setFocusedItemId])

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus()
    }
  }, [isEditing])

  const handleSave = () => {
    setIsEditing(false)
    if (text.trim() === '' && !item.properties.text) {
      onDelete(item.id)
    } else if (text !== item.properties.text) {
      onUpdate(item.id, text)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
      onAddItem(item.id)
    } else if (e.key === 'Escape') {
      setText((item.properties.text as string) || '')
      setIsEditing(false)
    } else if (e.key === 'Backspace' && text === '') {
      e.preventDefault()
      onDelete(item.id)
    } else if (e.key === 'Tab') {
      e.preventDefault()
      handleSave() // Save current text before indent/outdent
      if (e.shiftKey) {
        onOutdent(item.id)
      } else {
        onIndent(item.id)
      }
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!draggedItem || draggedItem.id === item.id) {
      setDropTarget(null)
      return
    }
    const rect = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - rect.top
    const height = rect.height
    let position: 'above' | 'below' | 'on' = 'on'
    if (y < height * 0.3) position = 'above'
    else if (y > height * 0.7) position = 'below'
    setDropTarget({
      id: item.id,
      position,
      date: item.properties.date as string,
      section: item.type,
    })
  }

  const sharedClasses = cn(
    'w-full py-0.5 px-1 rounded-md text-sm',
    item.properties.completed ? 'line-through text-gray-500' : 'text-gray-700'
  )

  return (
    <div
      className="relative group"
      draggable
      onDragStart={(e) => onDragStart(e, item)}
      onDragOver={handleDragOver}
      onDrop={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }} // Drop logic is handled by parent
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
            onChange={() => onToggle(item.id)}
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
            onChange={(e) => setText(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className={cn(sharedClasses, 'bg-yellow-50 focus:outline-none')}
          />
        ) : (
          <span
            className={cn(sharedClasses, 'cursor-text')}
            onClick={() => setIsEditing(true)}
          >
            {text || (
              <span className="text-transparent select-none">Empty</span>
            )}
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
  )
}
