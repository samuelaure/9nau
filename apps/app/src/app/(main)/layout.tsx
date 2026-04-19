'use client'

import { Header } from '@/components/layout/header'
import { Sidebar } from '@/components/layout/sidebar'
import { useUiStore } from '@/lib/state/ui-store'
import React, { useState, useEffect, useRef } from 'react'
import { cn } from '@9nau/ui/lib/utils'
import { useDashboardStore } from '@/lib/state/dashboard-store'
import { Button } from '@9nau/ui/components/button'
import { TelegramLinkBanner } from '@9nau/ui'
import { ArrowUp } from 'lucide-react'
import { isDateToday } from '@9nau/core'
import { format } from 'date-fns'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.9nau.com'
const BOT_USERNAME = process.env.NEXT_PUBLIC_BOT_USERNAME ?? 'zazu_bot'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const isSidebarOpen = useUiStore((s) => s.isSidebarOpen)
  const [isScrolled, setIsScrolled] = useState(false)
  const mainRef = useRef<HTMLDivElement>(null)

  const { todayRef, viewMode, currentDate, actions, setMainContentRef } = useDashboardStore((s) => ({
    todayRef: s.todayRef,
    viewMode: s.viewMode,
    currentDate: s.currentDate,
    actions: s.actions,
    setMainContentRef: s.actions.setMainContentRef,
  }))
  const [showGoToToday, setShowGoToToday] = useState(false)
  const [showGoToTop, setShowGoToTop] = useState(false)

  useEffect(() => {
    setMainContentRef(mainRef)
  }, [mainRef, setMainContentRef])

  useEffect(() => {
    const mainEl = mainRef.current
    if (!mainEl) return

    const handleScroll = () => {
      const scrolled = mainEl.scrollTop > 10
      setIsScrolled(scrolled)
      setShowGoToTop(scrolled)

      if (viewMode === 'list' && todayRef?.current) {
        const rect = todayRef.current.getBoundingClientRect()
        const mainRect = mainEl.getBoundingClientRect()
        setShowGoToToday(rect.top < mainRect.top || rect.bottom > mainRect.bottom)
      }
    }

    mainEl.addEventListener('scroll', handleScroll)
    return () => mainEl.removeEventListener('scroll', handleScroll)
  }, [viewMode, todayRef])

  useEffect(() => {
    if (viewMode === 'horizontal') {
      const isNotToday = !isDateToday(format(currentDate, 'yyyy-MM-dd'))
      setShowGoToToday(isNotToday)
      setShowGoToTop(false)
    } else {
      // Initial check for list view
      const mainEl = mainRef.current
      if (mainEl && todayRef?.current) {
        const rect = todayRef.current.getBoundingClientRect()
        const mainRect = mainEl.getBoundingClientRect()
        setShowGoToToday(rect.top < mainRect.top || rect.bottom > mainRect.bottom)
      }
    }
  }, [viewMode, currentDate, todayRef])

  const handleGoToToday = () => {
    if (viewMode === 'list' && todayRef?.current) {
      todayRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    } else if (viewMode === 'horizontal') {
      actions.setCurrentDate(new Date())
    }
  }

  const handleGoToTop = () => {
    mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-gray-950 font-sans text-gray-900 dark:text-gray-100">
      <TelegramLinkBanner apiUrl={API_URL} botUsername={BOT_USERNAME} />
      <Header isScrolled={isScrolled} />
      <div className="flex-1 flex pt-16 overflow-hidden">
        <Sidebar />
        <main
          ref={mainRef}
          className={cn('flex-1 p-4 md:p-8 bg-white dark:bg-gray-950 transition-all duration-300 overflow-y-auto')}
          style={{ marginLeft: isSidebarOpen ? '288px' : '80px' }}
        >
          {children}
        </main>
      </div>
      <div className="fixed bottom-8 right-8 z-50 flex flex-col space-y-2">
        {showGoToToday && (
          <Button onClick={handleGoToToday} variant="secondary" className="shadow-lg">
            Today
          </Button>
        )}
        {showGoToTop && viewMode === 'list' && (
          <Button
            onClick={handleGoToTop}
            size="icon"
            className="bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90"
          >
            <ArrowUp className="w-6 h-6" />
          </Button>
        )}
      </div>
    </div>
  )
}
