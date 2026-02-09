import { cleanup, renderHook, waitFor } from '@testing-library/react'
import { useFunnels } from '@/lib/hooks/use-funnels'
import { useAuthStore } from '@/lib/stores/auth-store'
import { getUserFunnels, createFunnel } from '@/lib/firebase/firestore'

// Mock dependencies
jest.mock('@/lib/stores/auth-store')
jest.mock('@/lib/firebase/firestore')

describe('useFunnels', () => {
  const mockUser = { uid: 'user123' }
  const mockFunnels = [
    { id: 'f1', name: 'Funnel 1', userId: 'user123', status: 'draft' },
    { id: 'f2', name: 'Funnel 2', userId: 'user123', status: 'active' },
  ]
  let lastUnmount: (() => void) | null = null

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useAuthStore as unknown as jest.Mock).mockReturnValue({ user: mockUser })
    ;(getUserFunnels as jest.Mock).mockResolvedValue(mockFunnels)
  })

  afterEach(() => {
    if (lastUnmount) {
      lastUnmount()
      lastUnmount = null
    }
    cleanup()
  })

  it('should load funnels on mount when user is authenticated', async () => {
    const { result, unmount } = renderHook(() => useFunnels())
    lastUnmount = unmount

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.funnels).toEqual(mockFunnels)
    expect(getUserFunnels).toHaveBeenCalledWith('user123')
  })

  it('should handle error when loading funnels fails', async () => {
    ;(getUserFunnels as jest.Mock).mockRejectedValue(new Error('Failed to load'))
    
    const { result, unmount } = renderHook(() => useFunnels())
    lastUnmount = unmount

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBe('Erro ao carregar funis')
  })

  it('should create a funnel and refresh list', async () => {
    const newFunnelData = { name: 'New Funnel', context: { objective: 'sales' } as any, brandId: 'brand1' }
    ;(createFunnel as jest.Mock).mockResolvedValue('new-f-id')
    
    const { result, unmount } = renderHook(() => useFunnels())
    lastUnmount = unmount
    
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    let funnelId;
    await waitFor(async () => {
      funnelId = await result.current.create(newFunnelData)
    })

    expect(funnelId).toBe('new-f-id')
    expect(createFunnel).toHaveBeenCalledWith({
      userId: 'user123',
      name: 'New Funnel',
      context: { objective: 'sales' },
      brandId: 'brand1'
    })
    expect(getUserFunnels).toHaveBeenCalledTimes(2)
  })
})



