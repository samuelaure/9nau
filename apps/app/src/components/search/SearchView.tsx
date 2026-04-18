'use client'

import React, { useState, useMemo } from 'react'
import { useGetBlocks } from '@/hooks/use-blocks-api'
import { Block } from '@9nau/types'
import { Search as SearchIcon, Filter, X } from 'lucide-react'
import { Button } from '@9nau/ui/components/button'
import { cn } from '@9nau/ui/lib/utils'
import { useUiStore, useUiActions } from '@/lib/state/ui-store'

type FilterType = 'all' | 'note' | 'action' | 'journal_entry' | 'journal_summary' | 'experience' | 'content_idea'

const FILTER_OPTIONS: { value: FilterType; label: string; emoji: string }[] = [
  { value: 'all', label: 'Todo', emoji: '🔍' },
  { value: 'note', label: 'Notas', emoji: '📝' },
  { value: 'action', label: 'Acciones', emoji: '⚡' },
  { value: 'journal_entry', label: 'Journal', emoji: '📓' },
  { value: 'journal_summary', label: 'Resúmenes', emoji: '✨' },
  { value: 'experience', label: 'Experiencias', emoji: '☕' },
  { value: 'content_idea', label: 'Ideas', emoji: '💡' },
]

export function SearchView() {
  const searchQuery = useUiStore((s) => s.searchQuery)
  const { setSearchQuery } = useUiActions()
  const [typeFilter, setTypeFilter] = useState<FilterType>('all')
  const { data: allBlocks } = useGetBlocks({})

  const results = useMemo(() => {
    if (!allBlocks || !searchQuery.trim()) return []

    const query = searchQuery.toLowerCase()

    return allBlocks
      .filter((b: Block) => {
        // Type filter
        if (typeFilter !== 'all' && b.type !== typeFilter) return false

        // Text search across properties
        const props = b.properties as Record<string, unknown>
        const searchableFields = [
          props.text,
          props.summary,
          props.name,
          props.synthesis,
          props.note,
        ]
          .filter(Boolean)
          .map((f) => String(f).toLowerCase())

        return searchableFields.some((field) => field.includes(query))
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 50) // Cap at 50 results
  }, [allBlocks, searchQuery, typeFilter])

  return (
    <div className="max-w-4xl mx-auto">
      {/* Search Bar */}
      <div className="relative mb-6">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar en todo tu segundo cerebro..."
          autoFocus
          className="w-full pl-12 pr-12 py-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-lg transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Type Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setTypeFilter(opt.value)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium transition-all border',
              typeFilter === opt.value
                ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            )}
          >
            {opt.emoji} {opt.label}
          </button>
        ))}
      </div>

      {/* Results */}
      {searchQuery.trim() ? (
        <>
          <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">
            {results.length} resultado{results.length !== 1 ? 's' : ''}
          </div>
          <div className="space-y-2">
            {results.map((block: Block) => {
              const props = block.properties as Record<string, unknown>
              const text = (props.summary || props.text || props.name || props.synthesis || '') as string
              const date = new Date(block.createdAt).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })

              // Highlight matching text
              const highlightText = (txt: string) => {
                if (!searchQuery.trim()) return txt
                const idx = txt.toLowerCase().indexOf(searchQuery.toLowerCase())
                if (idx === -1) return txt.substring(0, 200)
                const start = Math.max(0, idx - 60)
                const end = Math.min(txt.length, idx + searchQuery.length + 60)
                const before = txt.substring(start, idx)
                const match = txt.substring(idx, idx + searchQuery.length)
                const after = txt.substring(idx + searchQuery.length, end)
                return (
                  <>
                    {start > 0 && '...'}
                    {before}
                    <mark className="bg-yellow-200 dark:bg-yellow-700/50 text-inherit rounded px-0.5">{match}</mark>
                    {after}
                    {end < txt.length && '...'}
                  </>
                )
              }

              return (
                <div
                  key={block.id}
                  className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      {block.type.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-gray-400">{date}</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {highlightText(text)}
                  </p>
                </div>
              )
            })}
          </div>
          {results.length === 0 && (
            <div className="text-center py-16">
              <SearchIcon className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-400 dark:text-gray-500">No se encontraron resultados para &quot;{searchQuery}&quot;</p>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16">
          <SearchIcon className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-400 dark:text-gray-500">Escribe para buscar en tus notas, acciones y journal</p>
        </div>
      )}
    </div>
  )
}
