'use client'

import React, { useState, useMemo } from 'react'
import { useGetBlocks } from '@/hooks/use-blocks-api'
import { Block } from '@9nau/types'
import { ChevronLeft, ChevronRight, Calendar, Sparkles, BookOpen, FileText } from 'lucide-react'
import { Button } from '@9nau/ui/components/button'
import { cn } from '@9nau/ui/lib/utils'

type PeriodType = 'day' | 'week' | 'month' | 'year'

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0] as string
}

function getDateRange(date: Date, period: PeriodType): { start: Date; end: Date } {
  const d = new Date(date)
  switch (period) {
    case 'day':
      return { start: new Date(d.setHours(0, 0, 0, 0)), end: new Date(new Date(d).setHours(23, 59, 59, 999)) }
    case 'week': {
      const dayOfWeek = d.getDay()
      const diff = d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
      const start = new Date(d.setDate(diff))
      start.setHours(0, 0, 0, 0)
      const end = new Date(start)
      end.setDate(end.getDate() + 6)
      end.setHours(23, 59, 59, 999)
      return { start, end }
    }
    case 'month': {
      const start = new Date(d.getFullYear(), d.getMonth(), 1)
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
      return { start, end }
    }
    case 'year': {
      const start = new Date(d.getFullYear(), 0, 1)
      const end = new Date(d.getFullYear(), 11, 31, 23, 59, 59, 999)
      return { start, end }
    }
  }
}

function navigate(date: Date, period: PeriodType, direction: -1 | 1): Date {
  const d = new Date(date)
  switch (period) {
    case 'day':
      d.setDate(d.getDate() + direction)
      break
    case 'week':
      d.setDate(d.getDate() + 7 * direction)
      break
    case 'month':
      d.setMonth(d.getMonth() + direction)
      break
    case 'year':
      d.setFullYear(d.getFullYear() + direction)
      break
  }
  return d
}

function formatPeriodTitle(date: Date, period: PeriodType): string {
  const opts: Intl.DateTimeFormatOptions = {}
  switch (period) {
    case 'day':
      return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    case 'week': {
      const range = getDateRange(date, 'week')
      return `Semana del ${range.start.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} al ${range.end.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}`
    }
    case 'month':
      return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
    case 'year':
      return `Año ${date.getFullYear()}`
  }
}

export function JournalView() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [period, setPeriod] = useState<PeriodType>('day')

  const { data: allBlocks, isLoading } = useGetBlocks({})

  const { entries, summaries } = useMemo(() => {
    if (!allBlocks) return { entries: [], summaries: [] }
    const range = getDateRange(currentDate, period)

    const inRange = allBlocks.filter((b: Block) => {
      const d = new Date(b.createdAt)
      return d >= range.start && d <= range.end
    })

    const entries = inRange
      .filter((b: Block) => b.type === 'journal_entry' || b.type === 'note' || b.type === 'action')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

    const summaries = inRange
      .filter((b: Block) => b.type === 'journal_summary')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return { entries, summaries }
  }, [allBlocks, currentDate, period])

  const handleNavigate = (direction: -1 | 1) => {
    setCurrentDate(navigate(currentDate, period, direction))
  }

  const periodButtons: { value: PeriodType; label: string }[] = [
    { value: 'day', label: 'Día' },
    { value: 'week', label: 'Semana' },
    { value: 'month', label: 'Mes' },
    { value: 'year', label: 'Año' },
  ]

  return (
    <div className="max-w-4xl mx-auto">
      {/* Period Selector */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Journal</h1>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {periodButtons.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                period === p.value
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mb-8">
        <Button variant="ghost" size="icon" onClick={() => handleNavigate(-1)}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <button
          onClick={() => setCurrentDate(new Date())}
          className="text-lg font-semibold text-gray-800 dark:text-gray-100 capitalize hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
        >
          {formatPeriodTitle(currentDate, period)}
        </button>
        <Button variant="ghost" size="icon" onClick={() => handleNavigate(1)}>
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {isLoading && (
        <div className="text-center text-gray-500 dark:text-gray-400 mt-10">Cargando datos...</div>
      )}

      {/* Summaries (Synthesis + Summary hierarchy) */}
      {summaries.length > 0 && (
        <div className="mb-8 space-y-4">
          {summaries.map((summary: Block) => {
            const props = summary.properties as any
            return (
              <div
                key={summary.id}
                className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl p-6 border border-emerald-200/50 dark:border-emerald-800/50"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                    {(props.periodType as string) || 'Resumen'}
                  </span>
                </div>
                {props.synthesis && (
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-emerald-800 dark:text-emerald-200 mb-1">✨ Síntesis</h3>
                    <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                      {props.synthesis as string}
                    </p>
                  </div>
                )}
                {props.summary && (
                  <div>
                    <h3 className="text-sm font-bold text-teal-800 dark:text-teal-200 mb-1">📝 Resumen</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed whitespace-pre-wrap">
                      {props.summary as string}
                    </p>
                  </div>
                )}
                {(props.highlights as string[])?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(props.highlights as string[]).map((h, i) => (
                      <span key={i} className="px-2 py-1 bg-emerald-100 dark:bg-emerald-800/40 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-medium">
                        {h}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Chronological Entries */}
      {entries.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Entradas ({entries.length})
            </span>
          </div>
          {entries.map((entry: Block) => {
            const props = entry.properties as any
            const text = (props.summary || props.text || props.name || '') as string
            const time = new Date(entry.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
            const source = (props.source as string) || entry.source || ''

            return (
              <div
                key={entry.id}
                className="flex items-start gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow group"
              >
                <div className="flex flex-col items-center">
                  <span className="text-xs font-mono text-gray-400 dark:text-gray-500">{time}</span>
                  <div className={cn(
                    'w-2 h-2 rounded-full mt-1',
                    entry.type === 'journal_entry' ? 'bg-emerald-400' :
                    entry.type === 'action' ? 'bg-blue-400' : 'bg-gray-300 dark:bg-gray-600'
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">{text || 'Sin contenido'}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase">
                      {entry.type === 'journal_entry' ? '📓 Journal' : entry.type === 'action' ? '⚡ Action' : '📝 Note'}
                    </span>
                    {source && (
                      <span className="text-[10px] text-gray-300 dark:text-gray-600">• {source}</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        !isLoading && (
          <div className="text-center py-16">
            <BookOpen className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-400 dark:text-gray-500">No hay entradas para este período</p>
          </div>
        )
      )}
    </div>
  )
}
