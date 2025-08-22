import * as React from 'react'
import { Button } from '@9nau/ui/components/button'
import { Calendar as CalendarIcon } from 'lucide-react'
import { Block } from '@9nau/types'
import { Popover, PopoverContent, PopoverTrigger } from '@9nau/ui/components/popover'
import { Calendar } from '@9nau/ui/components/calendar'
import { Label } from '@9nau/ui/components/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@9nau/ui/components/select'
import { RRule, rrulestr } from 'rrule'
import { useUpsertSchedule } from '@/hooks/use-schedule-api'

interface SchedulePopoverProps {
  block: Block
}

const weekDays = [
  { value: RRule.MO, label: 'M' },
  { value: RRule.TU, label: 'T' },
  { value: RRule.WE, label: 'W' },
  { value: RRule.TH, label: 'T' },
  { value: RRule.FR, label: 'F' },
  { value: RRule.SA, label: 'S' },
  { value: RRule.SU, label: 'S' },
]

export function SchedulePopover({ block }: SchedulePopoverProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [startDate, setStartDate] = React.useState<Date | undefined>(
    block.schedule?.startDate ? new Date(block.schedule.startDate) : undefined
  )
  const [repeats, setRepeats] = React.useState(!!block.schedule?.rrule)
  const [frequency, setFrequency] = React.useState<number>(RRule.WEEKLY)
  const [weeklyDays, setWeeklyDays] = React.useState<number[]>([])

  const upsertSchedule = useUpsertSchedule()

  React.useEffect(() => {
    if (block.schedule?.rrule) {
      const rule = rrulestr(block.schedule.rrule)
      setFrequency(rule.options.freq)
      if (rule.options.byweekday) {
        setWeeklyDays(rule.options.byweekday)
      }
    }
  }, [block.schedule])

  const handleSave = () => {
    if (!startDate) return

    let rrule: string | undefined = undefined
    if (repeats) {
      const rule = new RRule({
        freq: frequency,
        dtstart: startDate,
        byweekday: frequency === RRule.WEEKLY ? weeklyDays : undefined,
      })
      rrule = rule.toString()
    }

    upsertSchedule.mutate({
      blockId: block.id,
      startDate: startDate.toISOString(),
      rrule: rrule,
    })
    setIsOpen(false)
  }

  const handleDayToggle = (dayValue: number) => {
    setWeeklyDays((prev) => (prev.includes(dayValue) ? prev.filter((d) => d !== dayValue) : [...prev, dayValue]))
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={(e) => e.stopPropagation()}>
          <CalendarIcon className="w-4 h-4 text-gray-500" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" onClick={(e) => e.stopPropagation()}>
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Schedule</h4>
            <p className="text-sm text-muted-foreground">Set a date and recurrence for this item.</p>
          </div>
          <div className="grid gap-2">
            <Label>Start Date</Label>
            <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="repeats-checkbox"
                checked={repeats}
                onChange={(e) => setRepeats(e.target.checked)}
              />
              <Label htmlFor="repeats-checkbox">Repeats</Label>
            </div>
            {repeats && (
              <div className="grid gap-2 pl-6">
                <Select value={String(frequency)} onValueChange={(val) => setFrequency(Number(val))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={String(RRule.DAILY)}>Daily</SelectItem>
                    <SelectItem value={String(RRule.WEEKLY)}>Weekly</SelectItem>
                    <SelectItem value={String(RRule.MONTHLY)}>Monthly</SelectItem>
                    <SelectItem value={String(RRule.YEARLY)}>Yearly</SelectItem>
                  </SelectContent>
                </Select>
                {frequency === RRule.WEEKLY && (
                  <div className="flex space-x-1">
                    {weekDays.map((day, index) => (
                      <Button
                        key={index}
                        variant={weeklyDays.includes(day.value.weekday) ? 'secondary' : 'outline'}
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => handleDayToggle(day.value.weekday)}
                      >
                        {day.label}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <Button onClick={handleSave}>Save</Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
