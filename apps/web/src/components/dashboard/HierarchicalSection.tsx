import { useState } from 'react'
import { Block } from '@9nau/types'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { EditableItem } from './EditableItem'
import { useDashboardStore } from '@/lib/state/dashboard-store'
import {
  useCreateBlock,
  useUpdateBlock,
  useDeleteBlock,
} from '@/hooks/use-blocks-api'
import { findItemAndParent, HierarchicalBlock } from '@9nau/core'

interface HierarchicalSectionProps {
  dateStr: string
  sectionType: 'action' | 'experience'
  title: string
  items: HierarchicalBlock[]
}

export function HierarchicalSection({
  dateStr,
  sectionType,
  title,
  items,
}: HierarchicalSectionProps) {
  const [isOpen, setIsOpen] = useState(true)
  const {
    setDraggedItem,
    setDropTarget,
    draggedItem,
    dropTarget,
    setFocusedItemId,
  } = useDashboardStore((s) => ({
    setDraggedItem: s.actions.setDraggedItem,
    setDropTarget: s.actions.setDropTarget,
    draggedItem: s.draggedItem,
    dropTarget: s.dropTarget,
    setFocusedItemId: s.actions.setFocusedItemId,
  }))

  const createBlock = useCreateBlock()
  const updateBlock = useUpdateBlock()
  const deleteBlock = useDeleteBlock()

  const handleUpdate = (id: string, newText: string) => {
    updateBlock.mutate({
      id,
      updateDto: { properties: { text: newText } },
    })
  }

  const handleToggle = (id: string) => {
    const item = findItemAndParent(items, id)?.item
    if (item) {
      updateBlock.mutate({
        id,
        updateDto: { properties: { completed: !item.properties.completed } },
      })
    }
  }

  const handleAdd = (afterId: string | null) => {
    const parentInfo = afterId ? findItemAndParent(items, afterId) : null
    const parentId = parentInfo?.parent?.id || null
    const newBlock: Omit<Block, 'id' | 'createdAt' | 'updatedAt'> & {
      id?: string
    } = {
      type: sectionType,
      parentId,
      properties: { text: '', date: dateStr },
    }
    createBlock.mutate(newBlock, {
      onSuccess: (createdBlock) => {
        setFocusedItemId(createdBlock.id)
      },
    })
  }

  const handleDelete = (id: string) => {
    deleteBlock.mutate(id)
  }

  const handleIndent = (id: string) => {
    const found = findItemAndParent(items, id)
    if (found && found.index > 0) {
      const newParent = found.parentList[found.index - 1]
      // Ensure newParent is not null/undefined before accessing its id
      if (newParent) {
        updateBlock.mutate(
          { id, updateDto: { parentId: newParent.id } },
          { onSuccess: () => setFocusedItemId(id) }
        )
      }
    }
  }

  const handleOutdent = (id: string) => {
    const found = findItemAndParent(items, id)
    if (found && found.parent) {
      const grandParentInfo = findItemAndParent(items, found.parent.id)
      const newParentId = grandParentInfo?.parent?.id || null
      updateBlock.mutate(
        { id, updateDto: { parentId: newParentId } },
        { onSuccess: () => setFocusedItemId(id) }
      )
    }
  }

  const handleDragStart = (e: React.DragEvent, item: Block) => {
    e.dataTransfer.effectAllowed = 'move'
    setDraggedItem(item)
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
  }

  const handleDrop = () => {
    if (!draggedItem || !dropTarget) return

    let newParentId = draggedItem.parentId
    if (dropTarget.position === 'on') {
      newParentId = dropTarget.id
    } else if (dropTarget.id) {
      const targetInfo = findItemAndParent(items, dropTarget.id)
      newParentId = targetInfo?.parent?.id || null
    } else {
      newParentId = null
    }

    if (draggedItem.id === newParentId) return // Prevent dropping onto self

    updateBlock.mutate({
      id: draggedItem.id,
      updateDto: { parentId: newParentId },
    })
  }

  const renderList = (
    itemList: HierarchicalBlock[],
    level = 0
  ): JSX.Element => (
    <>
      {itemList.map((item) => (
        <div
          key={item.id}
          style={{ marginLeft: `${level > 0 ? 1.5 : 0}rem` }}
        >
          <EditableItem
            item={item}
            onUpdate={handleUpdate}
            onToggle={handleToggle}
            onAddItem={handleAdd}
            onIndent={handleIndent}
            onOutdent={handleOutdent}
            onDelete={handleDelete}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          />
          {item.children?.length > 0 && renderList(item.children, level + 1)}
        </div>
      ))}
    </>
  )

  return (
    <div className="mb-4" onDrop={handleDrop}>
      <button
        className="flex items-center w-full text-left p-2 rounded-md hover:bg-gray-50"
        onClick={() => setIsOpen(!isOpen)}
        onDragOver={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setDropTarget({
            id: null,
            position: 'end',
            date: dateStr,
            section: sectionType,
          })
        }}
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
          onDragOver={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setDropTarget({
              id: null,
              position: 'end',
              date: dateStr,
              section: sectionType,
            })
          }}
        >
          {items.length > 0 ? (
            renderList(items)
          ) : (
            <div
              className="text-gray-500 italic text-sm pl-8 cursor-pointer"
              onClick={() => handleAdd(null)}
            >
              Click to add an entry.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
