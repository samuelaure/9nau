import { useState } from 'react'
import { Block } from '@9nau/types'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { EditableItem } from './EditableItem'
import { useDashboardStore } from '@/lib/state/dashboard-store'
import { useCreateBlock, useUpdateBlock, useDeleteBlock } from '@/hooks/use-blocks-api'
import { findItemAndParent, HierarchicalBlock } from '@9nau/core'

interface HierarchicalSectionProps {
  dateStr: string
  sectionType: 'action' | 'experience'
  title: string
  items: HierarchicalBlock[]
}

export function HierarchicalSection({ dateStr, sectionType, title, items }: HierarchicalSectionProps) {
  const [isOpen, setIsOpen] = useState(true)
  const { setDraggedItem, setDropTarget, dropTarget, setFocusedItemId } = useDashboardStore((s) => ({
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

  const handleAdd = (afterId: string | null, parentId: string | null) => {
    const newBlock: Omit<Block, 'id' | 'createdAt' | 'updatedAt'> = {
      type: sectionType,
      parentId,
      properties: { text: '', date: dateStr, status: 'inbox' },
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
      if (newParent) {
        updateBlock.mutate({ id, updateDto: { parentId: newParent.id } }, { onSuccess: () => setFocusedItemId(id) })
      }
    }
  }

  const handleOutdent = (id: string) => {
    const found = findItemAndParent(items, id)
    if (found && found.parent) {
      const grandParentInfo = findItemAndParent(items, found.parent.id)
      const newParentId = grandParentInfo?.parent?.id || null
      updateBlock.mutate({ id, updateDto: { parentId: newParentId } }, { onSuccess: () => setFocusedItemId(id) })
    }
  }

  const handleDragStart = (e: React.DragEvent, item: Block) => {
    e.dataTransfer.effectAllowed = 'move'
    setDraggedItem(item)
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
    setDropTarget(null)
  }

  const handleSectionDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const currentDraggedItem = useDashboardStore.getState().draggedItem
    // Allow dropping notes onto action/experience sections
    if (!currentDraggedItem || (currentDraggedItem.type !== sectionType && currentDraggedItem.type !== 'note')) {
      setDropTarget(null)
      return
    }
    if (isOpen) {
      setDropTarget({
        id: null,
        position: 'end',
        date: dateStr,
        section: sectionType,
      })
    }
  }

  const handleFullUpdate = (id: string, dto: { type?: string; properties?: Record<string, unknown> }) => {
    updateBlock.mutate({
      id,
      updateDto: dto,
    })
  }

  const renderList = (
    itemList: HierarchicalBlock[],
    parentListForContext: HierarchicalBlock[],
    level = 0
  ): JSX.Element => (
    <>
      {itemList.map((item, index) => (
        <div key={item.id} style={{ marginLeft: `${level > 0 ? 1.5 : 0}rem` }}>
          <EditableItem
            item={item}
            onUpdate={handleUpdate}
            onFullUpdate={handleFullUpdate}
            onToggle={handleToggle}
            onAddItem={handleAdd}
            onIndent={handleIndent}
            onOutdent={handleOutdent}
            onDelete={handleDelete}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            parentList={parentListForContext}
            index={index}
          />
          {item.children?.length > 0 && renderList(item.children, item.children, level + 1)}
        </div>
      ))}
    </>
  )

  return (
    <div className="mb-4">
      <button
        className="flex items-center w-full text-left p-2 rounded-md hover:bg-gray-50"
        onClick={() => setIsOpen(!isOpen)}
        onDragOver={handleSectionDragOver}
      >
        {isOpen ? <ChevronDown className="w-4 h-4 mr-2" /> : <ChevronRight className="w-4 h-4 mr-2" />}
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      </button>
      {isOpen && (
        <div className="pl-2 mt-2" onDragOver={handleSectionDragOver}>
          {items.length > 0 ? (
            renderList(items, items)
          ) : (
            <div
              className="text-gray-500 italic text-sm pl-8 cursor-pointer h-10 flex items-center"
              onClick={() => handleAdd(null, null)}
            >
              Click to add an entry.
            </div>
          )}
          {dropTarget?.section === sectionType && dropTarget.position === 'end' && dropTarget.id === null && (
            <div className="relative h-1">
              <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-blue-500 rounded-full z-10" />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
