'use client'

import { useState } from 'react'
import { Button } from '@9nau/ui/components/button'
import { Input } from '@9nau/ui/components/input'
import { Plus, ChevronDown, ChevronRight, Users, Building2, Globe } from 'lucide-react'
import {
  useGetWorkspaces,
  useCreateWorkspace,
  useGetBrands,
  useCreateBrand,
  useGetMembers,
  Workspace,
} from '@/hooks/use-workspaces-api'

export default function PlatformSettingsPage() {
  const { data: workspaces, isLoading } = useGetWorkspaces()
  const createWorkspace = useCreateWorkspace()

  const [newWsName, setNewWsName] = useState('')
  const [expandedWs, setExpandedWs] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Record<string, 'brands' | 'members'>>({})

  const handleCreateWorkspace = async () => {
    if (!newWsName.trim()) return
    await createWorkspace.mutateAsync({ name: newWsName.trim() })
    setNewWsName('')
  }

  if (isLoading) {
    return <div className="p-8 text-gray-500 dark:text-gray-400">Loading workspaces…</div>
  }

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Platform Workspaces</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Manage your organizations and their brands from this central control plane.
        </p>
      </div>

      {/* Create new workspace */}
      <div className="flex gap-2">
        <Input
          placeholder="New workspace name…"
          value={newWsName}
          onChange={(e) => setNewWsName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreateWorkspace()}
        />
        <Button onClick={handleCreateWorkspace} disabled={createWorkspace.isPending}>
          <Plus className="w-4 h-4 mr-1" /> Create
        </Button>
      </div>

      {/* Workspace list */}
      <div className="space-y-3">
        {(workspaces ?? []).map((ws) => (
          <WorkspaceCard
            key={ws.id}
            workspace={ws}
            isExpanded={expandedWs === ws.id}
            onToggle={() => setExpandedWs(expandedWs === ws.id ? null : ws.id)}
            activeTab={activeTab[ws.id] ?? 'brands'}
            onTabChange={(tab) => setActiveTab((prev) => ({ ...prev, [ws.id]: tab }))}
          />
        ))}
        {(workspaces ?? []).length === 0 && (
          <p className="text-center text-sm text-gray-400 py-8">No workspaces yet. Create one above.</p>
        )}
      </div>
    </div>
  )
}

function WorkspaceCard({
  workspace,
  isExpanded,
  onToggle,
  activeTab,
  onTabChange,
}: {
  workspace: Workspace
  isExpanded: boolean
  onToggle: () => void
  activeTab: 'brands' | 'members'
  onTabChange: (tab: 'brands' | 'members') => void
}) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Building2 className="w-4 h-4 text-gray-400" />
          <span className="font-medium text-gray-900 dark:text-white">{workspace.name}</span>
          <span className="text-xs text-gray-400 capitalize bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded-full">
            {workspace.role}
          </span>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4">
          {/* Tab switcher */}
          <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700 mt-3 mb-4">
            {(['brands', 'members'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => onTabChange(tab)}
                className={`pb-2 text-sm font-medium capitalize border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {tab === 'brands' ? <><Globe className="inline w-3.5 h-3.5 mr-1" />Brands</> : <><Users className="inline w-3.5 h-3.5 mr-1" />Members</>}
              </button>
            ))}
          </div>

          {activeTab === 'brands' && <BrandsPanel workspaceId={workspace.id} />}
          {activeTab === 'members' && <MembersPanel workspaceId={workspace.id} />}
        </div>
      )}
    </div>
  )
}

function BrandsPanel({ workspaceId }: { workspaceId: string }) {
  const { data: brands, isLoading } = useGetBrands(workspaceId)
  const createBrand = useCreateBrand(workspaceId)
  const [newName, setNewName] = useState('')
  const [newTz, setNewTz] = useState('UTC')

  const handleCreate = async () => {
    if (!newName.trim()) return
    await createBrand.mutateAsync({ name: newName.trim(), timezone: newTz })
    setNewName('')
    setNewTz('UTC')
  }

  return (
    <div className="space-y-3">
      {isLoading ? (
        <p className="text-sm text-gray-400">Loading brands…</p>
      ) : (
        <ul className="space-y-1">
          {(brands ?? []).map((b) => (
            <li key={b.id} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <span className="text-sm text-gray-800 dark:text-gray-200">{b.name}</span>
              <span className="text-xs text-gray-400">{b.timezone}</span>
            </li>
          ))}
          {(brands ?? []).length === 0 && (
            <li className="text-xs text-gray-400 italic">No brands yet.</li>
          )}
        </ul>
      )}

      <div className="flex gap-2 pt-1">
        <Input
          placeholder="Brand name…"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="text-sm"
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
        />
        <Input
          placeholder="Timezone (UTC)"
          value={newTz}
          onChange={(e) => setNewTz(e.target.value)}
          className="text-sm w-36"
        />
        <Button size="sm" onClick={handleCreate} disabled={createBrand.isPending}>
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  )
}

function MembersPanel({ workspaceId }: { workspaceId: string }) {
  const { data: members, isLoading } = useGetMembers(workspaceId)

  if (isLoading) return <p className="text-sm text-gray-400">Loading members…</p>

  return (
    <ul className="space-y-1">
      {(members ?? []).map((m) => (
        <li key={m.id} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50">
          <div>
            <span className="text-sm text-gray-800 dark:text-gray-200">{m.user.name ?? m.user.email}</span>
            <span className="text-xs text-gray-400 ml-2">{m.user.email}</span>
          </div>
          <span className="text-xs capitalize text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
            {m.role}
          </span>
        </li>
      ))}
      {(members ?? []).length === 0 && (
        <li className="text-xs text-gray-400 italic">No members found.</li>
      )}
    </ul>
  )
}
