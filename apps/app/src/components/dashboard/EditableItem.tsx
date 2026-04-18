import { useState, useEffect, useRef } from 'react'
import { Block, UpdateBlockDto } from '@9nau/types'
import { cn } from '@9nau/ui/lib/utils'
import { useDashboardStore } from '@/lib/state/dashboard-store'
import { HierarchicalBlock } from '@9nau/core'
import { X, Maximize2 } from 'lucide-react'
import { Button } from '@9nau/ui/components/button'
import { BlockEditorModal } from '../editor/BlockEditorModal'

interface EditableItemProps {
  item: Block
  onUpdate: (id: string, newText: string, newParentId?: string | null) => void
  onToggle: (id: string) => void
  onAddItem: (afterId: string, parentId: string | null) => void
  onIndent: (id: string) => void
  onOutdent: (id: string) => void
  onDelete: (id: string) => void
  onDragStart: (e: React.DragEvent, item: Block) => void
  onDragEnd: (e: React.DragEvent) => void
  focusAfterAdd?: boolean
  parentList: HierarchicalBlock[]
  index: number
  onFullUpdate?: (id: string, dto: UpdateBlockDto) => void
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
  focusAfterAdd,
  parentList,
  index,
  onFullUpdate,
}: EditableItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [text, setText] = useState((item.properties.text as string) || '')
  const textAreaRef = useRef<HTMLTextAreaElement>(null)

  const { setDropTarget, dropTarget, focusedItemId, setFocusedItemId } = useDashboardStore((s) => ({
    setDropTarget: s.actions.setDropTarget,
    dropTarget: s.dropTarget,
    focusedItemId: s.focusedItemId,
    setFocusedItemId: s.actions.setFocusedItemId,
  }))

  useEffect(() => {
    if (focusAfterAdd || focusedItemId === item.id) {
      setIsEditing(true)
      setFocusedItemId(null)
    }
  }, [focusAfterAdd, focusedItemId, item.id, setFocusedItemId])

  // Auto-resize textarea
  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = 'auto'
      textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`
    }
  }, [text, isEditing])

  useEffect(() => {
    if (isEditing && !isModalOpen) {
      textAreaRef.current?.focus()
      // Move cursor to the end
      const len = textAreaRef.current?.value.length ?? 0
      textAreaRef.current?.setSelectionRange(len, len)
    }
  }, [isEditing, isModalOpen])

  const handleSave = () => {
    if (isModalOpen) return
    setIsEditing(false)
    if (text.trim() === '' && !item.properties.text) {
      onDelete(item.id)
    } else if (text !== item.properties.text) {
      onUpdate(item.id, text)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (isModalOpen) return
    // Save and add new item on Enter (if not pressing Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSave()
      onAddItem(item.id, item.parentId)
    } else if (e.key === 'Escape') {
      setText((item.properties.text as string) || '')
      setIsEditing(false)
    } else if (e.key === 'Backspace' && text === '') {
      e.preventDefault()
      onDelete(item.id)
    } else if (e.key === 'Tab') {
      e.preventDefault()
      handleSave()
      if (e.shiftKey) {
        onOutdent(item.id)
      } else {
        onIndent(item.id)
      }
    } else if (e.key === 'ArrowUp' && (e.target as HTMLTextAreaElement).selectionStart === 0) {
      e.preventDefault()
      setFocusedItemId(parentList[index - 1]?.id ?? null)
    } else if (e.key === 'ArrowDown' && (e.target as HTMLTextAreaElement).selectionStart === text.length) {
      e.preventDefault()
      setFocusedItemId(parentList[index + 1]?.id ?? null)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const currentDraggedItem = useDashboardStore.getState().draggedItem
    if (!currentDraggedItem || currentDraggedItem.id === item.id) {
      setDropTarget(null)
      return
    }

    const rect = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - rect.top
    const height = rect.height
    let position: 'above' | 'below' | 'on' = 'on'
    if (y < height * 0.25) position = 'above'
    else if (y > height * 0.75) position = 'below'

    setDropTarget({
      id: item.id,
      position,
      date: item.properties.date as string,
      section: item.type,
    })
  }

  const sharedClasses = cn(
    'w-full py-0.5 px-1 rounded-md text-sm whitespace-pre-wrap break-words',
    item.properties.completed ? 'line-through text-gray-500' : 'text-gray-700 dark:text-gray-200'
  )

  return (
    <>
      <div
        className="relative group"
        draggable
        onDragStart={(e) => onDragStart(e, item)}
        onDragOver={handleDragOver}
        onDragLeave={() => setDropTarget(null)}
        onDragEnd={onDragEnd}
      >
        {dropTarget?.id === item.id && dropTarget.position === 'above' && (
          <div className="absolute -top-1 left-0 w-full h-0.5 bg-blue-500 rounded-full z-10" />
        )}
        <div className="relative flex items-start p-1 pr-14">
          {item.type === 'action' && (
            <input
              type="checkbox"
              checked={!!item.properties.completed}
              onChange={() => onToggle(item.id)}
              className="w-4 h-4 mt-1 mr-3 bg-gray-100 border-gray-300 rounded text-yellow-500 dark:text-emerald-500 focus:ring-yellow-600 dark:focus:ring-emerald-500 cursor-pointer flex-shrink-0"
            />
          )}
          {item.type === 'experience' && <span className="mr-3 mt-1.5 text-gray-400 flex-shrink-0">•</span>}
          {isEditing ? (
            <textarea
              ref={textAreaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onBlur={(e) => {
                 // Prevent blur if we are opening modal
                 if (!isModalOpen) handleSave()
              }}
              onKeyDown={handleKeyDown}
              className={cn(sharedClasses, 'bg-transparent focus:outline-none resize-none overflow-hidden')}
              rows={1}
            />
          ) : (
            <span className={cn(sharedClasses, 'cursor-text block')} onClick={() => setIsEditing(true)}>
              {text || <span className="text-transparent select-none">Empty</span>}
            </span>
          )}
          
          {/* Action Buttons */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full"
              onMouseDown={(e) => {
                e.preventDefault() // prevent input blur
                setIsModalOpen(true)
                setIsEditing(false)
              }}
            >
              <Maximize2 className="w-4 h-4 text-emerald-500" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onDelete(item.id)}
            >
              <X className="w-4 h-4 text-gray-500" />
            </Button>
          </div>
        </div>
        {dropTarget?.id === item.id && dropTarget.position === 'below' && (
          <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-blue-500 rounded-full z-10" />
        )}
        {dropTarget?.id === item.id && dropTarget.position === 'on' && (
          <div className="absolute inset-0 border-2 border-blue-500 rounded-md pointer-events-none z-10" />
        )}
      </div>

      <BlockEditorModal
        isOpen={isModalOpen}
        block={item}
        onClose={() => setIsModalOpen(false)}
        onUpdate={(id, dto) => {
           if (onFullUpdate) {
             onFullUpdate(id, dto)
           } else {
             // Fallback for simple edits if full update isn't passed down yet
             onUpdate(id, dto.properties?.text as string || text)
           }
        }}
        onDelete={() => onDelete(item.id)}
      />
    </>
  )
}
