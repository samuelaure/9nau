import { useState, useEffect, useRef } from 'react';
import { useUpdateBlock } from '@/hooks/use-blocks-api';
import { Button } from '@9nau/ui/components/button';
import { useDashboardStore } from '@/lib/state/dashboard-store';

export function EditNoteModal() {
  const { editingNote, setEditingNoteId } = useDashboardStore(s => ({
    editingNote: s.editingNote,
    setEditingNoteId: s.actions.setEditingNoteId,
  }));

  const [text, setText] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const updateBlock = useUpdateBlock();

  useEffect(() => {
    if (editingNote) {
      setText(editingNote.properties.text as string);
    }
  }, [editingNote]);

  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = 'auto';
      textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
    }
  }, [text]);

  useEffect(() => {
    if (textAreaRef.current && editingNote) {
      textAreaRef.current.style.height = 'auto';
      textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
    }
  }, [editingNote]);

  const handleSaveAndClose = () => {
    if (editingNote && text.trim() !== editingNote.properties.text) {
      updateBlock.mutate({
        id: editingNote.id,
        updateDto: { properties: { text: text.trim() } },
      });
    }
    setEditingNoteId(null);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        handleSaveAndClose();
      }
    };
    if (editingNote) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [editingNote, text, handleSaveAndClose]);

  if (!editingNote) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl p-4 w-full max-w-xl flex flex-col"
        style={{ maxHeight: '85vh' }}
      >
        <textarea
          key={editingNote.id}
          ref={textAreaRef}
          value={text}
          onChange={e => setText(e.target.value)}
          className="w-full resize-none outline-none text-base"
          style={{ maxHeight: 'calc(85vh - 8rem)' }}
          rows={1}
          autoFocus
        />
        <div className="flex justify-end mt-2 flex-shrink-0">
          <Button onClick={handleSaveAndClose} variant="ghost">
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
