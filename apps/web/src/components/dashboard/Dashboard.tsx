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
} from '@9nau/core'
import { Button } from '@9nau/ui/components/button'
import { ChevronsLeft, ChevronsRight, ArrowUp, X } from 'lucide-react'

interface DashboardProps {
  notesByDate: Map<string, Block[]>
  actions: HierarchicalBlock[]
  experiences: HierarchicalBlock[]
}

export function Dashboard({
  notesByDate,
  actions,
  experiences,
}: DashboardProps) {
  const {
    viewMode,
    currentDate,
    setCurrentDate,
    visiblePastDays,
    visibleFutureDays,
    loadMorePastDays,
    showFutureDays,
    hideFutureDays,
  } = useDashboardStore((s) => ({
    viewMode: s.viewMode,
    currentDate: s.currentDate,
    setCurrentDate: s.actions.setCurrentDate,
    visiblePastDays: s.visiblePastDays,
    visibleFutureDays: s.visibleFutureDays,
    loadMorePastDays: s.actions.loadMorePastDays,
    showFutureDays: s.actions.showFutureDays,
    hideFutureDays: s.actions.hideFutureDays,
  }))

  const mainRef = useDashboardStore((s) => s.mainContentRef)
  const todayRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    useDashboardStore.setState({ todayRef })
  }, [todayRef])

  useEffect(() => {
    const handleScroll = () => {
      if (viewMode === 'list' && mainRef?.current) {
        const { scrollTop, scrollHeight, clientHeight } = mainRef.current
        // Load more when user is near the bottom
        if (scrollHeight - scrollTop - clientHeight < 200) {
          loadMorePastDays()
        }
      }
    }
    const mainEl = mainRef?.current
    mainEl?.addEventListener('scroll', handleScroll)
    return () => mainEl?.removeEventListener('scroll', handleScroll)
  }, [viewMode, mainRef, loadMorePastDays])

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
      const dailyActions = actions.filter(
        (a) => (a.properties.date as string) === dateStr
      )
      const dailyExperiences = experiences.filter(
        (e) => (e.properties.date as string) === dateStr
      )
      return { dateStr, dailyActions, dailyExperiences, dailyNotes }
    })
  }, [
    notesByDate,
    actions,
    experiences,
    visiblePastDays,
    visibleFutureDays,
  ])

  if (viewMode === 'horizontal') {
    const dateStr = format(currentDate, 'yyyy-MM-dd')
    const dataForDay = {
      dailyActions: actions.filter((a) => (a.properties.date as string) === dateStr),
      dailyExperiences: experiences.filter(
        (e) => (e.properties.date as string) === dateStr
      ),
      dailyNotes: notesByDate.get(dateStr) || [],
    }

    return (
      <div>
        <div className="flex items-center justify-center space-x-1 mb-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentDate(subDays(currentDate, 1))}
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
    <div className="space-y-6">
      <div className="flex items-center justify-center text-gray-500">
        <button
          onClick={() => showFutureDays(7)}
          className="flex-grow flex items-center justify-center hover:text-gray-700 transition-colors p-1.5 rounded-lg hover:bg-gray-100"
        >
          <ArrowUp className="w-4 h-4" />
          <span className="ml-2 text-[10px] font-semibold tracking-wider uppercase">
            Future
          </span>
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
      {allGroupedData.map(
        ({ dateStr, dailyActions, dailyExperiences, dailyNotes }) => (
          <div key={dateStr} ref={isDateToday(dateStr) ? todayRef : null}>
            <DailyPeriod
              dateStr={dateStr}
              dailyActions={dailyActions}
              dailyExperiences={dailyExperiences}
              dailyNotes={dailyNotes}
            />
          </div>
        )
      )}
    </div>
  )
}
