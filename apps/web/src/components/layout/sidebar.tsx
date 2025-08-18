'use client'

import * as React from 'react'
import { useUiStore, useUiActions, View } from '@/lib/state/ui-store'
import { cn } from '@9nau/ui/lib/utils'
import { Button } from '@9nau/ui/components/button'
import { Home, Inbox, Zap, Coffee, Trash2, Archive, Calendar } from 'lucide-react'
import { useUpdateBlock } from '@/hooks/use-blocks-api'

const viewConfig: Record<View, { icon: React.ElementType; title: string }> = {
  home: { icon: Home, title: 'Home' },
  inbox: { icon: Inbox, title: 'Inbox' },
  actions: { icon: Zap, title: 'Actions' },
  experiences: { icon: Coffee, title: 'Experiences' },
  information: { icon: Archive, title: 'Information' },
  schedule: { icon: Calendar, title: 'Schedule' },
  trash: { icon: Trash2, title: 'Trash' },
}

export function Sidebar() {
  const isSidebarOpen = useUiStore((s) => s.isSidebarOpen)
  const activeView = useUiStore((s) => s.activeView)
  const { setView } = useUiActions()
  const updateBlock = useUpdateBlock()
  const [isHoverExpanded, setIsHoverExpanded] = React.useState(false)
  const hoverTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
    if (!isSidebarOpen) {
      setIsHoverExpanded(true)
    }
  }

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHoverExpanded(false)
    }, 150)
  }

  const isExpanded = isSidebarOpen || isHoverExpanded

  const handleNoteDrop = (noteId: string, status: View) => {
    if (status === 'home') return
    updateBlock.mutate({ id: noteId, updateDto: { properties: { status } } })
  }

  return (
    <aside
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'fixed top-16 left-0 h-[calc(100vh-4rem)] bg-white border-r transition-all duration-300 ease-in-out z-20',
        isExpanded ? 'w-72 shadow-lg' : 'w-20'
      )}
    >
      <nav className="p-2 pt-4 flex flex-col h-full">
        <ul className="flex-grow space-y-1">
          {(Object.keys(viewConfig) as View[])
            .filter((key) => !['trash', 'schedule'].includes(key))
            .map((key) => (
              <SidebarItem
                key={key}
                viewKey={key}
                icon={viewConfig[key].icon}
                title={viewConfig[key].title}
                isActive={activeView === key}
                isExpanded={isExpanded}
                onClick={() => setView(key)}
                onDrop={handleNoteDrop}
              />
            ))}
        </ul>
        <ul>
          <SidebarItem
            viewKey="trash"
            icon={viewConfig['trash'].icon}
            title={viewConfig['trash'].title}
            isActive={activeView === 'trash'}
            isExpanded={isExpanded}
            onClick={() => setView('trash')}
            onDrop={handleNoteDrop}
          />
        </ul>
      </nav>
    </aside>
  )
}

interface SidebarItemProps {
  icon: React.ElementType
  title: string
  isActive: boolean
  isExpanded: boolean
  onClick: () => void
  onDrop: (noteId: string, status: View) => void
  viewKey: View
}

function SidebarItem({ icon: Icon, title, isActive, isExpanded, onClick, onDrop, viewKey }: SidebarItemProps) {
  const [isDragOver, setIsDragOver] = React.useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const noteId = e.dataTransfer.getData('text/plain')
    if (noteId) {
      onDrop(noteId, viewKey)
    }
  }

  return (
    <li>
      <Button
        variant={isActive ? 'secondary' : 'ghost'}
        className={cn(
          'w-full flex items-center h-12 text-sm font-medium transition-colors',
          isExpanded ? 'justify-start px-4' : 'justify-center',
          isDragOver && 'bg-blue-100'
        )}
        onClick={onClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Icon className={cn('h-6 w-6', isExpanded && 'mr-4')} />
        {isExpanded && <span>{title}</span>}
      </Button>
    </li>
  )
}
