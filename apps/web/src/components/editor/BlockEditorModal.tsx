import React, { useState, useEffect } from 'react'
import { Block, UpdateBlockDto } from '@9nau/types'
import { X, Calendar, Tag, Folder, Link2, Type, Trash, MapPin } from 'lucide-react'
import { Button } from '@9nau/ui/components/button'
import { cn } from '@9nau/ui/lib/utils'

interface BlockEditorModalProps {
  block: Block | null
  isOpen: boolean
  onClose: () => void
  onUpdate: (id: string, updateDto: UpdateBlockDto) => void
  onDelete: (id: string) => void
}

export function BlockEditorModal({ block, isOpen, onClose, onUpdate, onDelete }: BlockEditorModalProps) {
  const [text, setText] = useState('')
  const [type, setType] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [schedule, setSchedule] = useState('')
  const [projectItem, setProjectItem] = useState('')

  useEffect(() => {
    if (block) {
      const props = block.properties as Record<string, unknown>
      setText((props.text || props.summary || props.name || '') as string)
      setType(block.type)
      setTags((props.tags as string[]) || [])
      setSchedule((props.schedule as string) || '')
      setProjectItem((props.project as string) || '')
    }
  }, [block])

  if (!isOpen || !block) return null

  const handleSave = () => {
    const props = block.properties as Record<string, unknown>
    const newProps = {
      ...props,
      text,
      tags: tags.length > 0 ? tags : undefined,
      schedule: schedule || undefined,
      project: projectItem || undefined,
    }
    
    // Clean undefined
    Object.keys(newProps).forEach(k => newProps[k] === undefined && delete newProps[k])

    onUpdate(block.id, {
      type,
      properties: newProps,
    })
    onClose()
  }

  const handleDelete = () => {
    onDelete(block.id)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Type className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Editor de Bloque</h2>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Main Content Area */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Contenido</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 min-h-[150px] resize-y"
              placeholder="Escribe el contenido..."
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Meta - Type */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Tipo de Bloque</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                <option value="note">Nota</option>
                <option value="action">Acción</option>
                <option value="experience">Experiencia</option>
                <option value="content_idea">Idea de Contenido</option>
                <option value="journal_entry">Journal Entry</option>
              </select>
            </div>

            {/* Meta - Schedule */}
            <div>
              <label className="block flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                <Calendar className="w-4 h-4" /> Schedule (RRULE)
              </label>
              <input
                type="text"
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                placeholder="Ex: FREQ=DAILY"
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>

            {/* Meta - Project */}
            <div>
              <label className="block flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                <Folder className="w-4 h-4" /> Proyecto / Entidad
              </label>
              <input
                type="text"
                value={projectItem}
                onChange={(e) => setProjectItem(e.target.value)}
                placeholder="Nombre del proyecto..."
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>

            {/* Meta - Tags */}
            <div>
              <label className="block flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                <Tag className="w-4 h-4" /> Etiquetas (csv)
              </label>
              <input
                type="text"
                value={tags.join(', ')}
                onChange={(e) => setTags(e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                placeholder="vlog, coding..."
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
          </div>
          
          <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
             <label className="block flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                <Link2 className="w-4 h-4" /> Relaciones Linkeadas
              </label>
              <p className="text-sm text-gray-400 italic">No hay relaciones adjuntas en este momento.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800">
          <Button variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={handleDelete}>
            <Trash className="w-4 h-4 mr-2" /> Eliminar
          </Button>
          <div className="space-x-3">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Guardar Cambios
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
