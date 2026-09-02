export type CalendarMonth = {
  year: number
  month: number
}

export type CalendarDateParts = CalendarMonth & {
  day: number
}

export type CalendarDayRecord = {
  isoDate: string
  day: number
  isCurrentMonth: boolean
  isToday: boolean
}

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

export function parseCalendarIsoDate(
  value: string
): CalendarDateParts | null {
  const match = ISO_DATE_PATTERN.exec(value)

  if (!match) {
    return null
  }

  const year = Number(match[1])
  const month = Number(match[2]) - 1
  const day = Number(match[3])

  if (year < 1000 || month < 0 || month > 11 || day < 1) {
    return null
  }

  const date = createLocalDate(year, month, day)

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null
  }

  return { year, month, day }
}

export function isValidCalendarIsoDate(value: string) {
  return parseCalendarIsoDate(value) !== null
}

export function getCalendarMonthFromIsoDate(
  value: string
): CalendarMonth | null {
  const date = parseCalendarIsoDate(value)

  return date ? { year: date.year, month: date.month } : null
}

export function shiftCalendarMonth(
  month: CalendarMonth,
  offset: number
): CalendarMonth {
  const date = createLocalDate(month.year, month.month + offset, 1)

  return {
    year: date.getFullYear(),
    month: date.getMonth(),
  }
}

export function getCalendarMonthLabel(month: CalendarMonth) {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(createLocalDate(month.year, month.month, 1))
}

export function getCalendarDateLabel(value: string) {
  const date = parseCalendarIsoDate(value)

  if (!date) {
    return value
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(createLocalDate(date.year, date.month, date.day))
}

export function getLocalTodayIsoDate(now = new Date()) {
  return toCalendarIsoDate(now)
}

export function buildCalendarDays(
  month: CalendarMonth,
  todayIsoDate: string
): CalendarDayRecord[] {
  const firstDay = createLocalDate(month.year, month.month, 1)
  const mondayFirstOffset = (firstDay.getDay() + 6) % 7
  const gridStart = createLocalDate(
    month.year,
    month.month,
    1 - mondayFirstOffset
  )

  return Array.from({ length: 42 }, (_, index) => {
    const date = createLocalDate(
      gridStart.getFullYear(),
      gridStart.getMonth(),
      gridStart.getDate() + index
    )
    const isoDate = toCalendarIsoDate(date)

    return {
      isoDate,
      day: date.getDate(),
      isCurrentMonth:
        date.getFullYear() === month.year &&
        date.getMonth() === month.month,
      isToday: isoDate === todayIsoDate,
    }
  })
}

function createLocalDate(year: number, month: number, day: number) {
  return new Date(year, month, day, 12, 0, 0, 0)
}

function toCalendarIsoDate(date: Date) {
  const year = String(date.getFullYear()).padStart(4, "0")
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}
