"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, useRef, useEffect } from 'react';
import { EditNoteModal } from '@/components/notes/EditNoteModal';
import { useDashboardStore } from '@/lib/state/dashboard-store';
import { Button } from '@9nau/ui/components/button';
import { ArrowUp } from 'lucide-react';
import { cn } from "@9nau/ui/lib/utils";

export function AppProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(() => new QueryClient());
  const mainContentRef = useRef<HTMLDivElement>(null);

  const { todayRef, viewMode, currentDate, actions: { setMainContentRef, setTodayRef } } = useDashboardStore(s => ({
    todayRef: s.todayRef,
    viewMode: s.viewMode,
    currentDate: s.currentDate,
    actions: s.actions,
  }));
  const [showGoToToday, setShowGoToToday] = useState(false);
  const [showGoToTop, setShowGoToTop] = useState(false);

  useEffect(() => {
    setMainContentRef(mainContentRef);
  }, [mainContentRef, setMainContentRef]);

  useEffect(() => {
    const mainEl = mainContentRef.current;
    if (!mainEl) return;
    const handleScroll = () => {
      const isScrolled = mainEl.scrollTop > 300;
      setShowGoToTop(isScrolled);
      if (viewMode === 'list' && todayRef?.current) {
        const rect = todayRef.current.getBoundingClientRect();
        const mainRect = mainEl.getBoundingClientRect();
        setShowGoToToday(rect.top < mainRect.top || rect.bottom > mainRect.bottom);
      }
    };
    if (viewMode === 'list') {
      mainEl.addEventListener('scroll', handleScroll);
    } else {
      const isNotToday = new Date(currentDate).toDateString() !== new Date().toDateString();
      setShowGoToToday(isNotToday);
      setShowGoToTop(false);
    }
    return () => mainEl.removeEventListener('scroll', handleScroll);
  }, [viewMode, currentDate, todayRef]);

  const handleGoToToday = () => {
    const { viewMode, todayRef, actions } = useDashboardStore.getState();
    if (viewMode === 'list' && todayRef?.current) {
      todayRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (viewMode === 'horizontal') {
      actions.setCurrentDate(new Date());
    }
  };

  const handleGoToTop = () => {
    mainContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };


  return (
    <QueryClientProvider client={queryClient}>
      <div ref={mainContentRef} className={cn("h-full", viewMode === 'list' ? 'overflow-y-auto' : 'overflow-y-hidden')}>
        {children}
        <EditNoteModal />
        <div className="fixed bottom-8 right-8 z-50 flex flex-col space-y-2">
          {showGoToToday && <Button onClick={handleGoToToday} variant="secondary" className="shadow-lg">Today</Button>}
          {showGoToTop && <Button onClick={handleGoToTop} size="icon" className="bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90"><ArrowUp className="w-6 h-6" /></Button>}
        </div>
      </div>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
