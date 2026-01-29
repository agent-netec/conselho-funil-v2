import { renderHook, waitFor } from '@testing-library/react'
import { useBrands } from '@/lib/hooks/use-brands'
import { useAuthStore } from '@/lib/stores/auth-store'
import { getUserBrands, createBrand } from '@/lib/firebase/brands'

// Mock dependencies
jest.mock('@/lib/stores/auth-store')
jest.mock('@/lib/firebase/brands')

describe('useBrands', () => {
  const mockUser = { uid: 'user123' }
  const mockBrands = [
    { id: '1', name: 'Brand 1', userId: 'user123' },
    { id: '2', name: 'Brand 2', userId: 'user123' },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useAuthStore as unknown as jest.Mock).mockReturnValue({ user: mockUser })
    ;(getUserBrands as jest.Mock).mockResolvedValue(mockBrands)
  })

  it('should load brands on mount when user is authenticated', async () => {
    const { result } = renderHook(() => useBrands())

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.brands).toEqual(mockBrands)
    expect(getUserBrands).toHaveBeenCalledWith('user123')
  })

  it('should handle error when loading brands fails', async () => {
    ;(getUserBrands as jest.Mock).mockRejectedValue(new Error('Failed to load'))
    
    const { result } = renderHook(() => useBrands())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBe('Erro ao carregar marcas')
  })

  it('should create a brand and refresh list', async () => {
    const newBrandData = { name: 'New Brand' }
    ;(createBrand as jest.Mock).mockResolvedValue('new-id')
    
    const { result } = renderHook(() => useBrands())
    
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    let brandId;
    await waitFor(async () => {
      brandId = await result.current.create(newBrandData)
    })

    expect(brandId).toBe('new-id')
    expect(createBrand).toHaveBeenCalledWith({
      ...newBrandData,
      userId: 'user123'
    })
    expect(getUserBrands).toHaveBeenCalledTimes(2) // Initial + after create
  })
})



