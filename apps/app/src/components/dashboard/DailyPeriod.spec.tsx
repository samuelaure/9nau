import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { DailyPeriod } from './DailyPeriod'
import { Block } from '@9nau/types'
import { HierarchicalBlock, isDateToday, formatDisplayDate } from '@9nau/core'
import { useDashboardStore } from '@/lib/state/dashboard-store'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

jest.mock('@/lib/state/dashboard-store')
jest.mock('@9nau/core', () => ({
  ...jest.requireActual('@9nau/core'),
  isDateToday: jest.fn(),
  formatDisplayDate: jest.fn(),
}))

const useDashboardStoreMock = useDashboardStore as unknown as jest.Mock
const queryClient = new QueryClient()

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
)

describe('DailyPeriod', () => {
  const mockDailyActions: HierarchicalBlock[] = [
    {
      id: 'a1',
      type: 'action',
      parentId: null,
      properties: { text: 'Action 1', sortOrder: 1, date: '2025-08-05' },
      createdAt: new Date(),
      updatedAt: new Date(),
      children: [],
    },
  ]
  const mockDailyExperiences: HierarchicalBlock[] = [
    {
      id: 'e1',
      type: 'experience',
      parentId: null,
      properties: { text: 'Exp 1', sortOrder: 1, date: '2025-08-05' },
      createdAt: new Date(),
      updatedAt: new Date(),
      children: [],
    },
  ]
  const mockDailyNotes: Block[] = [
    {
      id: 'n1',
      type: 'note',
      parentId: null,
      properties: { text: 'Note 1', date: '2025-08-05', status: 'inbox' },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]
  const setDropTarget = jest.fn()

  beforeEach(() => {
    const mockState = {
      draggedItem: { id: 'drag-1', type: 'action' },
      actions: {
        setDropTarget,
      },
    }
    useDashboardStoreMock.mockImplementation((selector) => selector(mockState))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(useDashboardStore as any).getState = () => mockState // Mock getState
    ;(isDateToday as jest.Mock).mockReturnValue(false)
    ;(formatDisplayDate as jest.Mock).mockReturnValue('05/08/2025, Tuesday')
    queryClient.clear()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should render the header and toggle content on click', () => {
    ;(isDateToday as jest.Mock).mockReturnValue(true)
    render(
      <DailyPeriod
        dateStr="2025-08-05"
        dailyActions={mockDailyActions}
        dailyExperiences={mockDailyExperiences}
        dailyNotes={mockDailyNotes}
      />,
      { wrapper }
    )
    const headerButton = screen.getByRole('button', { name: '05/08/2025, Tuesday' })
    expect(headerButton).toBeInTheDocument()
    expect(screen.getByText('Actions')).toBeInTheDocument()
    fireEvent.click(headerButton)
    expect(screen.queryByText('Actions')).not.toBeInTheDocument()
  })

  it('should not render header when showHeader is false', () => {
    render(
      <DailyPeriod
        dateStr="2025-08-05"
        dailyActions={mockDailyActions}
        dailyExperiences={mockDailyExperiences}
        dailyNotes={mockDailyNotes}
        showHeader={false}
      />,
      { wrapper }
    )
    expect(screen.queryByText('05/08/2025, Tuesday')).not.toBeInTheDocument()
    expect(screen.getByText('Actions')).toBeInTheDocument()
  })

  it('should call setDropTarget on drag over with correct payload', () => {
    render(
      <DailyPeriod
        dateStr="2025-08-05"
        dailyActions={mockDailyActions}
        dailyExperiences={mockDailyExperiences}
        dailyNotes={mockDailyNotes}
        showHeader={false}
      />,
      { wrapper }
    )
    const container = screen.getByTestId('daily-period-content-2025-08-05')
    fireEvent.dragOver(container)
    expect(setDropTarget).toHaveBeenCalledWith({
      id: null,
      position: 'end',
      date: '2025-08-05',
      section: 'action',
    })
  })
})
