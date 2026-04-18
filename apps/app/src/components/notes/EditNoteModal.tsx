import { useState, useEffect, useRef } from 'react'
import { useUpdateBlock, useDeleteBlock } from '@/hooks/use-blocks-api'
import { Button } from '@9nau/ui/components/button'
import { useDashboardStore } from '@/lib/state/dashboard-store'
import { MoreVertical } from 'lucide-react'

export function EditNoteModal() {
  const { editingNote, setEditingNoteId } = useDashboardStore((s) => ({
    editingNote: s.editingNote,
    setEditingNoteId: s.actions.setEditingNoteId,
  }))

  const [text, setText] = useState('')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const textAreaRef = useRef<HTMLTextAreaElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  const updateBlock = useUpdateBlock()
  const deleteBlock = useDeleteBlock()

  useEffect(() => {
    if (editingNote) {
      setText(editingNote.properties.text as string)
    }
  }, [editingNote])

  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = 'auto'
      textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`
    }
  }, [text])

  useEffect(() => {
    if (textAreaRef.current && editingNote) {
      textAreaRef.current.style.height = 'auto'
      textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`
    }
  }, [editingNote])

  const handleSaveAndClose = () => {
    if (editingNote && text.trim() !== editingNote.properties.text) {
      updateBlock.mutate({
        id: editingNote.id,
        updateDto: { properties: { text: text.trim() } },
      })
    }
    setEditingNoteId(null)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (editingNote) {
      deleteBlock.mutate(editingNote.id)
      setEditingNoteId(null)
    }
  }

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsMenuOpen((prev) => !prev)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const targetNode = event.target as Node

      if (modalRef.current && !modalRef.current.contains(targetNode)) {
        handleSaveAndClose()
      }

      if (
        isMenuOpen &&
        menuRef.current &&
        !menuRef.current.contains(targetNode) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(targetNode)
      ) {
        setIsMenuOpen(false)
      }
    }
    if (editingNote) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [editingNote, text, isMenuOpen])

  if (!editingNote) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl p-4 pb-1 w-full max-w-xl flex flex-col"
        style={{ maxHeight: '85vh' }}
      >
        <textarea
          key={editingNote.id}
          ref={textAreaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full resize-none outline-none text-base"
          style={{ maxHeight: 'calc(85vh - 8rem)' }}
          rows={1}
          autoFocus
        />
        <div className="flex justify-end items-center mt-2 flex-shrink-0">
          <div className="relative">
            <Button
              ref={menuButtonRef}
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={handleMenuClick}
            >
              <MoreVertical className="w-4 h-4 text-gray-500" />
            </Button>
            {isMenuOpen && (
              <div
                ref={menuRef}
                className="absolute bottom-full left-0 mb-1 w-32 bg-white rounded-md shadow-lg border z-10"
              >
                <Button
                  variant="ghost"
                  className="w-full justify-start text-sm text-red-600 hover:text-red-600 hover:bg-red-50"
                  onClick={handleDelete}
                >
                  Delete note
                </Button>
              </div>
            )}
          </div>
          <Button onClick={handleSaveAndClose} variant="ghost">
            Done
          </Button>
        </div>
      </div>
    </div>
  )
}
