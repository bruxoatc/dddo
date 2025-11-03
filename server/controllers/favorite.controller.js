import { prisma } from '../config/prisma.js';
import { serializeProduct } from '../utils/serializers.js';
import { AppError } from '../utils/app-error.js';

export const listFavorites = async (req, res, next) => {
  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: req.user.id },
      include: {
        product: {
          include: {
            priceOptions: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: favorites.map((favorite) => ({
        id: favorite.id,
        product: serializeProduct(favorite.product),
        priceOptions: favorite.product.priceOptions.map((option) => ({
          id: option.id,
          label: option.label,
          price: Number(option.price),
          stock: option.stock,
          paymentUrl: option.paymentUrl
        }))
      }))
    });
  } catch (error) {
    next(error);
  }
};

export const addFavorite = async (req, res, next) => {
  try {
    const productId = Number(req.body.productId);
    if (!productId) {
      throw new AppError('Produto inválido', 400);
    }

    const product = await prisma.product.findUnique({
      where: { id: productId }
    });
    if (!product) {
      throw new AppError('Produto não encontrado', 404);
    }

    const favorite = await prisma.favorite.upsert({
      where: {
        userId_productId: {
          userId: req.user.id,
          productId
        }
      },
      update: {},
      create: {
        userId: req.user.id,
        productId
      }
    });

    res.status(201).json({ success: true, data: favorite });
  } catch (error) {
    next(error);
  }
};

export const removeFavorite = async (req, res, next) => {
  try {
    const productId = Number(req.params.productId);
    if (!productId) {
      throw new AppError('Produto inválido', 400);
    }

    await prisma.favorite.deleteMany({
      where: {
        userId: req.user.id,
        productId
      }
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
