import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/app-error.js';
import { summarizeCart } from '../utils/cart.js';

const loadCartItems = (userId) =>
  prisma.cartItem.findMany({
    where: { userId },
    include: {
      product: true,
      priceOption: true
    },
    orderBy: { createdAt: 'asc' }
  });

const ensureProductAndOption = async (productId, priceOptionId) => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { priceOptions: true }
  });
  if (!product) {
    throw new AppError('Produto não encontrado', 404);
  }

  let priceOption = null;

  if (priceOptionId) {
    priceOption = product.priceOptions.find((option) => option.id === priceOptionId);
    if (!priceOption) {
      throw new AppError('Opção de preço inválida para este produto', 400);
    }
    if (priceOption.stock !== null && priceOption.stock !== undefined && priceOption.stock <= 0) {
      throw new AppError('Esta opção está sem estoque', 400);
    }
  }

  if (!priceOption && !product.inStock) {
    throw new AppError('Produto sem estoque no momento', 400);
  }

  return { product, priceOption };
};

export const getCart = async (req, res, next) => {
  try {
    const items = await loadCartItems(req.user.id);
    res.json({ success: true, ...summarizeCart(items) });
  } catch (error) {
    next(error);
  }
};

export const addToCart = async (req, res, next) => {
  try {
    const { productId, priceOptionId, quantity } = req.validatedBody;
    const { product, priceOption } = await ensureProductAndOption(productId, priceOptionId);

    let maxStock = priceOption?.stock ?? product?.priceOptions?.reduce((max, option) => {
      if (option.stock === null || option.stock === undefined) return max;
      return Math.max(max, option.stock);
    }, 0);

    if (!priceOption && (product.basePrice === null || product.basePrice === undefined)) {
      throw new AppError('Produto sem preço definido', 400);
    }

    if (!maxStock || maxStock <= 0) {
      maxStock = 10;
    }

    const existing = await prisma.cartItem.findFirst({
      where: {
        userId: req.user.id,
        productId,
        priceOptionId: priceOptionId ?? null
      }
    });

    let newQuantity = quantity;

    if (existing) {
      newQuantity = Math.min(existing.quantity + quantity, maxStock);
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: newQuantity }
      });
    } else {
      newQuantity = Math.min(quantity, maxStock);
      await prisma.cartItem.create({
        data: {
          userId: req.user.id,
          productId,
          priceOptionId: priceOptionId ?? null,
          quantity: newQuantity
        }
      });
    }

    const items = await loadCartItems(req.user.id);
    res.status(existing ? 200 : 201).json({
      success: true,
      message: existing ? 'Item atualizado no carrinho' : 'Item adicionado ao carrinho',
      ...summarizeCart(items)
    });
  } catch (error) {
    next(error);
  }
};

export const updateCartItem = async (req, res, next) => {
  try {
    const itemId = Number(req.params.id);
    const { quantity } = req.validatedBody;

    const item = await prisma.cartItem.findFirst({
      where: { id: itemId, userId: req.user.id },
      include: {
        priceOption: true,
        product: {
          include: { priceOptions: true }
        }
      }
    });

    if (!item) {
      throw new AppError('Item não encontrado no carrinho', 404);
    }

    const stock = item.priceOption?.stock ?? item.product?.priceOptions?.reduce((max, option) => {
      if (option.stock === null || option.stock === undefined) return max;
      return Math.max(max, option.stock);
    }, 0);

    const maxQuantity = stock && stock > 0 ? stock : 10;
    if (quantity > maxQuantity) {
      throw new AppError(`Quantidade máxima permitida: ${maxQuantity}`, 400);
    }

    await prisma.cartItem.update({
      where: { id: item.id },
      data: { quantity }
    });

    const items = await loadCartItems(req.user.id);
    res.json({
      success: true,
      message: 'Item atualizado',
      ...summarizeCart(items)
    });
  } catch (error) {
    next(error);
  }
};

export const removeCartItem = async (req, res, next) => {
  try {
    const itemId = Number(req.params.id);
    await prisma.cartItem.deleteMany({
      where: { id: itemId, userId: req.user.id }
    });

    const items = await loadCartItems(req.user.id);
    res.json({
      success: true,
      message: 'Item removido',
      ...summarizeCart(items)
    });
  } catch (error) {
    next(error);
  }
};

export const clearCart = async (req, res, next) => {
  try {
    await prisma.cartItem.deleteMany({ where: { userId: req.user.id } });
    res.json({
      success: true,
      message: 'Carrinho esvaziado',
      items: [],
      summary: {
        itemCount: 0,
        total: 0
      }
    });
  } catch (error) {
    next(error);
  }
};
