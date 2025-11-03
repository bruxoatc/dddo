import { Router } from 'express';
import { handlePixWebhook, handlePagSeguroWebhook } from '../controllers/webhook.controller.js';

export const webhooksRouter = Router();

webhooksRouter.post('/pix', (req, res, next) => {
  try {
    const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || '{}');
    req.bodyRaw = raw.toString();
    req.body = JSON.parse(req.bodyRaw || '{}');
  } catch {
    req.body = {};
    req.bodyRaw = '';
  }
  handlePixWebhook(req, res, next);
});

webhooksRouter.post('/pagseguro', (req, res, next) => {
  try {
    const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || '{}');
    req.bodyRaw = raw.toString();
    req.body = JSON.parse(req.bodyRaw || '{}');
  } catch {
    req.body = {};
  }
  handlePagSeguroWebhook(req, res, next);
});
