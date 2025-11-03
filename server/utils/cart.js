import { serializePriceOption, serializeProduct } from './serializers.js';

const getUnitPrice = (item) => {
  if (item.priceOption) {
    return Number(item.priceOption.price);
  }
  if (item.product.basePrice) {
    return Number(item.product.basePrice);
  }
  return 0;
};

export const formatCartItem = (item) => {
  const unitPrice = getUnitPrice(item);
  return {
    id: item.id,
    quantity: item.quantity,
    product: serializeProduct(item.product),
    priceOption: item.priceOption ? serializePriceOption(item.priceOption) : null,
    unitPrice,
    subtotal: unitPrice * item.quantity
  };
};

export const summarizeCart = (items) => {
  const formatted = items.map(formatCartItem);
  const total = formatted.reduce((sum, item) => sum + item.subtotal, 0);
  const itemCount = formatted.reduce((sum, item) => sum + item.quantity, 0);
  return {
    items: formatted,
    summary: {
      itemCount,
      total
    }
  };
};
