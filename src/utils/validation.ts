// Validation Utilities using Zod

import { z } from 'zod';

// Phone number validation (10 digits)
export const phoneSchema = z
  .string()
  .length(10, 'Phone number must be exactly 10 digits')
  .regex(/^[0-9]+$/, 'Phone number must contain only digits');

// Email validation
export const emailSchema = z.string().email('Invalid email format');

// Decimal validation with precision
export const decimalSchema = (precision: number = 2) =>
  z.number().refine((val) => {
    const parts = val.toString().split('.');
    return !parts[1] || parts[1].length <= precision;
  }, `Maximum ${precision} decimal places allowed`);

// Weight validation (3 decimal precision)
export const weightSchema = z
  .number()
  .positive('Weight must be positive')
  .refine((val) => {
    const parts = val.toString().split('.');
    return !parts[1] || parts[1].length <= 3;
  }, 'Maximum 3 decimal places allowed for weight');

// Amount validation (2 decimal precision)
export const amountSchema = z
  .number()
  .nonnegative('Amount cannot be negative')
  .refine((val) => {
    const parts = val.toString().split('.');
    return !parts[1] || parts[1].length <= 2;
  }, 'Maximum 2 decimal places allowed for amount');

// Date range validation
export const dateRangeSchema = z
  .object({
    startDate: z.string().or(z.date()).optional(),
    endDate: z.string().or(z.date()).optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.startDate) <= new Date(data.endDate);
      }
      return true;
    },
    {
      message: 'Start date must be before or equal to end date',
    }
  );

// Pagination validation
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
});

// UUID validation
export const uuidSchema = z.string().uuid('Invalid ID format');
