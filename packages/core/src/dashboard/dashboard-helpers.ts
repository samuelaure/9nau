import { Block } from '@9nau/types'
import { format, isToday } from 'date-fns'

export type HierarchicalBlock = Block & {
  properties: {
    text: string
    sortOrder: number
    date: string
    [key: string]: unknown
  }
  children: HierarchicalBlock[]
}

/**
 * Takes a flat array of blocks and builds a nested hierarchy based on parentId.
 * It also sorts the children based on the `sortOrder` property.
 * @param blocks - The flat array of blocks.
 * @returns An array of root-level blocks, each with a populated `children` array.
 */
export function buildHierarchy(blocks: Block[]): HierarchicalBlock[] {
  const blocksMap = new Map<string, HierarchicalBlock>()
  const roots: HierarchicalBlock[] = []

  blocks.forEach((block) => {
    blocksMap.set(block.id, {
      ...block,
      properties: block.properties as HierarchicalBlock['properties'],
      children: [],
    })
  })

  blocks.forEach((block) => {
    if (block.parentId && blocksMap.has(block.parentId)) {
      const parent = blocksMap.get(block.parentId)
      if (parent) {
        parent.children.push(blocksMap.get(block.id)!)
      }
    } else {
      roots.push(blocksMap.get(block.id)!)
    }
  })

  const sortChildrenRecursive = (node: HierarchicalBlock) => {
    if (node.children && node.children.length > 0) {
      node.children.sort(
        (a, b) => (a.properties.sortOrder || 0) - (b.properties.sortOrder || 0)
      )
      node.children.forEach(sortChildrenRecursive)
    }
  }

  roots.sort(
    (a, b) => (a.properties.sortOrder || 0) - (b.properties.sortOrder || 0)
  )
  roots.forEach(sortChildrenRecursive)

  return roots
}

/**
 * Groups blocks by their date property in 'yyyy-MM-dd' format.
 * @param blocks - The array of blocks to group.
 * @returns A Map where keys are date strings and values are arrays of blocks.
 */
export function groupBlocksByDate(blocks: Block[]): Map<string, Block[]> {
  const grouped = new Map<string, Block[]>()
  blocks.forEach((block) => {
    const dateKey =
      (block.properties.date as string) ||
      format(new Date(block.createdAt), 'yyyy-MM-dd')
    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, [])
    }
    grouped.get(dateKey)!.push(block)
  })
  return grouped
}

/**
 * Formats a date string for display.
 * @param dateStr - A date string (e.g., '2023-10-27').
 * @returns A formatted date string (e.g., '27/10/2023, Friday').
 */
export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr + 'T00:00:00')
  return format(date, 'dd/MM/yyyy, EEEE')
}

/**
 * Gets the date string for today in 'yyyy-MM-dd' format.
 */
export const getTodayDateString = () => format(new Date(), 'yyyy-MM-dd')

/**
 * Checks if a given date string corresponds to today.
 * @param dateStr - The date string to check.
 */
export const isDateToday = (dateStr: string) =>
  isToday(new Date(dateStr + 'T00:00:00'))
