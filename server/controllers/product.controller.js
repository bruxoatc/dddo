import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/app-error.js';
import { serializePriceOption, serializeProduct } from '../utils/serializers.js';

export const listProducts = async (req, res, next) => {
  try {
    const {
      search,
      category,
      featured,
      inStock,
      minPrice,
      maxPrice,
      page,
      pageSize
    } = req.validatedQuery;

    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (category) {
      where.category = category;
    }

    if (typeof featured === 'boolean') {
      where.featured = featured;
    }

    if (typeof inStock === 'boolean') {
      where.inStock = inStock;
    }

    if (minPrice || maxPrice) {
      where.priceOptions = {
        some: {
          ...(typeof minPrice === 'number' ? { price: { gte: minPrice } } : {}),
          ...(typeof maxPrice === 'number' ? { price: { lte: maxPrice } } : {})
        }
      };
    }

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          priceOptions: true
        }
      }),
      prisma.product.count({ where })
    ]);

    res.json({
      success: true,
      data: items.map((product) => ({
        ...serializeProduct(product),
        priceOptions: product.priceOptions.map(serializePriceOption)
      })),
      pagination: {
        page,
        pageSize,
        total,
        pageCount: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getProduct = async (req, res, next) => {
  try {
    const productId = Number(req.params.id);
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { priceOptions: true }
    });

    if (!product) {
      throw new AppError('Produto não encontrado', 404);
    }

    res.json({
      success: true,
      data: {
        ...serializeProduct(product),
        priceOptions: product.priceOptions.map(serializePriceOption)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getProductOptions = async (req, res, next) => {
  try {
    const productId = Number(req.params.id);
    const priceOptions = await prisma.priceOption.findMany({
      where: { productId },
      orderBy: { price: 'asc' }
    });
    res.json({
      success: true,
      data: priceOptions.map(serializePriceOption)
    });
  } catch (error) {
    next(error);
  }
};

export const getCategories = async (_req, res, next) => {
  try {
    const categories = await prisma.product.findMany({
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' }
    });

    res.json({
      success: true,
      data: categories.map((c) => c.category)
    });
  } catch (error) {
    next(error);
  }
};

export const getHighlights = async (_req, res, next) => {
  try {
    const highlights = await prisma.product.findMany({
      where: {
        featured: true
      },
      orderBy: [
        { rating: 'desc' },
        { reviews: 'desc' }
      ],
      take: 6,
      include: {
        priceOptions: {
          orderBy: { price: 'asc' },
          take: 1
        }
      }
    });

    res.json({
      success: true,
      data: highlights.map((product) => ({
        ...serializeProduct(product),
        priceOptions: product.priceOptions.map(serializePriceOption)
      }))
    });
  } catch (error) {
    next(error);
  }
};
