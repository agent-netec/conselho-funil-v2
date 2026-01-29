import { cn, formatCurrency, formatDate, truncateText, formatFileSize } from '@/lib/utils'

describe('utils', () => {
  describe('cn', () => {
    it('should merge classes correctly', () => {
      expect(cn('a', 'b')).toBe('a b')
      expect(cn('px-2', 'px-4')).toBe('px-4')
    })
  })

  describe('formatCurrency', () => {
    it('should format numbers to BRL', () => {
      // Use non-breaking space for comparison as Intl.NumberFormat might use it
      const result = formatCurrency(1234.56).replace(/\u00A0/g, ' ')
      expect(result).toMatch(/R\$\s1\.234,56/)
    })
  })

  describe('formatDate', () => {
    it('should format dates to pt-BR', () => {
      const date = new Date(2026, 0, 7) // Jan 7, 2026
      expect(formatDate(date)).toBe('07/01/2026')
    })
  })

  describe('truncateText', () => {
    it('should truncate long text', () => {
      expect(truncateText('Hello World', 5)).toBe('Hello...')
    })

    it('should not truncate short text', () => {
      expect(truncateText('Hello', 10)).toBe('Hello')
    })
  })

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(1024)).toBe('1 KB')
      expect(formatFileSize(1024 * 1024)).toBe('1 MB')
      expect(formatFileSize(500)).toBe('500 Bytes')
    })
  })
})



