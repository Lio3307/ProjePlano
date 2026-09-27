export type Guard<T> = (value: unknown) => value is T

export const isString = (value: unknown): value is string =>
  typeof value === "string"
export const isBoolean = (value: unknown): value is boolean =>
  typeof value === "boolean"
export const isNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value)
export const isPosition = (value: unknown): value is number =>
  isNumber(value) && Number.isSafeInteger(value) && value >= 0
export const isId = (value: unknown): value is string =>
  isString(value) && value.length > 0 && value.trim() === value &&
  !["__proto__", "constructor", "prototype"].includes(value)

export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

export function nullable<T>(guard: Guard<T>): Guard<T | null> {
  return (value): value is T | null => value === null || guard(value)
}

export function arrayOf<T>(guard: Guard<T>): Guard<T[]> {
  return (value): value is T[] => Array.isArray(value) && value.every(guard)
}

export function oneOf<const T extends string>(...values: T[]): Guard<T> {
  return (value): value is T => isString(value) && values.some(v => v === value)
}

export function objectOf<T extends object>(
  shape: { [K in keyof T]-?: Guard<T[K]> }
): Guard<T> {
  const fields: [string, Guard<unknown>][] = Object.entries(shape)
  return (value): value is T =>
    isRecord(value) && Object.keys(value).length === fields.length &&
    fields.every(([key, guard]) => Object.hasOwn(value, key) && guard(value[key]))
}

export function recordOf<T>(guard: Guard<T>): Guard<Record<string, T>> {
  return (value): value is Record<string, T> =>
    isRecord(value) && Object.entries(value).every(([key, item]) => isId(key) && guard(item))
}

export function uniqueIds(value: unknown): value is string[] {
  return arrayOf(isId)(value) && new Set(value).size === value.length
}
