const getApiBaseUrl = () => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: 'API request failed with status ' + response.status,
    }))
    throw new Error(error.message || 'API request failed')
  }
  if (response.status === 204) {
    // No Content
    return
  }
  return response.json()
}

export const apiClient = {
  get: async <T>(path: string): Promise<T> => {
    const response = await fetch(`${getApiBaseUrl()}${path}`)
    return handleResponse(response)
  },
  post: async <T>(path: string, body: unknown): Promise<T> => {
    const response = await fetch(`${getApiBaseUrl()}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    return handleResponse(response)
  },
  patch: async <T>(path: string, body: unknown): Promise<T> => {
    const response = await fetch(`${getApiBaseUrl()}${path}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    return handleResponse(response)
  },
  delete: async <T>(path: string): Promise<T> => {
    const response = await fetch(`${getApiBaseUrl()}${path}`, {
      method: 'DELETE',
    })
    return handleResponse(response)
  },
}
