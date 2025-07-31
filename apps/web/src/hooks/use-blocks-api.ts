import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { Block, CreateBlockDto, UpdateBlockDto } from '@9nau/types'

type FindBlocksParams = {
  type?: string
  status?: string
}

export const useGetBlocks = (params: FindBlocksParams) => {
  return useQuery<Block[], Error>({
    queryKey: ['blocks', params],
    queryFn: () => {
      const searchParams = new URLSearchParams()
      if (params.type) searchParams.append('type', params.type)
      if (params.status) searchParams.append('status', params.status)
      return apiClient.get(`/blocks?${searchParams.toString()}`)
    },
  })
}

export const useCreateBlock = () => {
  const queryClient = useQueryClient()
  return useMutation<Block, Error, CreateBlockDto>({
    mutationFn: (newBlock) => apiClient.post('/blocks', newBlock),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocks'] })
    },
  })
}

export const useUpdateBlock = () => {
  const queryClient = useQueryClient()
  return useMutation<Block, Error, { id: string; updateDto: UpdateBlockDto }>({
    mutationFn: ({ id, updateDto }) =>
      apiClient.patch(`/blocks/${id}`, updateDto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocks'] })
    },
  })
}

export const useDeleteBlock = () => {
  const queryClient = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: (id) => apiClient.delete(`/blocks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocks'] })
    },
  })
}
