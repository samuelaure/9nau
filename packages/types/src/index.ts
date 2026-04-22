// ── Workspace & Brand ─────────────────────────────────────────────────────────

export type WorkspaceRole = 'owner' | 'admin' | 'member'

export interface Brand {
  id: string
  workspaceId: string
  name: string
  timezone: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface WorkspaceMember {
  id: string
  userId: string
  workspaceId: string
  role: WorkspaceRole
  createdAt: string
  user: {
    id: string
    email: string
    name: string | null
  }
}

export interface Workspace {
  id: string
  name: string
  role: WorkspaceRole
  brands: Brand[]
  createdAt: string
  updatedAt: string
}

export interface CreateWorkspaceDto {
  name: string
}

export interface CreateBrandDto {
  name: string
  timezone?: string
}

export interface UpdateBrandDto {
  name?: string
  timezone?: string
  isActive?: boolean
  workspaceId?: string
}

// ── Block ──────────────────────────────────────────────────────────────────────

export interface Block {
  id: string
  type: string
  properties: Record<string, unknown>
  parentId: string | null
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date | null
  uuid: string
  source?: string | null
  sourceRef?: string | null
}

export interface Relation {
  id: string
  fromBlockId: string
  toBlockId: string
  type: string
  properties: Record<string, unknown>
  createdAt: Date
}

export interface Schedule {
  id: string
  blockId: string
  startDate: Date
  endDate?: Date | null
  rrule?: string | null
  completedAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface Event {
  id: string
  blockId: string
  type: string
  metadata: Record<string, unknown>
  createdAt: Date
}

export interface CreateBlockDto {
  type: string
  parentId?: string | null
  properties: Record<string, unknown>
}

export interface UpdateBlockDto {
  type?: string
  properties?: Record<string, unknown>
  parentId?: string | null
}

export interface UpsertScheduleDto {
  blockId: string
  startDate: Date
  endDate?: Date
  rrule?: string
}

export interface SyncPayload {
  cursor: string
  blocks: Block[]
}

export interface SyncResponse {
  nextCursor: string
  acknowledged: string[]
}
