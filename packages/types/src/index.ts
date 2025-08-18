/**
 * The conceptual representation of a Block.
 * This is the single source of truth for the shape of Block data
 * used throughout the front-end and back-end logic.
 */
export interface Block {
  id: string
  type: string
  properties: Record<string, unknown>
  parentId: string | null
  createdAt: Date
  updatedAt: Date
  schedule?: Schedule
}

/**
 * The conceptual representation of a Relation between two Blocks.
 */
export interface Relation {
  id: string
  fromBlockId: string
  toBlockId: string
  type: string
  properties: Record<string, unknown>
}

/**
 * The Data Transfer Object interface for creating a new Block.
 * This defines the strict contract for the request body sent from the
 * front-end to the back-end's create endpoint.
 */
export interface CreateBlockDto {
  type: string
  parentId?: string | null
  properties: Record<string, unknown>
}

/**
 * The Data Transfer Object interface for updating an existing Block.
 */
export interface UpdateBlockDto {
  type?: string
  properties?: Record<string, unknown>
  parentId?: string | null
}

/**
 * The conceptual representation of a Schedule for a Block.
 */
export interface Schedule {
  id: string
  blockId: string
  startDate: string
  endDate?: string | null
  rrule?: string | null
  completedAt?: string | null
}

/**
 * The Data Transfer Object interface for creating or updating a Schedule.
 */
export interface UpsertScheduleDto {
  blockId: string
  startDate: string
  endDate?: string | null
  rrule?: string | null
}
