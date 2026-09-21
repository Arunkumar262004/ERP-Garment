import { z } from 'zod'

/** Exactly 10 digits, or empty (phone fields are optional almost everywhere). */
export const phoneSchema = z
  .string()
  .trim()
  .refine((v) => v === '' || /^\d{10}$/.test(v), { message: 'Phone number must be exactly 10 digits' })

/** Strips everything but digits and caps at 10 — makes it impossible to type letters or extra digits. */
export function sanitizePhoneInput(value: string): string {
  return value.replace(/\D/g, '').slice(0, 10)
}

/** Strips minus signs — makes it impossible to type a negative number. */
export function sanitizeNonNegativeInput(value: string): string {
  return value.replace(/-/g, '')
}

export function nonNegativeNumberSchema(label: string) {
  return z.coerce.number(`${label} must be a number`).min(0, `${label} cannot be negative`)
}

export function positiveNumberSchema(label: string) {
  return z.coerce.number(`${label} must be a number`).gt(0, `${label} must be greater than 0`)
}

/**
 * Validates a value against a schema; returns the first error message, or
 * null when valid. `undefined`/`''` are treated as "not entered" and skipped
 * — pair with `required` on the field for mandatory checks.
 */
export function firstZodError(schema: z.ZodTypeAny, value: unknown): string | null {
  if (value === '' || value === undefined || value === null) return null
  const result = schema.safeParse(value)
  return result.success ? null : (result.error.issues[0]?.message ?? 'Invalid value')
}

/**
 * Validates a quotation/invoice/order-style line-items array: quantity must
 * be greater than 0, unit_price/discount/tax_percent (whichever are present)
 * must not be negative. Returns the first error message, or null if all rows
 * are valid.
 */
const LINE_ITEM_LABELS: Record<string, string> = {
  unit_price: 'Unit Price',
  discount: 'Discount',
  tax_percent: 'Tax %',
  target_price: 'Target Price',
  gsm: 'GSM',
  cutting_weight_kg: 'Cut Weight',
}

export function validateLineItems<T extends object>(items: T[]): string | null {
  for (let i = 0; i < items.length; i++) {
    const item = items[i] as Record<string, unknown>
    const row = i + 1

    if ('quantity' in item) {
      const error = firstZodError(positiveNumberSchema('Quantity'), item.quantity)
      if (error) return `Line ${row}: ${error}`
    }

    for (const field of Object.keys(LINE_ITEM_LABELS)) {
      if (field in item && item[field] !== '' && item[field] != null) {
        const error = firstZodError(nonNegativeNumberSchema(LINE_ITEM_LABELS[field]), item[field])
        if (error) return `Line ${row}: ${error}`
      }
    }
  }

  return null
}
