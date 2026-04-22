'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { Workspace, Brand, WorkspaceMember, CreateBrandDto, UpdateBrandDto } from '@9nau/types'

export type { Workspace, Brand, WorkspaceMember }

export const useGetWorkspaces = () =>
  useQuery<Workspace[]>({
    queryKey: ['workspaces'],
    queryFn: () => apiClient.get('/workspaces'),
  })

export const useCreateWorkspace = () => {
  const qc = useQueryClient()
  return useMutation<Workspace, Error, { name: string }>({
    mutationFn: (body) => apiClient.post('/workspaces', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workspaces'] }),
  })
}

export const useRenameWorkspace = (workspaceId: string) => {
  const qc = useQueryClient()
  return useMutation<Workspace, Error, { name: string }>({
    mutationFn: (body) => apiClient.patch(`/workspaces/${workspaceId}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workspaces'] }),
  })
}

export const useDeleteWorkspace = (workspaceId: string) => {
  const qc = useQueryClient()
  return useMutation<void, Error>({
    mutationFn: () => apiClient.delete(`/workspaces/${workspaceId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workspaces'] }),
  })
}

export const useGetBrands = (workspaceId: string | null) =>
  useQuery<Brand[]>({
    queryKey: ['brands', workspaceId],
    queryFn: () => apiClient.get(`/workspaces/${workspaceId}/brands`),
    enabled: !!workspaceId,
  })

export const useCreateBrand = (workspaceId: string) => {
  const qc = useQueryClient()
  return useMutation<Brand, Error, CreateBrandDto>({
    mutationFn: (body) => apiClient.post(`/workspaces/${workspaceId}/brands`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['brands', workspaceId] })
      qc.invalidateQueries({ queryKey: ['workspaces'] })
    },
  })
}

export const useUpdateBrand = (workspaceId: string, brandId: string) => {
  const qc = useQueryClient()
  return useMutation<Brand, Error, UpdateBrandDto>({
    mutationFn: (body) => apiClient.patch(`/workspaces/${workspaceId}/brands/${brandId}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['brands', workspaceId] })
      qc.invalidateQueries({ queryKey: ['workspaces'] })
    },
  })
}

export const useDeleteBrand = (workspaceId: string) => {
  const qc = useQueryClient()
  return useMutation<void, Error, { brandId: string }>({
    mutationFn: ({ brandId }) => apiClient.delete(`/workspaces/${workspaceId}/brands/${brandId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['brands', workspaceId] })
      qc.invalidateQueries({ queryKey: ['workspaces'] })
    },
  })
}

export const useGetMembers = (workspaceId: string | null) =>
  useQuery<WorkspaceMember[]>({
    queryKey: ['members', workspaceId],
    queryFn: () => apiClient.get(`/workspaces/${workspaceId}/members`),
    enabled: !!workspaceId,
  })

export const useAddMember = (workspaceId: string) => {
  const qc = useQueryClient()
  return useMutation<WorkspaceMember, Error, { email: string; role?: string }>({
    mutationFn: (body) => apiClient.post(`/workspaces/${workspaceId}/members`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members', workspaceId] }),
  })
}

export const useRemoveMember = (workspaceId: string) => {
  const qc = useQueryClient()
  return useMutation<void, Error, { userId: string }>({
    mutationFn: ({ userId }) => apiClient.delete(`/workspaces/${workspaceId}/members/${userId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members', workspaceId] }),
  })
}
