import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import { safeJsonParse, safeJsonStringify } from '../utils/json.js';
import { TaskQueue } from '../utils/task-queue.js';
import { logger } from '../utils/logger.js';

const concurrency = (() => {
  const value = Number(env.WEBHOOK_QUEUE_CONCURRENCY ?? 1);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 1;
})();

const queue = new TaskQueue({
  concurrency,
  onError: (error) => {
    logger.error({ err: error }, 'webhook queue job failed');
  }
});

const updateOrderStatus = async (orderId, status, reference = null) => {
  if (!orderId) return;

  const existing = await prisma.purchase.findUnique({
    where: { id: orderId }
  });

  if (!existing) {
    return;
  }

  const metadata = safeJsonParse(existing.metadata, {});
  const nextMetadata = safeJsonStringify(
    {
      ...metadata,
      updatedByWebhook: true,
      lastWebhookAt: new Date().toISOString()
    },
    '{}'
  );

  await prisma.purchase.update({
    where: { id: orderId },
    data: {
      status,
      paymentReference: reference ?? undefined,
      metadata: nextMetadata
    }
  });
};

export const enqueueOrderStatusUpdate = ({ orderId, status, reference }) => {
  return queue.add(() => updateOrderStatus(orderId, status, reference));
};

export const getWebhookQueueSnapshot = () => ({
  pending: queue.size,
  active: queue.active,
  concurrency
});


