import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { Schedule, UpsertScheduleDto } from '@9nau/types'

export const useUpsertSchedule = () => {
  const queryClient = useQueryClient()
  return useMutation<Schedule, Error, UpsertScheduleDto>({
    mutationFn: (scheduleDto) => apiClient.post('/schedule', scheduleDto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocks'] })
    },
  })
}

export const useDeleteSchedule = () => {
  const queryClient = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: (id) => apiClient.delete(`/schedule/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocks'] })
    },
  })
}
