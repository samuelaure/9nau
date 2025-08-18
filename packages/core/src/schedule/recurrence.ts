import { Schedule } from '@9nau/types'
import { RRule } from 'rrule'

/**
 * Generates event occurrences based on a schedule and a date range.
 * @param schedule - The schedule object containing start date and optional rrule.
 * @param range - The start and end dates for generating occurrences.
 * @returns An array of Date objects representing each occurrence.
 */
export function generateOccurrences(schedule: Schedule, range: { start: Date; end: Date }): Date[] {
  // If there's no recurrence rule, it's a one-time event.
  if (!schedule.rrule) {
    const startDate = new Date(schedule.startDate)
    // Check if the single event falls within the desired range.
    if (startDate >= range.start && startDate <= range.end) {
      return [startDate]
    }
    return []
  }

  try {
    const dtstart = new Date(schedule.startDate)
    // The RRULE needs to be parsed with the correct DTSTART.
    const rule = RRule.fromString(`DTSTART:${dtstart.toISOString().replace(/-|:|\.\d+/g, '')}\n${schedule.rrule}`)

    // Generate occurrences within the specified range.
    const dates = rule.between(range.start, range.end)

    // rrule.js `between` method can sometimes return dates with incorrect time components
    // due to timezone handling. This ensures the time from the original startDate is preserved.
    return dates.map((date) => {
      date.setUTCHours(dtstart.getUTCHours())
      date.setUTCMinutes(dtstart.getUTCMinutes())
      date.setUTCSeconds(dtstart.getUTCSeconds())
      date.setUTCMilliseconds(dtstart.getUTCMilliseconds())
      return date
    })
  } catch (error) {
    console.error('Error parsing RRULE string:', schedule.rrule, error)
    return []
  }
}
