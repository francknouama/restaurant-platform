import { describe, it, expect } from 'vitest'
import { cn, formatDate, formatCurrency, truncate } from '@utils/index'

describe('Utils', () => {
  describe('cn', () => {
    it('merges class names correctly', () => {
      expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
    })
  })

  describe('formatDate', () => {
    it('formats date string correctly', () => {
      const date = '2023-12-25'
      const formatted = formatDate(date)
      expect(formatted).toMatch(/12\/25\/2023/)
    })
  })

  describe('formatCurrency', () => {
    it('formats currency correctly', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56')
    })
  })

  describe('truncate', () => {
    it('truncates long text', () => {
      expect(truncate('Hello world', 5)).toBe('Hello...')
    })

    it('does not truncate short text', () => {
      expect(truncate('Hi', 5)).toBe('Hi')
    })
  })
})