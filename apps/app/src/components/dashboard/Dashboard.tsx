import { useMemo, useRef, useEffect } from 'react'
import { addDays, subDays, format } from 'date-fns'
import { Block } from '@9nau/types'
import { DailyPeriod } from './DailyPeriod'
import { useDashboardStore } from '@/lib/state/dashboard-store'
import {
  getTodayDateString,
  isDateToday,
  formatDisplayDate,
  HierarchicalBlock,
  findItemAndParent,
  calculateSortOrder,
} from '@9nau/core'
import { Button } from '@9nau/ui/components/button'
import { ChevronsLeft, ChevronsRight, ArrowUp, X } from 'lucide-react'
import { useUpdateBlock } from '@/hooks/use-blocks-api'

interface DashboardProps {
  notesByDate: Map<string, Block[]>
  actions: HierarchicalBlock[]
  experiences: HierarchicalBlock[]
}

export function Dashboard({ notesByDate, actions, experiences }: DashboardProps) {
  const {
    viewMode,
    currentDate,
    setCurrentDate,
    visiblePastDays,
    visibleFutureDays,
    loadMorePastDays,
    showFutureDays,
    hideFutureDays,
    mainContentRef,
    setTodayRef,
    draggedItem,
    dropTarget,
    setDraggedItem,
    setDropTarget,
  } = useDashboardStore((s) => ({
    viewMode: s.viewMode,
    currentDate: s.currentDate,
    setCurrentDate: s.actions.setCurrentDate,
    visiblePastDays: s.visiblePastDays,
    visibleFutureDays: s.visibleFutureDays,
    loadMorePastDays: s.actions.loadMorePastDays,
    showFutureDays: s.actions.showFutureDays,
    hideFutureDays: s.actions.hideFutureDays,
    mainContentRef: s.mainContentRef,
    setTodayRef: s.actions.setTodayRef,
    draggedItem: s.draggedItem,
    dropTarget: s.dropTarget,
    setDraggedItem: s.actions.setDraggedItem,
    setDropTarget: s.actions.setDropTarget,
  }))

  const updateBlock = useUpdateBlock()
  const todayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setTodayRef(todayRef)
  }, [todayRef, setTodayRef])

  useEffect(() => {
    const handleScroll = () => {
      if (viewMode === 'list' && mainContentRef?.current) {
        const { scrollTop, scrollHeight, clientHeight } = mainContentRef.current
        // Load more when user is near the bottom
        if (scrollHeight - scrollTop - clientHeight < 200) {
          loadMorePastDays()
        }
      }
    }
    const mainEl = mainContentRef?.current
    mainEl?.addEventListener('scroll', handleScroll)
    return () => mainEl?.removeEventListener('scroll', handleScroll)
  }, [viewMode, mainContentRef, loadMorePastDays])

  const allGroupedData = useMemo(() => {
    const today = new Date(getTodayDateString() + 'T00:00:00')
    const dateArray = []
    for (let i = visibleFutureDays; i > 0; i--) {
      dateArray.push(addDays(today, i))
    }
    for (let i = 0; i < visiblePastDays; i++) {
      dateArray.push(subDays(today, i))
    }

    return dateArray.map((date) => {
      const dateStr = format(date, 'yyyy-MM-dd')
      const dailyNotes = notesByDate.get(dateStr) || []
      const dailyActions = actions.filter((a) => (a.properties.date as string) === dateStr)
      const dailyExperiences = experiences.filter((e) => (e.properties.date as string) === dateStr)
      return { dateStr, dailyActions, dailyExperiences, dailyNotes }
    })
  }, [notesByDate, actions, experiences, visiblePastDays, visibleFutureDays])

  const handleDrop = () => {
    if (!draggedItem || !dropTarget) {
      return
    }

    // Handle converting a note to an action or experience
    if (draggedItem.type === 'note' && (dropTarget.section === 'action' || dropTarget.section === 'experience')) {
      updateBlock.mutate({
        id: draggedItem.id,
        updateDto: {
          type: dropTarget.section,
          properties: {
            ...draggedItem.properties,
            text: draggedItem.properties.text || '',
            status: 'inbox',
            date: dropTarget.date,
          },
        },
      })
      setDraggedItem(null)
      setDropTarget(null)
      return
    }

    // Prevent dropping an item onto itself
    if (draggedItem.id === dropTarget.id) {
      setDraggedItem(null)
      setDropTarget(null)
      return
    }

    // Prevent dropping a note in the hierarchical sections via this handler
    if (draggedItem.type === 'note') {
      setDraggedItem(null)
      setDropTarget(null)
      return
    }

    const allItems = draggedItem.type === 'action' ? actions : experiences

    // Prevent dropping a parent onto one of its own children
    const isDroppingOnChild = (item: Block, parentId: string | null): boolean => {
      if (!parentId) return false
      if (item.id === parentId) return true
      const parentInfo = findItemAndParent(allItems, parentId)
      if (parentInfo?.parent) {
        return isDroppingOnChild(item, parentInfo.parent.id)
      }
      return false
    }
    if (isDroppingOnChild(draggedItem, dropTarget.id)) {
      setDraggedItem(null)
      setDropTarget(null)
      return
    }

    let newParentId: string | null = draggedItem.parentId
    let newSortOrder: number | undefined = undefined
    const newProperties: Record<string, unknown> = {}

    if (dropTarget.id) {
      // Dropping on or near another item
      const targetItemInfo = findItemAndParent(allItems, dropTarget.id)
      if (!targetItemInfo) {
        console.error('Could not find target item info for drop.')
        return
      }

      if (dropTarget.position === 'on') {
        newParentId = targetItemInfo.item.id
        const lastChild = targetItemInfo.item.children?.[targetItemInfo.item.children.length - 1]
        newSortOrder = (lastChild?.properties.sortOrder || 0) + 1
      } else if (dropTarget.position === 'above' || dropTarget.position === 'below') {
        newParentId = targetItemInfo.parent?.id ?? null
        newSortOrder = calculateSortOrder(targetItemInfo.parentList, targetItemInfo.index, dropTarget.position)
      }
    } else {
      // Dropping at the end of a section
      newParentId = null // Root level for the day
      const rootItems = allItems.filter(
        (i) => i.id !== draggedItem.id && !i.parentId && i.properties.date === dropTarget.date
      )
      const lastRootItem = rootItems[rootItems.length - 1]
      newSortOrder = (lastRootItem?.properties.sortOrder || 0) + 1
    }

    if ((draggedItem.properties.date as string) !== dropTarget.date) {
      newProperties.date = dropTarget.date
      // When moving to a new date, it becomes a root item unless dropped specifically 'on' another item
      if (dropTarget.position !== 'on') {
        newParentId = null
      }
    }

    const hasChanged =
      newParentId !== draggedItem.parentId ||
      (newSortOrder !== undefined && newSortOrder !== (draggedItem.properties.sortOrder as number)) ||
      Object.keys(newProperties).length > 0

    if (hasChanged) {
      updateBlock.mutate({
        id: draggedItem.id,
        updateDto: {
          parentId: newParentId,
          properties: { ...newProperties, sortOrder: newSortOrder },
        },
      })
    }

    setDraggedItem(null)
    setDropTarget(null)
  }

  const containerProps = {
    onDrop: handleDrop,
    'data-testid': 'dashboard-main-content',
    className: 'relative',
  }

  if (viewMode === 'horizontal') {
    const dateStr = format(currentDate, 'yyyy-MM-dd')
    const dataForDay = {
      dailyActions: actions.filter((a) => (a.properties.date as string) === dateStr),
      dailyExperiences: experiences.filter((e) => (e.properties.date as string) === dateStr),
      dailyNotes: notesByDate.get(dateStr) || [],
    }

    return (
      <div {...containerProps}>
        <div className="flex items-center justify-center space-x-1 mb-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentDate(subDays(currentDate, 1))}
            aria-label="Previous Day"
          >
            <ChevronsLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-base font-semibold text-gray-700 w-56 text-center">
            {formatDisplayDate(format(currentDate, 'yyyy-MM-dd'))}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentDate(addDays(currentDate, 1))}
            aria-label="Next Day"
          >
            <ChevronsRight className="w-4 h-4" />
          </Button>
        </div>
        <div ref={isDateToday(dateStr) ? todayRef : null}>
          <DailyPeriod showHeader={false} dateStr={dateStr} {...dataForDay} />
        </div>
      </div>
    )
  }

  return (
    <div {...containerProps} className="space-y-6 relative">
      <div className="flex items-center justify-center text-gray-500">
        <button
          onClick={() => showFutureDays()}
          className="flex-grow flex items-center justify-center hover:text-gray-700 transition-colors p-1.5 rounded-lg hover:bg-gray-100"
        >
          <ArrowUp className="w-4 h-4" />
          <span className="ml-2 text-[10px] font-semibold tracking-wider uppercase">Future</span>
        </button>
        {visibleFutureDays > 0 && (
          <button
            onClick={hideFutureDays}
            className="ml-2 text-sm font-semibold p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            title="Hide Future"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      {allGroupedData.map(({ dateStr, dailyActions, dailyExperiences, dailyNotes }) => (
        <div key={dateStr} ref={isDateToday(dateStr) ? todayRef : null}>
          <DailyPeriod
            dateStr={dateStr}
            dailyActions={dailyActions}
            dailyExperiences={dailyExperiences}
            dailyNotes={dailyNotes}
          />
        </div>
      ))}
    </div>
  )
}
