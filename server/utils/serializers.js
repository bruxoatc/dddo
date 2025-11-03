export const serializeUser = (user) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  avatarUrl: user.avatarUrl,
  role: user.role,
  phone: user.phone,
  preferredContact: user.preferredContact,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

export const serializeProduct = (product) => ({
  id: product.id,
  slug: product.slug,
  name: product.name,
  description: product.description,
  category: product.category,
  featured: product.featured,
  image: product.image,
  rating: product.rating,
  reviews: product.reviews,
  basePrice: product.basePrice !== null && product.basePrice !== undefined ? Number(product.basePrice) : null,
  inStock: product.inStock
});

export const serializePriceOption = (option) => ({
  id: option.id,
  productId: option.productId,
  label: option.label,
  durationDays: option.durationDays,
  price: Number(option.price),
  stock: option.stock,
  paymentUrl: option.paymentUrl
});
