import { renderHook, waitFor } from '@testing-library/react'
import { useBrandAssets } from '@/lib/hooks/use-brand-assets'
import { onSnapshot } from 'firebase/firestore'

// Mock firebase/firestore
jest.mock('firebase/firestore', () => ({
  ...jest.requireActual('firebase/firestore'),
  onSnapshot: jest.fn(),
  query: jest.fn(),
  collection: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
}))

describe('useBrandAssets', () => {
  const mockBrandId = 'brand123'
  const mockAssets = [
    { id: 'a1', name: 'Asset 1', brandId: 'brand123', createdAt: new Date() },
    { id: 'a2', name: 'Asset 2', brandId: 'brand123', createdAt: new Date() },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should set assets and stop loading when snapshot updates', async () => {
    // Simulate onSnapshot behavior
    ;(onSnapshot as jest.Mock).mockImplementation((q, callback) => {
      callback({
        docs: mockAssets.map(asset => ({
          id: asset.id,
          data: () => asset
        }))
      })
      return jest.fn() // unsubscribe
    })

    const { result } = renderHook(() => useBrandAssets(mockBrandId))

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.assets).toEqual(mockAssets)
  })

  it('should handle undefined brandId', () => {
    const { result } = renderHook(() => useBrandAssets(undefined))

    expect(result.current.assets).toEqual([])
    expect(result.current.isLoading).toBe(false)
    expect(onSnapshot).not.toHaveBeenCalled()
  })
})



