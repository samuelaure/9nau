import { useMemo, useRef, useEffect } from 'react';
import { addDays, subDays } from 'date-fns';
import { Block } from '@9nau/types';
import { DailyPeriod } from './DailyPeriod';
import { useDashboardStore } from '@/lib/state/dashboard-store';
import {
  getTodayDateString,
  isDateToday,
  formatDisplayDate,
} from '@9nau/core';
import { Button } from '@9nau/ui/components/button';
import { ChevronsLeft, ChevronsRight } from 'lucide-react';

interface DashboardProps {
  notesByDate: Map<string, Block[]>;
  actions: Block[];
  experiences: Block[];
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
    loadMorePastDays,
  } = useDashboardStore(s => ({
    viewMode: s.viewMode,
    currentDate: s.currentDate,
    setCurrentDate: s.actions.setCurrentDate,
    visiblePastDays: s.visiblePastDays,
    loadMorePastDays: s.actions.loadMorePastDays,
  }));

  const mainRef = useDashboardStore(s => s.mainContentRef);
  const todayRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    useDashboardStore.setState({ todayRef });
  }, [todayRef]);

  useEffect(() => {
    const handleScroll = () => {
      if (viewMode === 'list' && mainRef?.current) {
        const { scrollTop, scrollHeight, clientHeight } = mainRef.current;
        if (scrollHeight - scrollTop - clientHeight < 200) {
          loadMorePastDays();
        }
      }
    };
    const mainEl = mainRef?.current;
    mainEl?.addEventListener('scroll', handleScroll);
    return () => mainEl?.removeEventListener('scroll', handleScroll);
  }, [viewMode, mainRef, loadMorePastDays]);

  const allGroupedData = useMemo(() => {
    const todayStr = getTodayDateString();
    const dateArray = [];
    for (let i = 0; i < visiblePastDays; i++) {
      dateArray.push(subDays(new Date(todayStr), i));
    }

    const allDates = new Set([
      ...dateArray.map(d => getTodayDateString()),
      ...Array.from(notesByDate.keys()),
      ...actions.map(a => getTodayDateString()),
      ...experiences.map(e => getTodayDateString()),
    ]);

    return Array.from(allDates)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .map(dateStr => {
        const dailyNotes = notesByDate.get(dateStr) || [];
        const dailyActions = actions.filter(
          a => getTodayDateString() === dateStr
        );
        const dailyExperiences = experiences.filter(
          e => getTodayDateString() === dateStr
        );
        return { dateStr, dailyActions, dailyExperiences, dailyNotes };
      });
  }, [notesByDate, actions, experiences, visiblePastDays]);

  if (viewMode === 'horizontal') {
    const dateStr = getTodayDateString();
    const dataForDay = {
      dailyActions: actions.filter(a => getTodayDateString() === dateStr),
      dailyExperiences: experiences.filter(e => getTodayDateString() === dateStr),
      dailyNotes: notesByDate.get(dateStr) || [],
    };

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
            {formatDisplayDate(getTodayDateString())}
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
          <DailyPeriod
            showHeader={false}
            dateStr={dateStr}
            {...dataForDay}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
  );
}