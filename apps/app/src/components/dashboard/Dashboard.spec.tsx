import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Dashboard } from './Dashboard'
import { useDashboardStore } from '@/lib/state/dashboard-store'
import { useUpdateBlock } from '@/hooks/use-blocks-api'
import { HierarchicalBlock, getTodayDateString, isDateToday, formatDisplayDate } from '@9nau/core'
import { Block } from '@9nau/types'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { addDays } from 'date-fns'

jest.mock('@/lib/state/dashboard-store')
jest.mock('@/hooks/use-blocks-api')
jest.mock('@9nau/core', () => ({
  ...jest.requireActual('@9nau/core'),
  getTodayDateString: jest.fn(),
  isDateToday: jest.fn(),
  formatDisplayDate: jest.fn(),
}))

const useDashboardStoreMock = useDashboardStore as unknown as jest.Mock
const queryClient = new QueryClient()
const mockUpdateBlock = jest.fn()

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
)

describe('Dashboard', () => {
  const setViewMode = jest.fn()
  const setCurrentDate = jest.fn()
  const loadMorePastDays = jest.fn()
  const showFutureDays = jest.fn()
  const hideFutureDays = jest.fn()
  const setMainContentRef = jest.fn()
  const setTodayRef = jest.fn()
  const setDraggedItem = jest.fn()
  const setDropTarget = jest.fn()

  const mockNotesByDate = new Map<string, Block[]>()
  const mockExperiences: HierarchicalBlock[] = [
    {
      id: 'exp-1',
      type: 'experience',
      parentId: null,
      properties: { date: '2025-08-05', text: 'Experience 1', sortOrder: 1 },
      createdAt: new Date(),
      updatedAt: new Date(),
      children: [],
    },
  ]

  const mockState = {
    viewMode: 'list',
    currentDate: new Date('2025-08-05'),
    visiblePastDays: 7,
    visibleFutureDays: 0,
    draggedItem: null,
    dropTarget: null,
    mainContentRef: { current: null },
    actions: {
      setViewMode,
      setCurrentDate,
      loadMorePastDays,
      showFutureDays,
      hideFutureDays,
      setMainContentRef,
      setTodayRef,
      setDraggedItem,
      setDropTarget,
    },
  }

  beforeEach(() => {
    useDashboardStoreMock.mockImplementation((selector) => selector(mockState))
    ;(useUpdateBlock as jest.Mock).mockReturnValue({ mutate: mockUpdateBlock })
    ;(getTodayDateString as jest.Mock).mockReturnValue('2025-08-05')
    ;(isDateToday as jest.Mock).mockReturnValue(true)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should render in list view by default', () => {
    render(<Dashboard notesByDate={mockNotesByDate} actions={[]} experiences={mockExperiences} />, { wrapper })
    expect(screen.getByText('Future')).toBeInTheDocument()
  })

  it('should call showFutureDays on button click in list view', () => {
    render(<Dashboard notesByDate={mockNotesByDate} actions={[]} experiences={mockExperiences} />, { wrapper })
    fireEvent.click(screen.getByRole('button', { name: 'Future' }))
    expect(showFutureDays).toHaveBeenCalled()
  })

  it('should render in horizontal view when viewMode is "horizontal"', () => {
    useDashboardStoreMock.mockImplementation((selector) =>
      selector({
        ...mockState,
        viewMode: 'horizontal',
        currentDate: new Date('2025-08-05T00:00:00'),
      })
    )
    ;(formatDisplayDate as jest.Mock).mockReturnValue('05/08/2025, Tuesday')
    render(<Dashboard notesByDate={mockNotesByDate} actions={[]} experiences={mockExperiences} />, { wrapper })
    expect(screen.getByText('05/08/2025, Tuesday')).toBeInTheDocument()
    expect(screen.getByLabelText('Previous Day')).toBeInTheDocument()
    expect(screen.getByLabelText('Next Day')).toBeInTheDocument()
  })

  it('should call setCurrentDate when navigating in horizontal view', () => {
    useDashboardStoreMock.mockImplementation((selector) =>
      selector({
        ...mockState,
        viewMode: 'horizontal',
        currentDate: new Date('2025-08-05'),
      })
    )
    render(<Dashboard notesByDate={mockNotesByDate} actions={[]} experiences={mockExperiences} />, { wrapper })
    fireEvent.click(screen.getByLabelText('Next Day'))
    expect(setCurrentDate).toHaveBeenCalledWith(addDays(new Date('2025-08-05'), 1))
  })

  it('should call loadMorePastDays on scroll in list view', () => {
    const mockAddEventListener = jest.fn()
    const mockMainContentRef = {
      current: {
        scrollTop: 801,
        scrollHeight: 1000,
        clientHeight: 200,
        addEventListener: mockAddEventListener,
        removeEventListener: jest.fn(),
      } as unknown as HTMLDivElement,
    }

    useDashboardStoreMock.mockImplementation((selector) =>
      selector({
        ...mockState,
        mainContentRef: mockMainContentRef,
      })
    )

    render(<Dashboard notesByDate={mockNotesByDate} actions={[]} experiences={mockExperiences} />, { wrapper })

    const handleScroll = mockAddEventListener.mock.calls.find(
      (call: [string, EventListener]) => call[0] === 'scroll'
    )?.[1]

    if (handleScroll) {
      handleScroll({} as Event)
    }

    expect(loadMorePastDays).toHaveBeenCalled()
  })

  it('should handle drop event and update the block', () => {
    const today = getTodayDateString()
    const mockActions: HierarchicalBlock[] = [
      {
        id: 'action-2',
        type: 'action',
        parentId: null,
        properties: { date: today, text: 'Action 2', sortOrder: 10 },
        createdAt: new Date(),
        updatedAt: new Date(),
        children: [],
      },
      {
        id: 'action-1',
        type: 'action',
        parentId: null,
        properties: { date: today, text: 'Action 1', sortOrder: 1 },
        createdAt: new Date(),
        updatedAt: new Date(),
        children: [],
      },
    ]

    useDashboardStoreMock.mockImplementation((selector) =>
      selector({
        ...mockState,
        draggedItem: mockActions[1], // Dragging action-1
        dropTarget: {
          id: null,
          position: 'end',
          date: today,
          section: 'action',
        },
      })
    )

    render(<Dashboard notesByDate={mockNotesByDate} actions={mockActions} experiences={mockExperiences} />, { wrapper })
    fireEvent.drop(screen.getByTestId('dashboard-main-content'))
    expect(mockUpdateBlock).toHaveBeenCalledWith({
      id: 'action-1',
      updateDto: {
        parentId: null,
        properties: { sortOrder: 11 },
      },
    })
  })
})
