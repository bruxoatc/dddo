import { z } from 'zod';

export const addCartItemSchema = z.object({
  productId: z.coerce.number().int().min(1),
  priceOptionId: z.coerce.number().int().min(1).optional(),
  quantity: z.coerce.number().int().min(1).max(10).default(1)
});

export const updateCartItemSchema = z.object({
  quantity: z.coerce.number().int().min(1).max(10)
});
