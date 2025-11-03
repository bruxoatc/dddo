import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const products = [
  {
    id: 1,
    slug: 'valorant-aim-color',
    name: 'VALORANT AIM COLOR',
    description: 'Versão otimizada, super leve e fácil de usar. Configuração simples via aplicativo ou bloco de notas.',
    category: 'valorant',
    featured: true,
    image: 'Pngs/valorant aim color.png',
    rating: 4.9,
    reviews: 234,
    basePrice: 20,
    inStock: true,
    priceOptions: [
      { label: '1 Dia', price: 20, stock: 15, paymentUrl: 'https://pag.ae/7_RdWGnKn' },
      { label: '7 Dias', price: 75, stock: 6, paymentUrl: 'https://pag.ae/7_RdWwvTH' },
      { label: '30 Dias', price: 150, stock: 10, paymentUrl: 'https://pag.ae/7_RdW5LS2' },
      { label: 'Lifetime', price: 375, stock: 5, paymentUrl: 'https://pag.ae/7_RdVct7H' }
    ]
  },
  {
    id: 2,
    slug: 'valorant-bypass',
    name: 'VALORANT BYPASS',
    description: 'Corrija rapidamente erros relacionados a TPM, Secure Boot e HVCI. Compatível com Windows 10/11.',
    category: 'valorant',
    featured: false,
    image: 'Pngs/VALORANT BYPASS.png',
    rating: 4.8,
    reviews: 187,
    basePrice: 17,
    inStock: true,
    priceOptions: [
      { label: '1 Dia', price: 17, stock: 6, paymentUrl: 'https://pag.ae/7_RdXuVGa' },
      { label: '7 Dias', price: 55, stock: 10, paymentUrl: 'https://pag.ae/7_RdXh6B2' },
      { label: '30 Dias', price: 80, stock: 10, paymentUrl: 'https://pag.ae/7_RdX3rps' }
    ]
  },
  {
    id: 3,
    slug: 'valorant-nfa',
    name: 'VALORANT NFA',
    description: 'Contas NFA verificadas manualmente, com diferentes faixas de skins e níveis.',
    category: 'valorant',
    featured: false,
    image: 'Pngs/VALORANT NFA.png',
    rating: 4.7,
    reviews: 412,
    basePrice: 7,
    inStock: true,
    priceOptions: [
      { label: 'Random 1-10 Skins', price: 7, stock: 15, paymentUrl: 'https://pag.ae/7_RqrwrsN' },
      { label: 'Random 11-20 Skins', price: 13, stock: 27, paymentUrl: 'https://pag.ae/7_RqrRuHH' },
      { label: 'Random 21-30 Skins', price: 17, stock: 11, paymentUrl: 'https://pag.ae/7_Rqs5Yba' },
      { label: 'Random 31-40 Skins', price: 25, stock: 0, paymentUrl: null },
      { label: 'Random 41-50 Skins', price: 30, stock: 2, paymentUrl: 'https://pag.ae/7_RqsMzTR' }
    ]
  },
  {
    id: 4,
    slug: 'leagueof',
    name: 'LEAGUEOF',
    description: 'Ferramentas avançadas para League of Legends com combo automático, farm, esquiva e muito mais.',
    category: 'league',
    featured: false,
    image: 'Pngs/LEAGUEOFMENU.png',
    rating: 4.6,
    reviews: 158,
    basePrice: 75,
    inStock: true,
    priceOptions: [
      { label: '7 Dias', price: 75, stock: 9999, paymentUrl: 'https://pag.ae/7_RWGq_B9' },
      { label: '30 Dias', price: 100, stock: 9999, paymentUrl: 'https://pag.ae/7_RWGUnHP' }
    ]
  },
  {
    id: 5,
    slug: 'valorant-nfa-aleatoria',
    name: 'VALORANT NFA ALEATÓRIA',
    description: 'Conta Valorant NFA com conteúdo variado e aleatório de skins, ranks e agentes.',
    category: 'valorant',
    featured: true,
    image: 'Pngs/VAVAALE.png',
    rating: 4.9,
    reviews: 520,
    basePrice: 5,
    inStock: true,
    priceOptions: [
      { label: 'Conta Aleatória', price: 5, stock: 175, paymentUrl: 'https://pag.ae/7_RWNVFNP' }
    ]
  }
];

const coupons = [
  {
    code: 'DESCONTO10',
    description: '10% de desconto',
    discountType: 'percentage',
    value: 10,
    active: true
  },
  {
    code: 'WELCOME',
    description: '15% OFF para novos clientes',
    discountType: 'percentage',
    value: 15,
    active: true
  },
  {
    code: 'AMEX2024',
    description: '20% de desconto especial',
    discountType: 'percentage',
    value: 20,
    active: true
  }
];

const adminUser = {
  email: 'admin@amexstore.com',
  name: 'Administrador',
  password: 'Admin123!',
  role: 'ADMIN'
};

async function main() {
  console.log('⏳ Limpando base...');
  await prisma.purchaseItem.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.priceOption.deleteMany();
  await prisma.product.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.user.deleteMany();

  console.log('🛠️ Inserindo produtos...');
  for (const product of products) {
    await prisma.product.create({
      data: {
        id: product.id,
        slug: product.slug,
        name: product.name,
        description: product.description,
        category: product.category,
        featured: product.featured,
        image: product.image,
        rating: product.rating,
        reviews: product.reviews,
        basePrice: product.basePrice,
        inStock: product.inStock,
        priceOptions: {
          create: product.priceOptions.map((option) => ({
            label: option.label,
            price: option.price,
            stock: option.stock ?? null,
            paymentUrl: option.paymentUrl
          }))
        }
      }
    });
  }

  console.log('🎟️ Inserindo cupons...');
  for (const coupon of coupons) {
    await prisma.coupon.create({
      data: coupon
    });
  }

  console.log('👤 Criando usuário administrador...');
  const passwordHash = await bcrypt.hash(adminUser.password, 10);
  await prisma.user.create({
    data: {
      email: adminUser.email,
      name: adminUser.name,
      passwordHash,
      role: adminUser.role
    }
  });

  console.log('✅ Seed concluído com sucesso.');
}

main()
  .catch((error) => {
    console.error('Seed falhou:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
