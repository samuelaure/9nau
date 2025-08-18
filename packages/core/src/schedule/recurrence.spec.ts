import { generateOccurrences } from './recurrence'
import { Schedule } from '@9nau/types'

describe('generateOccurrences', () => {
  const today = new Date('2025-08-10T00:00:00.000Z')

  it('should return an empty array for a one-time event outside the range', () => {
    const schedule: Schedule = {
      id: '1',
      blockId: 'b1',
      startDate: '2025-08-09T10:00:00.000Z',
      endDate: '2025-08-09T11:00:00.000Z',
    }
    const occurrences = generateOccurrences(schedule, { start: today, end: new Date('2025-08-11T12:00:00.000Z') })
    expect(occurrences).toEqual([])
  })

  it('should return a single date for a one-time event within the range', () => {
    const schedule: Schedule = {
      id: '1',
      blockId: 'b1',
      startDate: '2025-08-10T15:00:00.000Z',
      endDate: '2025-08-10T16:00:00.000Z',
    }
    const occurrences = generateOccurrences(schedule, { start: today, end: new Date('2025-08-11T12:00:00.000Z') })
    expect(occurrences).toHaveLength(1)
    expect(occurrences[0].toISOString()).toBe('2025-08-10T15:00:00.000Z')
  })

  it('should generate daily occurrences correctly', () => {
    const schedule: Schedule = {
      id: '2',
      blockId: 'b2',
      startDate: '2025-08-10T09:00:00.000Z',
      rrule: 'FREQ=DAILY;COUNT=3',
    }
    const occurrences = generateOccurrences(schedule, { start: today, end: new Date('2025-08-15T12:00:00.000Z') })
    expect(occurrences).toHaveLength(3)
    expect(occurrences.map((d) => d.toISOString())).toEqual([
      '2025-08-10T09:00:00.000Z',
      '2025-08-11T09:00:00.000Z',
      '2025-08-12T09:00:00.000Z',
    ])
  })

  it('should generate weekly occurrences on specific days', () => {
    const schedule: Schedule = {
      id: '3',
      blockId: 'b3',
      startDate: '2025-08-10T10:00:00.000Z', // A Sunday
      rrule: 'FREQ=WEEKLY;BYDAY=MO,FR;COUNT=4',
    }
    const occurrences = generateOccurrences(schedule, { start: today, end: new Date('2025-08-25T12:00:00.000Z') })
    expect(occurrences).toHaveLength(4)
    expect(occurrences.map((d) => d.toISOString())).toEqual([
      '2025-08-11T10:00:00.000Z', // Monday
      '2025-08-15T10:00:00.000Z', // Friday
      '2025-08-18T10:00:00.000Z', // Monday
      '2025-08-22T10:00:00.000Z', // Friday
    ])
  })

  it('should respect the UNTIL property in the rrule string', () => {
    const schedule: Schedule = {
      id: '4',
      blockId: 'b4',
      startDate: '2025-08-10T08:00:00.000Z',
      rrule: 'FREQ=DAILY;UNTIL=20250812T235959Z',
    }
    const occurrences = generateOccurrences(schedule, { start: today, end: new Date('2025-08-15T12:00:00.000Z') })
    expect(occurrences).toHaveLength(3)
    expect(occurrences.map((d) => d.toISOString())).toEqual([
      '2025-08-10T08:00:00.000Z',
      '2025-08-11T08:00:00.000Z',
      '2025-08-12T08:00:00.000Z',
    ])
  })

  it('should return an empty array if rrule is invalid', () => {
    // Suppress console.error for this specific test case
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    const schedule: Schedule = {
      id: '5',
      blockId: 'b5',
      startDate: '2025-08-10T08:00:00.000Z',
      rrule: 'INVALID_RULE',
    }
    const occurrences = generateOccurrences(schedule, { start: today, end: new Date('2025-08-15T12:00:00.000Z') })
    expect(occurrences).toEqual([])

    // Restore original console.error
    consoleErrorSpy.mockRestore()
  })
})
