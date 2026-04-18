import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ReactNode } from 'react'
import { useGetBlocks, useCreateBlock, useUpdateBlock, useDeleteBlock } from './use-blocks-api'
import { apiClient } from '@/lib/api-client'
import { Block, CreateBlockDto, UpdateBlockDto } from '@9nau/types'

// Mock the API client
jest.mock('@/lib/api-client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
)

const mockBlock: Block = {
  id: 'block-1',
  uuid: 'uuid-1',
  type: 'note',
  properties: { text: 'Test note' },
  parentId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('useGetBlocks', () => {
  it('should fetch blocks successfully', async () => {
    ;(apiClient.get as jest.Mock).mockResolvedValueOnce([mockBlock])
    const { result } = renderHook(() => useGetBlocks({}), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([mockBlock])
  })
})

describe('useCreateBlock', () => {
  it('should create a new block and invalidate queries', async () => {
    ;(apiClient.post as jest.Mock).mockResolvedValueOnce(mockBlock)
    const { result } = renderHook(() => useCreateBlock(), { wrapper })
    const createDto: CreateBlockDto = { type: 'note', properties: {} }
    result.current.mutate(createDto)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(apiClient.post).toHaveBeenCalledWith('/blocks', createDto)
  })
})

describe('useUpdateBlock', () => {
  it('should update a block and invalidate queries', async () => {
    ;(apiClient.patch as jest.Mock).mockResolvedValueOnce(mockBlock)
    const { result } = renderHook(() => useUpdateBlock(), { wrapper })
    const updateDto: UpdateBlockDto = { properties: { text: 'updated text' } }
    result.current.mutate({ id: mockBlock.id, updateDto })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(apiClient.patch).toHaveBeenCalledWith(`/blocks/${mockBlock.id}`, updateDto)
  })
})

describe('useDeleteBlock', () => {
  it('should delete a block and invalidate queries', async () => {
    ;(apiClient.delete as jest.Mock).mockResolvedValueOnce(undefined)
    const { result } = renderHook(() => useDeleteBlock(), { wrapper })
    result.current.mutate(mockBlock.id)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(apiClient.delete).toHaveBeenCalledWith(`/blocks/${mockBlock.id}`)
  })
})
