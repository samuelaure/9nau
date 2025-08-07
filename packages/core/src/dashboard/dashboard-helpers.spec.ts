import {
  buildHierarchy,
  groupBlocksByDate,
  calculateSortOrder,
  findItemAndParent,
  removeItemFromTree,
  formatDisplayDate,
  getTodayDateString,
  isDateToday,
  HierarchicalBlock,
} from './dashboard-helpers'
import { Block } from '@9nau/types'

// Mock date-fns's isToday and format for consistent testing
jest.mock('date-fns', () => ({
  ...jest.requireActual('date-fns'),
  isToday: jest.fn((date: Date) => {
    const today = new Date('2025-08-05T00:00:00') // Fixed date for testing
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    )
  }),
  format: jest.fn((date: Date, fmt: string) => {
    if (fmt === 'yyyy-MM-dd') {
      return '2025-08-05' // Fixed date for testing
    }
    return jest.requireActual('date-fns').format(date, fmt)
  }),
}))

describe('dashboard-helpers', () => {
  const mockBlocks: Block[] = [
    {
      id: '1',
      type: 'action',
      parentId: null,
      properties: { text: 'Root A', sortOrder: 10, date: '2025-08-05' },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      type: 'action',
      parentId: '1',
      properties: { text: 'Child A1', sortOrder: 20, date: '2025-08-05' },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '3',
      type: 'action',
      parentId: '1',
      properties: { text: 'Child A2', sortOrder: 15, date: '2025-08-05' },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '4',
      type: 'action',
      parentId: null,
      properties: { text: 'Root B', sortOrder: 5, date: '2025-08-04' },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '5',
      type: 'action',
      parentId: '4',
      properties: { text: 'Child B1', sortOrder: 10, date: '2025-08-04' },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '6',
      type: 'note',
      parentId: null,
      properties: { text: 'Note 1', date: '2025-08-05', status: 'inbox' },
      createdAt: new Date('2025-08-05T10:00:00Z'),
      updatedAt: new Date(),
    },
    {
      id: '7',
      type: 'note',
      parentId: null,
      properties: { text: 'Note 2', date: '2025-08-04', status: 'inbox' },
      createdAt: new Date('2025-08-04T10:00:00Z'),
      updatedAt: new Date(),
    },
    {
      id: '8',
      type: 'experience',
      parentId: null,
      properties: { text: 'Exp 1', sortOrder: 1, date: '2025-08-05' },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]

  describe('buildHierarchy', () => {
    it('should build a correct hierarchy and sort children', () => {
      const hierarchy = buildHierarchy(mockBlocks.filter((b) => b.type === 'action'))

      expect(hierarchy).toHaveLength(2)
      expect(hierarchy[0]!.id).toBe('4') // Root B (sortOrder 5)
      expect(hierarchy[1]!.id).toBe('1') // Root A (sortOrder 10)

      expect(hierarchy[0]!.children).toHaveLength(1)
      expect(hierarchy[0]!.children[0]!.id).toBe('5') // Child B1

      expect(hierarchy[1]!.children).toHaveLength(2)
      expect(hierarchy[1]!.children[0]!.id).toBe('3') // Child A2 (sortOrder 15)
      expect(hierarchy[1]!.children[1]!.id).toBe('2') // Child A1 (sortOrder 20)
    })

    it('should handle empty input array', () => {
      expect(buildHierarchy([])).toEqual([])
    })

    it('should handle blocks with no children', () => {
      const singleLevelBlocks: Block[] = [
        {
          id: '1',
          type: 'action',
          parentId: null,
          properties: { text: 'Root A', sortOrder: 10, date: '2025-08-05' },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          type: 'action',
          parentId: null,
          properties: { text: 'Root B', sortOrder: 5, date: '2025-08-05' },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]
      const hierarchy = buildHierarchy(singleLevelBlocks)
      expect(hierarchy).toHaveLength(2)
      expect(hierarchy[0]!.id).toBe('2')
      expect(hierarchy[1]!.id).toBe('1')
      expect(hierarchy[0]!.children).toEqual([])
      expect(hierarchy[1]!.children).toEqual([])
    })
  })

  describe('groupBlocksByDate', () => {
    it('should group blocks by their date property', () => {
      const grouped = groupBlocksByDate(mockBlocks.filter((b) => b.type === 'note' || b.type === 'action'))

      expect(grouped.size).toBe(2)
      expect(grouped.has('2025-08-05')).toBe(true)
      expect(grouped.has('2025-08-04')).toBe(true)

      const blocksOnAug5 = grouped.get('2025-08-05')
      expect(blocksOnAug5).toHaveLength(4) // Root A, Child A1, Child A2, Note 1
      expect(blocksOnAug5?.some((b) => b.id === '1')).toBe(true)
      expect(blocksOnAug5?.some((b) => b.id === '2')).toBe(true)
      expect(blocksOnAug5?.some((b) => b.id === '3')).toBe(true)
      expect(blocksOnAug5?.some((b) => b.id === '6')).toBe(true)

      const blocksOnAug4 = grouped.get('2025-08-04')
      expect(blocksOnAug4).toHaveLength(3) // Root B, Child B1, Note 2
      expect(blocksOnAug4?.some((b) => b.id === '4')).toBe(true)
      expect(blocksOnAug4?.some((b) => b.id === '5')).toBe(true)
      expect(blocksOnAug4?.some((b) => b.id === '7')).toBe(true)
    })

    it('should use createdAt date if properties.date is missing', () => {
      const blockWithoutDate: Block = {
        id: '9',
        type: 'note',
        parentId: null,
        properties: { text: 'No date' },
        createdAt: new Date('2025-08-03T12:00:00Z'),
        updatedAt: new Date(),
      }
      const grouped = groupBlocksByDate([blockWithoutDate])
      expect(grouped.has('2025-08-03')).toBe(true)
      expect(grouped.get('2025-08-03')).toHaveLength(1)
    })

    it('should handle empty input array', () => {
      expect(groupBlocksByDate([])).toEqual(new Map())
    })
  })

  describe('formatDisplayDate', () => {
    it('should format a date string correctly', () => {
      expect(formatDisplayDate('2025-08-05')).toBe('05/08/2025, Tuesday')
    })

    it('should return empty string for undefined input', () => {
      expect(formatDisplayDate(undefined)).toBe('')
    })

    it('should handle invalid date strings gracefully (though new Date() handles many)', () => {
      // This will likely result in "Invalid Date" but format still tries
      expect(formatDisplayDate('invalid-date')).toBe('Invalid Date, Invalid Date')
    })
  })

  describe('getTodayDateString', () => {
    it("should return today's date string in yyyy-MM-dd format", () => {
      // Mocked date-fns.format will return '2025-08-05'
      expect(getTodayDateString()).toBe('2025-08-05')
    })
  })

  describe('isDateToday', () => {
    it("should return true for today's date string", () => {
      // Mocked isToday will return true for '2025-08-05'
      expect(isDateToday('2025-08-05')).toBe(true)
    })

    it('should return false for a different date string', () => {
      expect(isDateToday('2025-08-04')).toBe(false)
    })

    it('should handle date strings with different time components (still today)', () => {
      expect(isDateToday('2025-08-05T10:30:00Z')).toBe(true)
    })
  })

  describe('findItemAndParent', () => {
    const hierarchicalBlocks: HierarchicalBlock[] = buildHierarchy(mockBlocks.filter((b) => b.type === 'action'))

    it('should find a root item and its null parent', () => {
      const result = findItemAndParent(hierarchicalBlocks, '1')
      expect(result).not.toBeNull()
      expect(result?.item.id).toBe('1')
      expect(result?.parent).toBeNull()
      expect(result?.parentList).toEqual(hierarchicalBlocks)
      expect(result?.index).toBe(1)
    })

    it('should find a child item and its parent', () => {
      const result = findItemAndParent(hierarchicalBlocks, '2')
      expect(result).not.toBeNull()
      expect(result?.item.id).toBe('2')
      expect(result?.parent?.id).toBe('1')
      expect(result?.parentList[0]!.id).toBe('3') // Parent's children list
      expect(result?.index).toBe(1)
    })

    it('should return null if item is not found', () => {
      expect(findItemAndParent(hierarchicalBlocks, 'non-existent-id')).toBeNull()
    })

    it('should correctly identify parentList for nested children', () => {
      const rootA = hierarchicalBlocks.find((b) => b.id === '1')

      const result = findItemAndParent(rootA?.children || [], '2', rootA || null)
      expect(result?.parentList).toEqual(rootA?.children)
    })
  })

  describe('removeItemFromTree', () => {
    const initialHierarchy: HierarchicalBlock[] = buildHierarchy(mockBlocks.filter((b) => b.type === 'action'))

    it('should remove a root item', () => {
      const { newItems, removedItem } = removeItemFromTree(initialHierarchy, '1')
      expect(newItems).toHaveLength(1)
      expect(newItems[0]!.id).toBe('4')
      expect(removedItem?.id).toBe('1')
    })

    it('should remove a child item', () => {
      const { newItems, removedItem } = removeItemFromTree(initialHierarchy, '2')
      const updatedRootA = newItems.find((b) => b.id === '1')
      expect(updatedRootA?.children).toHaveLength(1)
      expect(updatedRootA?.children[0]!.id).toBe('3')
      expect(removedItem?.id).toBe('2')
    })

    it('should return original tree if item is not found', () => {
      const { newItems, removedItem } = removeItemFromTree(initialHierarchy, 'non-existent-id')
      expect(newItems).toEqual(initialHierarchy)
      expect(removedItem).toBeNull()
    })

    it('should handle removing from an empty tree', () => {
      const { newItems, removedItem } = removeItemFromTree([], 'some-id')
      expect(newItems).toEqual([])
      expect(removedItem).toBeNull()
    })
  })

  describe('calculateSortOrder', () => {
    const siblings: HierarchicalBlock[] = [
      {
        id: 's1',
        type: 'action',
        parentId: null,
        properties: { text: 'Sibling 1', sortOrder: 10, date: 'd' },
        createdAt: new Date(),
        updatedAt: new Date(),
        children: [],
      },
      {
        id: 's2',
        type: 'action',
        parentId: null,
        properties: { text: 'Sibling 2', sortOrder: 20, date: 'd' },
        createdAt: new Date(),
        updatedAt: new Date(),
        children: [],
      },
      {
        id: 's3',
        type: 'action',
        parentId: null,
        properties: { text: 'Sibling 3', sortOrder: 30, date: 'd' },
        createdAt: new Date(),
        updatedAt: new Date(),
        children: [],
      },
    ]

    it('should calculate sortOrder for "above" the first item', () => {
      const newSortOrder = calculateSortOrder(siblings, 0, 'above')
      expect(newSortOrder).toBe(5) // (0 + 10) / 2
    })

    it('should calculate sortOrder for "above" a middle item', () => {
      const newSortOrder = calculateSortOrder(siblings, 1, 'above')
      expect(newSortOrder).toBe(15) // (10 + 20) / 2
    })

    it('should calculate sortOrder for "below" the last item', () => {
      const newSortOrder = calculateSortOrder(siblings, 2, 'below')
      expect(newSortOrder).toBe(31) // 30 + 1 (arbitrary, but greater than 30)
    })

    it('should calculate sortOrder for "below" a middle item', () => {
      const newSortOrder = calculateSortOrder(siblings, 1, 'below')
      expect(newSortOrder).toBe(25) // (20 + 30) / 2
    })

    it('should handle edge case: targetIndex 0, position below (first item in list)', () => {
      const newSortOrder = calculateSortOrder(siblings, 0, 'below')
      expect(newSortOrder).toBe(15) // (10 + 20) / 2
    })

    it('should handle edge case: single item, position above', () => {
      const singleSibling = [siblings[0]!]
      const newSortOrder = calculateSortOrder(singleSibling, 0, 'above')
      expect(newSortOrder).toBe(5) // (0 + 10) / 2
    })

    it('should handle edge case: single item, position below', () => {
      const singleSibling = [siblings[0]!]
      const newSortOrder = calculateSortOrder(singleSibling, 0, 'below')
      expect(newSortOrder).toBe(11) // 10 + 1
    })
  })
})
