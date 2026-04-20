'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

export type Brand = { id: string; name: string; timezone: string; isActive: boolean; createdAt: string }
export type Workspace = { id: string; name: string; role: string; brands: Brand[]; members?: Member[] }
export type Member = { id: string; role: string; userId: string; user: { id: string; email: string; name: string | null } }

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

export const useGetBrands = (workspaceId: string | null) =>
  useQuery<Brand[]>({
    queryKey: ['brands', workspaceId],
    queryFn: () => apiClient.get(`/workspaces/${workspaceId}/brands`),
    enabled: !!workspaceId,
  })

export const useCreateBrand = (workspaceId: string) => {
  const qc = useQueryClient()
  return useMutation<Brand, Error, { name: string; timezone?: string }>({
    mutationFn: (body) => apiClient.post(`/workspaces/${workspaceId}/brands`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['brands', workspaceId] })
      qc.invalidateQueries({ queryKey: ['workspaces'] })
    },
  })
}

export const useGetMembers = (workspaceId: string | null) =>
  useQuery<Member[]>({
    queryKey: ['members', workspaceId],
    queryFn: () => apiClient.get(`/workspaces/${workspaceId}/members`),
    enabled: !!workspaceId,
  })
