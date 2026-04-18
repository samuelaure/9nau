'use client'

import { Menu, Search, Settings, List, Columns } from 'lucide-react'
import { useUiActions, useUiStore } from '@/lib/state/ui-store'
import { useDashboardStore } from '@/lib/state/dashboard-store'
import { Button } from '@9nau/ui/components/button'
import { Input } from '@9nau/ui/components/input'
import { cn } from '@9nau/ui/lib/utils'

interface HeaderProps {
  isScrolled: boolean
}

export function Header({ isScrolled }: HeaderProps) {
  const { toggleSidebar } = useUiActions()
  const { viewMode, setViewMode } = useDashboardStore((s) => ({
    viewMode: s.viewMode,
    setViewMode: s.actions.setViewMode,
  }))
  const currentView = useUiStore((s) => s.activeView)

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 flex items-center h-16 border-b px-4 flex-shrink-0 bg-white z-30 transition-shadow duration-200',
        isScrolled && 'shadow-md'
      )}
    >
      <Button variant="ghost" size="icon" onClick={toggleSidebar} className="mr-2">
        <Menu className="h-6 w-6 text-gray-600" />
      </Button>
      <div className="flex items-center">
        <span className="text-2xl text-gray-700 ml-2 font-semibold">9naŭ</span>
      </div>
      <div className="flex-1 mx-8">
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
          <Input
            type="text"
            placeholder="Search..."
            className="w-full bg-gray-100 border-transparent rounded-lg pl-12 pr-4 focus:bg-white focus:shadow-md"
          />
        </div>
      </div>
      <div className="flex items-center space-x-1">
        {currentView === 'home' && (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode('list')}
              className={cn(viewMode === 'list' && 'bg-slate-200')}
            >
              <List className="h-5 w-5 text-gray-600" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode('horizontal')}
              className={cn(viewMode === 'horizontal' && 'bg-slate-200')}
            >
              <Columns className="h-5 w-5 text-gray-600" />
            </Button>
          </>
        )}
      </div>
      <Button variant="ghost" size="icon">
        <Settings className="h-6 w-6 text-gray-600" />
      </Button>
    </header>
  )
}
