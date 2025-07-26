// The atomic unit of the 9naŭ system. Everything is a Block.
export interface Block {
  id: string;
  type: string; // e.g., 'page', 'inbox', 'paragraph', 'action'
  properties: Record<string, any>; // Type-specific data, e.g., { "title": "My new action" }
  contentIds: string[]; // Ordered list of child block IDs
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Defines the relationship (the "connective tissue") between two blocks.
export interface Relation {
  id: string;
  fromBlockId: string; // The source of the relation
  toBlockId: string;   // The target of the relation
  type: string; // e.g., 'contains', 'supports', 'references'
  properties: Record<string, any>; // Optional metadata for the relation itself
}