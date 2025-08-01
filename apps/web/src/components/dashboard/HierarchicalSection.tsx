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

    let newParentId: string | null = null;
    let newSortOrder: number | undefined;

    // Handle drops within the same section
    if (draggedItem.type === dropTarget.section) {
      if (dropTarget.position === 'on') {
        newParentId = dropTarget.id
        // For new children, sort order is not crucial as it will be handled by the backend
      } else {
        const targetItemInfo = findItemAndParent(items, dropTarget.id!);
        if (targetItemInfo) {
          newParentId = targetItemInfo.parent?.id || null;
          // Calculate new sort order based on position relative to target
          const targetIndex = targetItemInfo.parentList.findIndex(item => item.id === dropTarget.id);
          const siblingIds = targetItemInfo.parentList.map(item => item.id);
          let newSiblingIds: string[];

          if (dropTarget.position === 'above') {
            newSiblingIds = [
              ...siblingIds.slice(0, targetIndex),
              draggedItem.id,
              ...siblingIds.slice(targetIndex)
            ];
          } else { // 'below'
            newSiblingIds = [
              ...siblingIds.slice(0, targetIndex + 1),
              draggedItem.id,
              ...siblingIds.slice(targetIndex + 1)
            ];
          }

          // The sort order is a bit tricky with Prisma and JSONB.
          // A simplified approach is to re-assign sort order for all siblings after the drag.
          // For now, let's just update the parentId and rely on the backend to handle a basic sort.
          // A more robust implementation would re-calculate all sibling sortOrders on the client.
        } else {
          // Dropping on the section header or end of list
          newParentId = null;
        }
      }
    }

    if (draggedItem.id === newParentId) return 

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
      {itemList.map((item, index) => (
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
            parentList={itemList}
            index={index}
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
              onClick={() => handleAdd(null, null)}
            >
              Click to add an entry.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
