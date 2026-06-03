import { PrismaClient, Role, DimensionType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding started...');

  // 1. Clean existing data
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.quotationItem.deleteMany({});
  await prisma.quotation.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Cleared database tables.');

  // 2. Create seed users
  const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
  const sellerPasswordHash = await bcrypt.hash('Seller@123', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@aasamedchem.com',
      password: adminPasswordHash,
      role: Role.ADMIN,
    },
  });

  const seller = await prisma.user.create({
    data: {
      name: 'Seller User',
      email: 'seller@aasamedchem.com',
      password: sellerPasswordHash,
      role: Role.SELLER,
    },
  });

  console.log('Seeded users:', { admin: admin.email, seller: seller.email });

  // 3. Create seed products (20 sample products)
  const productsData = [
    // WEIGHT Products (internal unit: g, price: per gram)
    {
      sku: 'W-SUG-001',
      name: 'Sugar',
      description: 'Fine granulated white chemical-grade sugar.',
      category: 'Organic Compound',
      dimensionType: DimensionType.WEIGHT,
      baseUnit: 'g',
      basePrice: 0.08000, // ₹0.08 per gram (₹80 per kg)
      inventoryQuantity: 1000000.00000, // 1,000,000 g (1,000 kg)
    },
    {
      sku: 'W-SLT-002',
      name: 'Salt (NaCl)',
      description: 'Pure Sodium Chloride laboratory reagent.',
      category: 'Inorganic Salt',
      dimensionType: DimensionType.WEIGHT,
      baseUnit: 'g',
      basePrice: 0.04000, // ₹0.04 per gram (₹40 per kg)
      inventoryQuantity: 5000000.00000, // 5,000,000 g (5,000 kg)
    },
    {
      sku: 'W-SOH-007',
      name: 'Sodium Hydroxide (NaOH)',
      description: 'Caustic soda flakes, high purity.',
      category: 'Inorganic Base',
      dimensionType: DimensionType.WEIGHT,
      baseUnit: 'g',
      basePrice: 0.50000, // ₹0.50 per gram (₹500 per kg)
      inventoryQuantity: 100000.00000, // 100,000 g (100 kg)
    },
    {
      sku: 'W-CTA-012',
      name: 'Citric Acid',
      description: 'Anhydrous citric acid powder.',
      category: 'Organic Acid',
      dimensionType: DimensionType.WEIGHT,
      baseUnit: 'g',
      basePrice: 0.18000, // ₹0.18 per gram (₹180 per kg)
      inventoryQuantity: 200000.00000, // 200,000 g (200 kg)
    },
    {
      sku: 'W-CAC-015',
      name: 'Calcium Carbonate (CaCO3)',
      description: 'Precipitated calcium carbonate powder.',
      category: 'Inorganic Salt',
      dimensionType: DimensionType.WEIGHT,
      baseUnit: 'g',
      basePrice: 0.22000, // ₹0.22 per gram (₹220 per kg)
      inventoryQuantity: 150000.00000, // 150,000 g (150 kg)
    },
    {
      sku: 'W-SBC-018',
      name: 'Sodium Bicarbonate (NaHCO3)',
      description: 'Baking soda, high grade laboratory reagent.',
      category: 'Inorganic Salt',
      dimensionType: DimensionType.WEIGHT,
      baseUnit: 'g',
      basePrice: 0.06000, // ₹0.06 per gram (₹60 per kg)
      inventoryQuantity: 300000.00000, // 300,000 g (300 kg)
    },
    {
      sku: 'W-SUL-019',
      name: 'Sulfur Powder',
      description: 'Elemental sulfur, fine yellow powder.',
      category: 'Element',
      dimensionType: DimensionType.WEIGHT,
      baseUnit: 'g',
      basePrice: 0.35000, // ₹0.35 per gram (₹350 per kg)
      inventoryQuantity: 80000.00000, // 80,000 g (80 kg)
    },

    // VOLUME Products (internal unit: mL, price: per mL)
    {
      sku: 'V-ETH-003',
      name: 'Ethanol',
      description: '99.9% Absolute Ethanol solvent.',
      category: 'Alcohol / Solvent',
      dimensionType: DimensionType.VOLUME,
      baseUnit: 'mL',
      basePrice: 0.15000, // ₹0.15 per mL (₹150 per L)
      inventoryQuantity: 500000.00000, // 500,000 mL (500 L)
    },
    {
      sku: 'V-ACT-004',
      name: 'Acetone',
      description: 'Analytical Reagent grade Acetone.',
      category: 'Ketone / Solvent',
      dimensionType: DimensionType.VOLUME,
      baseUnit: 'mL',
      basePrice: 0.25000, // ₹0.25 per mL (₹250 per L)
      inventoryQuantity: 250000.00000, // 250,000 mL (250 L)
    },
    {
      sku: 'V-MTH-005',
      name: 'Methanol',
      description: 'High purity Methanol for industrial/lab use.',
      category: 'Alcohol / Solvent',
      dimensionType: DimensionType.VOLUME,
      baseUnit: 'mL',
      basePrice: 0.12000, // ₹0.12 per mL (₹120 per L)
      inventoryQuantity: 400000.00000, // 400,000 mL (400 L)
    },
    {
      sku: 'V-DIW-006',
      name: 'Distilled Water',
      description: 'Deionized and double-distilled water.',
      category: 'Solvent',
      dimensionType: DimensionType.VOLUME,
      baseUnit: 'mL',
      basePrice: 0.02000, // ₹0.02 per mL (₹20 per L)
      inventoryQuantity: 2000000.00000, // 2,000,000 mL (2,000 L)
    },
    {
      sku: 'V-HCL-008',
      name: 'Hydrochloric Acid (HCl)',
      description: '37% Concentrated Hydrochloric Acid.',
      category: 'Inorganic Acid',
      dimensionType: DimensionType.VOLUME,
      baseUnit: 'mL',
      basePrice: 0.30000, // ₹0.30 per mL (₹300 per L)
      inventoryQuantity: 150000.00000, // 150,000 mL (150 L)
    },
    {
      sku: 'V-GLY-013',
      name: 'Glycerin',
      description: '99.5% Pure vegetable glycerin liquid.',
      category: 'Alcohol / Polyol',
      dimensionType: DimensionType.VOLUME,
      baseUnit: 'mL',
      basePrice: 0.09000, // ₹0.09 per mL (₹90 per L)
      inventoryQuantity: 600000.00000, // 600,000 mL (600 L)
    },
    {
      sku: 'V-IPA-014',
      name: 'Isopropyl Alcohol (IPA)',
      description: '99% Isopropanol rubbing alcohol.',
      category: 'Alcohol / Solvent',
      dimensionType: DimensionType.VOLUME,
      baseUnit: 'mL',
      basePrice: 0.18000, // ₹0.18 per mL (₹180 per L)
      inventoryQuantity: 800000.00000, // 800,000 mL (800 L)
    },
    {
      sku: 'V-NTA-020',
      name: 'Nitric Acid (HNO3)',
      description: '68% Concentrated Nitric Acid solution.',
      category: 'Inorganic Acid',
      dimensionType: DimensionType.VOLUME,
      baseUnit: 'mL',
      basePrice: 0.45000, // ₹0.45 per mL (₹450 per L)
      inventoryQuantity: 120000.00000, // 120,000 mL (120 L)
    },

    // COUNT Products (internal unit: unit, price: per item)
    {
      sku: 'C-BEA-250',
      name: 'Beaker 250ml',
      description: 'Borosilicate glass beaker with graduation lines.',
      category: 'Glassware',
      dimensionType: DimensionType.COUNT,
      baseUnit: 'unit',
      basePrice: 120.00000, // ₹120 per unit
      inventoryQuantity: 500.00000, // 500 units
    },
    {
      sku: 'C-FLK-500',
      name: 'Flask 500ml',
      description: 'Erlenmeyer conical borosilicate glass flask.',
      category: 'Glassware',
      dimensionType: DimensionType.COUNT,
      baseUnit: 'unit',
      basePrice: 250.00000, // ₹250 per unit
      inventoryQuantity: 300.00000, // 300 units
    },
    {
      sku: 'C-TST-001',
      name: 'Test Tube',
      description: 'Standard 15x125mm glass test tube.',
      category: 'Glassware',
      dimensionType: DimensionType.COUNT,
      baseUnit: 'unit',
      basePrice: 15.00000, // ₹15 per unit
      inventoryQuantity: 2000.00000, // 2000 units
    },
    {
      sku: 'C-PIP-010',
      name: 'Pipette 10ml',
      description: 'Graduated glass measuring pipette.',
      category: 'Lab Equipment',
      dimensionType: DimensionType.COUNT,
      baseUnit: 'unit',
      basePrice: 80.00000, // ₹80 per unit
      inventoryQuantity: 400.00000, // 400 units
    },
    {
      sku: 'C-PHP-100',
      name: 'pH Paper Pack',
      description: 'pH indicator test strips, range 1-14 (100 strips/pack).',
      category: 'Consumables',
      dimensionType: DimensionType.COUNT,
      baseUnit: 'unit',
      basePrice: 45.00000, // ₹45 per unit
      inventoryQuantity: 1000.00000, // 1000 units
    },
  ];

  for (const prod of productsData) {
    await prisma.product.create({
      data: {
        sku: prod.sku,
        name: prod.name,
        description: prod.description,
        category: prod.category,
        dimensionType: prod.dimensionType,
        baseUnit: prod.baseUnit,
        basePrice: prod.basePrice,
        inventoryQuantity: prod.inventoryQuantity,
      },
    });
  }

  console.log(`Seeded ${productsData.length} products successfully.`);
  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
