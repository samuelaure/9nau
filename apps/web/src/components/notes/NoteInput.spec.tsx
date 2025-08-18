import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { NoteInput } from './note-input'
import { useCreateBlock } from '@/hooks/use-blocks-api'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { act } from 'react'

jest.mock('@/hooks/use-blocks-api')

const queryClient = new QueryClient()
const mockCreateBlock = jest.fn()

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
)

describe('NoteInput', () => {
  beforeEach(() => {
    ;(useCreateBlock as jest.Mock).mockReturnValue({
      mutate: mockCreateBlock,
    })
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.clearAllMocks()
    jest.useRealTimers()
  })

  it('should render in collapsed state initially', () => {
    render(<NoteInput />, { wrapper })
    const placeholder = screen.getByText('Take a note...')
    expect(placeholder).toBeInTheDocument()
  })

  it('should expand when clicked and focus textarea', () => {
    render(<NoteInput />, { wrapper })
    fireEvent.click(screen.getByText('Take a note...'))
    const textarea = screen.getByPlaceholderText('Take a note...') as HTMLTextAreaElement
    expect(textarea).toBeInTheDocument()
    expect(textarea).toHaveFocus()
  })

  it('should call createBlock and collapse on blur with text', async () => {
    render(<NoteInput />, { wrapper })
    fireEvent.click(screen.getByText('Take a note...'))
    const textarea = screen.getByPlaceholderText('Take a note...') as HTMLTextAreaElement
    fireEvent.change(textarea, { target: { value: 'This is a new note' } })

    act(() => {
      fireEvent.mouseDown(document.body)
      jest.runAllTimers()
    })

    await waitFor(() => expect(mockCreateBlock).toHaveBeenCalledTimes(1))
    expect(mockCreateBlock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'note',
        properties: { text: 'This is a new note', status: 'inbox', date: expect.any(String) },
      })
    )
    expect(textarea).not.toBeInTheDocument()
  })

  it('should not call createBlock on blur if text is empty', () => {
    render(<NoteInput />, { wrapper })
    fireEvent.click(screen.getByText('Take a note...'))
    // const textarea = screen.getByPlaceholderText('Take a note...') as HTMLTextAreaElement;

    act(() => {
      fireEvent.mouseDown(document.body)
      jest.runAllTimers()
    })

    expect(mockCreateBlock).not.toHaveBeenCalled()
  })
})
