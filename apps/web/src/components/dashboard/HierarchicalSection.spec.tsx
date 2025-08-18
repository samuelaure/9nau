import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act } from 'react'
import '@testing-library/jest-dom'
import { HierarchicalSection } from './HierarchicalSection'
import { useDashboardStore } from '@/lib/state/dashboard-store'
import { useCreateBlock, useUpdateBlock, useDeleteBlock } from '@/hooks/use-blocks-api'
import { HierarchicalBlock } from '@9nau/core'
import React from 'react'

jest.mock('@/lib/state/dashboard-store')
jest.mock('@/hooks/use-blocks-api')

const queryClient = new QueryClient()
const mockCreateBlock = jest.fn()
const mockUpdateBlock = jest.fn()
const mockDeleteBlock = jest.fn()

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
)

const useDashboardStoreMock = useDashboardStore as unknown as jest.Mock

describe('HierarchicalSection', () => {
  const setDraggedItem = jest.fn()
  const setDropTarget = jest.fn()
  const setFocusedItemId = jest.fn()
  const mockItems: HierarchicalBlock[] = [
    {
      id: 'item-1',
      type: 'action',
      parentId: null,
      properties: { text: 'Root item', sortOrder: 1, date: '2025-08-05' },
      createdAt: new Date(),
      updatedAt: new Date(),
      children: [
        {
          id: 'item-2',
          type: 'action',
          parentId: 'item-1',
          properties: { text: 'Child item', sortOrder: 1, date: '2025-08-05' },
          createdAt: new Date(),
          updatedAt: new Date(),
          children: [],
        },
      ],
    },
  ]

  beforeEach(() => {
    useDashboardStoreMock.mockImplementation((selector) =>
      selector({
        draggedItem: { id: 'dragged-1', type: 'action' },
        dropTarget: null,
        actions: {
          setDraggedItem,
          setDropTarget,
          setFocusedItemId,
        },
      })
    )
    ;(useCreateBlock as jest.Mock).mockReturnValue({ mutate: mockCreateBlock })
    ;(useUpdateBlock as jest.Mock).mockReturnValue({ mutate: mockUpdateBlock })
    ;(useDeleteBlock as jest.Mock).mockReturnValue({ mutate: mockDeleteBlock })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should render the title and items', () => {
    render(<HierarchicalSection dateStr="2025-08-05" sectionType="action" title="Actions" items={mockItems} />, {
      wrapper,
    })
    expect(screen.getByText('Actions')).toBeInTheDocument()
    // Items are rendered as EditableItem which might be in view or edit mode
    // Let's check for the text content instead of display value
    expect(screen.getByText('Root item')).toBeInTheDocument()
    expect(screen.getByText('Child item')).toBeInTheDocument()
  })

  it('should toggle visibility on header click', () => {
    render(<HierarchicalSection dateStr="2025-08-05" sectionType="action" title="Actions" items={mockItems} />, {
      wrapper,
    })
    const toggleButton = screen.getByRole('button', { name: 'Actions' })
    fireEvent.click(toggleButton)
    expect(screen.queryByText('Root item')).not.toBeInTheDocument()
  })

  it('should call createBlock on empty section click', async () => {
    mockCreateBlock.mockImplementationOnce((dto, options) => {
      options.onSuccess({ id: 'new-block-id' })
    })
    render(<HierarchicalSection dateStr="2025-08-05" sectionType="action" title="Actions" items={[]} />, { wrapper })

    act(() => {
      fireEvent.click(screen.getByText('Click to add an entry.'))
    })

    await waitFor(() => {
      expect(mockCreateBlock).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'action',
          parentId: null,
          properties: { text: '', date: '2025-08-05', status: 'inbox' },
        }),
        expect.any(Object)
      )
    })
    expect(setFocusedItemId).toHaveBeenCalledWith('new-block-id')
  })

  it('should call useUpdateBlock on update', () => {
    render(<HierarchicalSection dateStr="2025-08-05" sectionType="action" title="Actions" items={mockItems} />, {
      wrapper,
    })
    fireEvent.click(screen.getByText('Root item'))
    fireEvent.change(screen.getByDisplayValue('Root item'), { target: { value: 'Updated text' } })
    fireEvent.blur(screen.getByDisplayValue('Updated text'))
    expect(mockUpdateBlock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'item-1',
        updateDto: { properties: { text: 'Updated text' } },
      })
    )
  })
})
