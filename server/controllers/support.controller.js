import { prisma } from '../config/prisma.js';
import { createSupportTicketSchema } from '../validation/support.schema.js';
import { AppError } from '../utils/app-error.js';
import { safeJsonStringify } from '../utils/json.js';

export const createSupportTicket = async (req, res, next) => {
  try {
    const payload = createSupportTicketSchema.parse(req.body);

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: req.user?.id,
        name: payload.name,
        email: payload.email,
        whatsapp: payload.whatsapp,
        discord: payload.discord,
        channel: payload.channel,
        subject: payload.subject,
        message: payload.message,
        metadata: safeJsonStringify(
          {
            userAgent: req.get('user-agent'),
            ip: req.ip
          },
          '{}'
        )
      }
    });

    res.status(201).json({
      success: true,
      data: ticket
    });
  } catch (error) {
    next(error);
  }
};

export const listUserTickets = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new AppError('Autenticacao necessaria', 401);
    }

    const tickets = await prisma.supportTicket.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: tickets
    });
  } catch (error) {
    next(error);
  }
};
