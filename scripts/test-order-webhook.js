import crypto from 'crypto';

process.env.PIX_WEBHOOK_SECRET = process.env.PIX_WEBHOOK_SECRET || 'test-secret';

const [{ prisma }, { createOrderFromCart }, { handlePixWebhook }] = await Promise.all([
  import('../server/config/prisma.js'),
  import('../server/controllers/order.controller.js'),
  import('../server/controllers/webhook.controller.js')
]);

const mockResponse = () => {
  return {
    statusCode: 200,
    body: null,
    cookies: new Map(),
    locals: {},
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
    cookie(name, value) {
      this.cookies.set(name, value);
      return this;
    },
    clearCookie(name) {
      this.cookies.delete(name);
      return this;
    }
  };
};

const mockNext = (label) => (error) => {
  if (error) {
    error.message = `[${label}] ${error.message}`;
    throw error;
  }
};

const randomSuffix = crypto.randomUUID().split('-')[0];
const testIds = {
  userEmail: `test-user-${randomSuffix}@amex.local`,
  productId: Math.floor(Math.random() * 1_000_000),
  productSlug: `test-product-${randomSuffix}`,
  priceOptionLabel: `Test Option ${randomSuffix}`,
  pixTransactionId: `pix-${randomSuffix}`
};

let createdUser;
let createdPriceOption;
let createdOrderId;

try {
  createdUser = await prisma.user.create({
    data: {
      email: testIds.userEmail,
      name: 'Order Test User',
      passwordHash: 'placeholder-hash',
      role: 'USER'
    }
  });

  const product = await prisma.product.create({
    data: {
      id: testIds.productId,
      slug: testIds.productSlug,
      name: 'Test Product',
      description: 'Product created for automated test.',
      category: 'tests',
      featured: false,
      image: 'Pngs/test.png',
      basePrice: 99.9,
      inStock: true,
      priceOptions: {
        create: [
          {
            label: testIds.priceOptionLabel,
            price: 49.9,
            stock: 5,
            paymentUrl: 'https://example.com/payment'
          }
        ]
      }
    },
    include: {
      priceOptions: true
    }
  });

  createdPriceOption = product.priceOptions[0];

  await prisma.cartItem.create({
    data: {
      userId: createdUser.id,
      productId: product.id,
      priceOptionId: createdPriceOption.id,
      quantity: 2
    }
  });

  const createReq = {
    body: { notes: 'Automated test order' },
    user: createdUser,
    cookies: {},
    get: () => undefined
  };
  const createRes = mockResponse();
  await createOrderFromCart(createReq, createRes, mockNext('createOrderFromCart'));

  if (createRes.statusCode !== 201) {
    throw new Error(`Expected order creation status 201, received ${createRes.statusCode}`);
  }

  if (!createRes.body?.success) {
    throw new Error('Order creation response missing success flag');
  }

  createdOrderId = createRes.body.data?.id;
  if (!createdOrderId) {
    throw new Error('Order creation did not return an order id');
  }

  const signaturePayload = {
    transaction: {
      id: testIds.pixTransactionId,
      status: 'paid',
      metadata: {
        orderId: createdOrderId
      }
    }
  };

  const rawBody = JSON.stringify(signaturePayload);
  const signature = crypto
    .createHmac('sha256', process.env.PIX_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');

  const webhookReq = {
    body: signaturePayload,
    bodyRaw: rawBody,
    get: (header) => (header?.toLowerCase() === 'x-pix-signature' ? signature : undefined)
  };

  const webhookRes = mockResponse();
  await handlePixWebhook(webhookReq, webhookRes, mockNext('handlePixWebhook'));

  if (webhookRes.statusCode !== 202) {
    throw new Error(`Expected webhook status 202, received ${webhookRes.statusCode}`);
  }

  if (webhookRes.locals?.webhookJob) {
    await webhookRes.locals.webhookJob;
  }

  const updatedOrder = await prisma.purchase.findUnique({
    where: { id: createdOrderId }
  });

  if (!updatedOrder) {
    throw new Error('Order not found after webhook processing');
  }

  if (updatedOrder.status !== 'PAID') {
    throw new Error(`Expected order status PAID, received ${updatedOrder.status}`);
  }

  if (!updatedOrder.metadata?.includes('updatedByWebhook')) {
    throw new Error('Order metadata was not updated by webhook');
  }

  const badSignatureReq = {
    body: signaturePayload,
    bodyRaw: rawBody,
    get: () => 'invalid-signature'
  };
  const badSignatureRes = mockResponse();
  await handlePixWebhook(badSignatureReq, badSignatureRes, mockNext('handlePixWebhook'));

  if (badSignatureRes.statusCode !== 401) {
    throw new Error(`Expected invalid signature status 401, received ${badSignatureRes.statusCode}`);
  }

  console.log('✅ Pedido criado e webhook PIX validado com sucesso.');
  console.log(`   → Pedido ${createdOrderId} marcado como PAID e metadata atualizada.`);
} catch (error) {
  console.error('❌ Falha ao validar fluxo de pedido + webhook:', error);
  process.exitCode = 1;
} finally {
  if (createdOrderId) {
    await prisma.purchaseItem.deleteMany({ where: { purchaseId: createdOrderId } });
    await prisma.purchase.deleteMany({ where: { id: createdOrderId } });
  }

  if (createdUser) {
    await prisma.cartItem.deleteMany({ where: { userId: createdUser.id } });
    await prisma.favorite.deleteMany({ where: { userId: createdUser.id } });
    await prisma.session.deleteMany({ where: { userId: createdUser.id } });
    await prisma.user.delete({ where: { id: createdUser.id } });
  }

  if (createdPriceOption) {
    await prisma.priceOption.deleteMany({ where: { id: createdPriceOption.id } });
    await prisma.product.deleteMany({ where: { id: testIds.productId } });
  }

  await prisma.$disconnect();
}
