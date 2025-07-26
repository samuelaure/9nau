export interface Block {
  id: string
  type: string
  properties: Record<string, unknown>
  contentIds: string[]
  parentId: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Relation {
  id: string
  fromBlockId: string
  toBlockId: string
  type: string
  properties: Record<string, unknown>
}
