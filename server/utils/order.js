import { serializeProduct, serializePriceOption } from './serializers.js';
import { safeJsonParse } from './json.js';

export const formatOrderItem = (item) => {
  let deliveryData = {};
  if (typeof item.deliveryData === 'string') {
    deliveryData = safeJsonParse(item.deliveryData, {});
  } else if (item.deliveryData && typeof item.deliveryData === 'object') {
    deliveryData = item.deliveryData;
  }

  return {
    id: item.id,
    quantity: item.quantity,
    unitPrice: Number(item.unitPrice),
    subtotal: Number(item.unitPrice) * item.quantity,
    product: item.product ? serializeProduct(item.product) : undefined,
    priceOption: item.priceOption ? serializePriceOption(item.priceOption) : undefined,
    deliveryData
  };
};

export const summarizeOrder = (order) => {
  const items = order.items.map(formatOrderItem);
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const metadata = typeof order.metadata === 'string'
    ? safeJsonParse(order.metadata, {})
    : (order.metadata ?? {});

  return {
    id: order.id,
    status: order.status,
    total: Number(order.total),
    subtotal,
    currency: order.currency,
    paymentProvider: order.paymentProvider,
    paymentReference: order.paymentReference,
    paymentUrl: order.paymentUrl,
    metadata,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    deliveredAt: order.deliveredAt,
    items
  };
};
