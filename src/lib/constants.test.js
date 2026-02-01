import { describe, it, expect } from 'vitest'
import { PILOT_OPTIONS } from './constants'

describe('constants', () => {
  describe('PILOT_OPTIONS', () => {
    it('has exactly 9 pilots', () => {
      expect(PILOT_OPTIONS).toHaveLength(9)
    })

    it('is in alphabetical order', () => {
      const sorted = [...PILOT_OPTIONS].sort((a, b) => a.localeCompare(b))
      expect(PILOT_OPTIONS).toEqual(sorted)
    })

    it('contains expected names: Devon, Edine, Ezgi, Jaco, Michael, Renzo, Thijm, Tjeerd, Yamac', () => {
      const expected = ['Devon', 'Edine', 'Ezgi', 'Jaco', 'Michael', 'Renzo', 'Thijm', 'Tjeerd', 'Yamac']
      expect(PILOT_OPTIONS).toEqual(expected)
    })
  })
})
