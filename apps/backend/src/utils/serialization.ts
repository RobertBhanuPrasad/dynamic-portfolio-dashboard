import { Prisma } from '@prisma/client';

/**
 * Converts a Prisma Decimal safely to a JavaScript number for JSON serialization.
 * Avoids Decimal implementation details leaking into the API response.
 */
export const decimalToNumber = (decimalValue: Prisma.Decimal): number => {
  return decimalValue.toNumber();
};
