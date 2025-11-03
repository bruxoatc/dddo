import crypto from 'crypto';
import { env } from '../config/env.js';
import { enqueueOrderStatusUpdate } from '../services/webhook-processor.js';
import { logger } from '../utils/logger.js';

const verifySignature = (payload, signature, secret) => {
  if (!secret) return true; // fallback se nao configurado
  if (!signature || typeof signature !== 'string') return false;

  try {
    const expected = crypto.createHmac('sha256', secret).update(payload).digest();
    const received = Buffer.from(signature, 'hex');
    if (received.length !== expected.length) {
      return false;
    }
    return crypto.timingSafeEqual(received, expected);
  } catch {
    return false;
  }
};

const QUEUE_ACK = { success: true, queued: true };

export const handlePixWebhook = async (req, res) => {
  const signature = req.get('x-pix-signature');
  const rawBody = req.bodyRaw ?? JSON.stringify(req.body);

  if (!verifySignature(rawBody, signature, env.PIX_WEBHOOK_SECRET)) {
    return res.status(401).json({ success: false, message: 'Assinatura invalida' });
  }

  const { transaction } = req.body ?? {};
  if (transaction?.metadata?.orderId) {
    const status = transaction.status === 'paid' ? 'PAID' : 'FAILED';
    const job = enqueueOrderStatusUpdate({
      orderId: transaction.metadata.orderId,
      status,
      reference: transaction.id
    });

    if (!res.locals) {
      res.locals = {};
    }
    res.locals.webhookJob = job;

    job.catch((error) => {
      logger.error({ err: error }, 'PIX webhook job failed');
    });
  }

  return res.status(202).json(QUEUE_ACK);
};

export const handlePagSeguroWebhook = async (req, res) => {
  const { notificationCode, reference, status } = req.body ?? {};

  if (reference) {
    let mappedStatus = 'PENDING';
    if (status === 'PAID' || status === 'APPROVED') {
      mappedStatus = 'PAID';
    } else if (status === 'CANCELLED' || status === 'REFUNDED') {
      mappedStatus = 'CANCELLED';
    }

    const job = enqueueOrderStatusUpdate({
      orderId: reference,
      status: mappedStatus,
      reference: notificationCode
    });

    if (!res.locals) {
      res.locals = {};
    }
    res.locals.webhookJob = job;

    job.catch((error) => {
      logger.error({ err: error }, 'PagSeguro webhook job failed');
    });
  }

  return res.status(202).json(QUEUE_ACK);
};



