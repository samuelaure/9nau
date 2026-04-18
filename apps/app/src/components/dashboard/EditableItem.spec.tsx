import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { EditableItem } from './EditableItem'
import { useDashboardStore } from '@/lib/state/dashboard-store'
import { HierarchicalBlock } from '@9nau/core'
import React from 'react'

jest.mock('@/lib/state/dashboard-store')

const useDashboardStoreMock = useDashboardStore as unknown as jest.Mock

const mockItem: HierarchicalBlock = {
  id: 'item-1',
  type: 'action',
  parentId: null,
  properties: { text: 'Test item', sortOrder: 1, date: '2025-08-05', completed: false },
  createdAt: new Date(),
  updatedAt: new Date(),
  children: [],
}

const mockParentList: HierarchicalBlock[] = [
  mockItem,
  { ...mockItem, id: 'item-2', properties: { ...mockItem.properties, text: 'Next item' } },
]

describe('EditableItem', () => {
  const mockOnUpdate = jest.fn()
  const mockOnToggle = jest.fn()
  const mockOnAddItem = jest.fn()
  const mockOnIndent = jest.fn()
  const mockOnOutdent = jest.fn()
  const mockOnDelete = jest.fn()
  const mockOnDragStart = jest.fn()
  const mockOnDragEnd = jest.fn()

  const setDropTarget = jest.fn()
  const setFocusedItemId = jest.fn()

  beforeEach(() => {
    useDashboardStoreMock.mockImplementation((selector) =>
      selector({
        dropTarget: null,
        draggedItem: null,
        focusedItemId: null,
        actions: {
          setDropTarget,
          setFocusedItemId,
        },
      })
    )
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.clearAllMocks()
    jest.useRealTimers()
  })

  it('renders correctly in view mode', () => {
    render(
      <EditableItem
        item={mockItem}
        onUpdate={mockOnUpdate}
        onToggle={mockOnToggle}
        onAddItem={mockOnAddItem}
        onIndent={mockOnIndent}
        onOutdent={mockOnOutdent}
        onDelete={mockOnDelete}
        onDragStart={mockOnDragStart}
        onDragEnd={mockOnDragEnd}
        parentList={mockParentList}
        index={0}
      />
    )
    expect(screen.getByText('Test item')).toBeInTheDocument()
  })

  it('switches to edit mode on click and back on blur', () => {
    render(
      <EditableItem
        item={mockItem}
        onUpdate={mockOnUpdate}
        onToggle={mockOnToggle}
        onAddItem={mockOnAddItem}
        onIndent={mockOnIndent}
        onOutdent={mockOnOutdent}
        onDelete={mockOnDelete}
        onDragStart={mockOnDragStart}
        onDragEnd={mockOnDragEnd}
        parentList={mockParentList}
        index={0}
      />
    )
    fireEvent.click(screen.getByText('Test item'))
    const textarea = screen.getByDisplayValue('Test item')
    expect(textarea).toBeInTheDocument()
    fireEvent.blur(textarea)
    expect(screen.queryByDisplayValue('Test item')).not.toBeInTheDocument()
  })

  it('calls onUpdate on blur if text has changed', () => {
    render(
      <EditableItem
        item={mockItem}
        onUpdate={mockOnUpdate}
        onToggle={mockOnToggle}
        onAddItem={mockOnAddItem}
        onIndent={mockOnIndent}
        onOutdent={mockOnOutdent}
        onDelete={mockOnDelete}
        onDragStart={mockOnDragStart}
        onDragEnd={mockOnDragEnd}
        parentList={mockParentList}
        index={0}
      />
    )
    fireEvent.click(screen.getByText('Test item'))
    const textarea = screen.getByDisplayValue('Test item')
    fireEvent.change(textarea, { target: { value: 'Updated text' } })
    fireEvent.blur(textarea)
    expect(mockOnUpdate).toHaveBeenCalledWith('item-1', 'Updated text')
  })

  it('calls onDelete on backspace when text is empty', () => {
    const emptyItem = { ...mockItem, properties: { ...mockItem.properties, text: '' } }
    render(
      <EditableItem
        item={emptyItem}
        onUpdate={mockOnUpdate}
        onToggle={mockOnToggle}
        onAddItem={mockOnAddItem}
        onIndent={mockOnIndent}
        onOutdent={mockOnOutdent}
        onDelete={mockOnDelete}
        onDragStart={mockOnDragStart}
        onDragEnd={mockOnDragEnd}
        parentList={mockParentList}
        index={0}
      />
    )
    fireEvent.click(screen.getByText('Empty'))
    const textarea = screen.getByDisplayValue('')
    fireEvent.keyDown(textarea, { key: 'Backspace' })
    expect(mockOnDelete).toHaveBeenCalledWith('item-1')
  })

  it('calls onAddItem on Enter key press', () => {
    render(
      <EditableItem
        item={mockItem}
        onUpdate={mockOnUpdate}
        onToggle={mockOnToggle}
        onAddItem={mockOnAddItem}
        onIndent={mockOnIndent}
        onOutdent={mockOnOutdent}
        onDelete={mockOnDelete}
        onDragStart={mockOnDragStart}
        onDragEnd={mockOnDragEnd}
        parentList={mockParentList}
        index={0}
      />
    )
    fireEvent.click(screen.getByText('Test item'))
    const textarea = screen.getByDisplayValue('Test item')
    fireEvent.keyDown(textarea, { key: 'Enter' })
    expect(mockOnAddItem).toHaveBeenCalledWith('item-1', null)
  })

  it('calls onDelete when the delete button is clicked', () => {
    render(
      <EditableItem
        item={mockItem}
        onUpdate={mockOnUpdate}
        onToggle={mockOnToggle}
        onAddItem={mockOnAddItem}
        onIndent={mockOnIndent}
        onOutdent={mockOnOutdent}
        onDelete={mockOnDelete}
        onDragStart={mockOnDragStart}
        onDragEnd={mockOnDragEnd}
        parentList={mockParentList}
        index={0}
      />
    )
    const deleteButton = screen.getByRole('button')
    fireEvent.click(deleteButton)
    expect(mockOnDelete).toHaveBeenCalledWith('item-1')
  })
})
