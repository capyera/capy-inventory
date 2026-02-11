import type { 
  Warehouse, 
  WarehouseInventory, 
  CrossWarehouseInventory,
  WarehouseTransfer,
  WarehouseType,
  StockStatus
} from '../types/warehouse';

// Warehouse configurations
export const WAREHOUSES: Warehouse[] = [
  {
    id: 'wh-mars',
    code: 'mars',
    name: 'Mars Factory',
    location: 'Shenzhen, China',
    type: 'primary',
    leadTimeDays: 21,
    isActive: true,
    capabilities: ['shopify_fulfillment', 'international'],
    costPerUnit: 0.50,
    apiConnected: true,
  },
  {
    id: 'wh-fba-us',
    code: 'fba',
    name: 'Amazon FBA (US)',
    location: 'Multiple US Locations',
    type: 'fulfillment',
    leadTimeDays: 3,
    isActive: true,
    capabilities: ['amazon_fba'],
    costPerUnit: 2.50,
    apiConnected: false, // TODO: Connect SP-API
  },
  {
    id: 'wh-tts',
    code: 'tts',
    name: 'TikTok Shop Fulfillment',
    location: 'US West Coast',
    type: 'marketplace',
    leadTimeDays: 5,
    isActive: true,
    capabilities: ['tiktok_fulfillment'],
    costPerUnit: 2.00,
    apiConnected: false, // TODO: Connect TTS API
  },
  {
    id: 'wh-us3pl',
    code: 'us3pl',
    name: 'US 3PL',
    location: 'Los Angeles, CA',
    type: 'fulfillment',
    leadTimeDays: 2,
    isActive: false, // Planned for Q2
    capabilities: ['shopify_fulfillment'],
    costPerUnit: 1.50,
    apiConnected: false,
  },
];

// Warehouse API
export const warehouseApi = {
  async getAll(): Promise<Warehouse[]> {
    return WAREHOUSES.filter(w => w.isActive);
  },

  async getById(id: string): Promise<Warehouse | null> {
    return WAREHOUSES.find(w => w.id === id) || null;
  },

  async getInventoryByWarehouse(warehouseCode: WarehouseType): Promise<WarehouseInventory[]> {
    // This would connect to respective APIs:
    // - Mars: Convex warehouseInventory table
    // - FBA: Amazon SP-API
    // - TTS: TikTok Shop API
    return getMockWarehouseInventory(warehouseCode);
  },

  async getCrossWarehouseInventory(): Promise<CrossWarehouseInventory[]> {
    const allInventory = await Promise.all(
      WAREHOUSES.filter(w => w.isActive).map(async (wh) => ({
        warehouse: wh.code,
        inventory: await this.getInventoryByWarehouse(wh.code),
      }))
    );

    // Aggregate by SKU
    const skuMap = new Map<string, CrossWarehouseInventory>();

    for (const { warehouse, inventory } of allInventory) {
      for (const item of inventory) {
        if (!skuMap.has(item.sku)) {
          skuMap.set(item.sku, {
            sku: item.sku,
            productName: item.productName,
            category: getCategoryFromSKU(item.sku),
            totalQuantity: 0,
            totalAvailable: 0,
            totalInbound: 0,
            totalReserved: 0,
            combinedVelocity: 0,
            totalDaysOfStock: 0,
            warehouses: {},
            stockoutRisk: { level: 'none', daysUntilStockout: 999, affectedWarehouses: [] },
          });
        }

        const cross = skuMap.get(item.sku)!;
        cross.totalQuantity += item.quantity;
        cross.totalAvailable += item.availableQty;
        cross.totalInbound += item.inboundQty;
        cross.totalReserved += item.reservedQty;
        cross.combinedVelocity += item.velocity30d;

        cross.warehouses[warehouse] = {
          quantity: item.quantity,
          available: item.availableQty,
          inbound: item.inboundQty,
          velocity: item.velocity30d,
          daysOfStock: item.daysOfStock,
          status: item.stockStatus,
        };
      }
    }

    // Calculate totals and risk
    const results = Array.from(skuMap.values()).map(item => {
      item.totalDaysOfStock = item.combinedVelocity > 0 
        ? Math.round(item.totalAvailable / item.combinedVelocity) 
        : 999;
      
      item.stockoutRisk = calculateStockoutRisk(item);
      item.recommendedTransfers = generateTransferRecommendations(item);
      
      return item;
    });

    return results.sort((a, b) => a.totalDaysOfStock - b.totalDaysOfStock);
  },

  async getTransfers(): Promise<WarehouseTransfer[]> {
    return getMockTransfers();
  },

  async createTransfer(transfer: Partial<WarehouseTransfer>): Promise<WarehouseTransfer> {
    console.log('Creating transfer:', transfer);
    throw new Error('Not implemented');
  },
};

// Helper functions
function getCategoryFromSKU(sku: string): string {
  if (sku.includes('KEY')) return 'charm';
  if (sku.includes('DUO') || sku.includes('FAMILY')) return 'bundle';
  if (sku.includes('-L-')) return 'jumbo';
  return 'plushie';
}

function calculateStockoutRisk(item: CrossWarehouseInventory): CrossWarehouseInventory['stockoutRisk'] {
  const daysOfStock = item.totalDaysOfStock;
  const affectedWarehouses: WarehouseType[] = [];

  // Check each warehouse for stockout risk
  for (const [wh, data] of Object.entries(item.warehouses)) {
    if (data && data.daysOfStock < 14) {
      affectedWarehouses.push(wh as WarehouseType);
    }
  }

  if (daysOfStock === 0) {
    return {
      level: 'critical',
      daysUntilStockout: 0,
      affectedWarehouses,
      estimatedLostRevenue: item.combinedVelocity * 16.19 * 30, // 30 days of lost sales
      recommendedAction: 'URGENT: Create emergency PO immediately',
    };
  } else if (daysOfStock < 7) {
    return {
      level: 'critical',
      daysUntilStockout: daysOfStock,
      affectedWarehouses,
      estimatedLostRevenue: item.combinedVelocity * 16.19 * (30 - daysOfStock),
      recommendedAction: 'Create PO and expedite shipping',
    };
  } else if (daysOfStock < 14) {
    return {
      level: 'high',
      daysUntilStockout: daysOfStock,
      affectedWarehouses,
      recommendedAction: 'Create PO this week',
    };
  } else if (daysOfStock < 21) {
    return {
      level: 'medium',
      daysUntilStockout: daysOfStock,
      affectedWarehouses,
      recommendedAction: 'Plan reorder within 7 days',
    };
  } else if (daysOfStock < 30) {
    return {
      level: 'low',
      daysUntilStockout: daysOfStock,
      affectedWarehouses: [],
    };
  }

  return {
    level: 'none',
    daysUntilStockout: daysOfStock,
    affectedWarehouses: [],
  };
}

function generateTransferRecommendations(item: CrossWarehouseInventory): WarehouseTransfer[] {
  const recommendations: WarehouseTransfer[] = [];
  
  // Check if FBA needs replenishment from Mars
  const mars = item.warehouses.mars;
  const fba = item.warehouses.fba;
  
  if (mars && fba && fba.daysOfStock < 14 && mars.daysOfStock > 30) {
    const transferQty = Math.min(
      Math.round(fba.velocity * 30), // 30 days of FBA stock
      Math.round(mars.available * 0.3) // Max 30% of Mars stock
    );
    
    if (transferQty > 0) {
      recommendations.push({
        id: `rec-${item.sku}-fba`,
        fromWarehouse: 'mars',
        toWarehouse: 'fba',
        sku: item.sku,
        productName: item.productName,
        quantity: transferQty,
        status: 'draft',
        reason: 'fba_replenishment',
        createdAt: new Date(),
      });
    }
  }
  
  return recommendations;
}

function getStockStatus(daysOfStock: number): StockStatus {
  if (daysOfStock === 0) return 'out_of_stock';
  if (daysOfStock < 7) return 'critical';
  if (daysOfStock < 14) return 'low';
  if (daysOfStock < 21) return 'watch';
  if (daysOfStock > 90) return 'overstock';
  return 'good';
}

// Mock data generators
function getMockWarehouseInventory(warehouse: WarehouseType): WarehouseInventory[] {
  const products = [
    { sku: 'OG-M-009', name: 'Cherry Capybara 10"', marsQty: 1250, fbaQty: 180, ttsQty: 95, v: 42 },
    { sku: 'OG-M-002', name: 'Strawberry Capybara 10"', marsQty: 890, fbaQty: 120, ttsQty: 65, v: 35 },
    { sku: 'OG-M-001', name: 'Orange Capybara 10"', marsQty: 620, fbaQty: 85, ttsQty: 45, v: 28 },
    { sku: 'OG-M-007', name: 'Matcha Capybara 10"', marsQty: 540, fbaQty: 90, ttsQty: 55, v: 25 },
    { sku: 'OG-M-008', name: 'Blueberry Capybara 10"', marsQty: 380, fbaQty: 75, ttsQty: 40, v: 22 },
    { sku: 'OG-M-003', name: 'Watermelon Capybara 10"', marsQty: 290, fbaQty: 45, ttsQty: 25, v: 18 },
    { sku: 'OG-M-004', name: 'Sakura Capybara 10"', marsQty: 180, fbaQty: 30, ttsQty: 20, v: 15 },
    { sku: 'OG-M-005', name: 'Violet Capybara 10"', marsQty: 75, fbaQty: 15, ttsQty: 10, v: 12 },
    { sku: 'OG-M-006', name: 'Lily Capybara 10"', marsQty: 45, fbaQty: 8, ttsQty: 5, v: 10 },
    { sku: 'OG-M-010', name: 'Avocado Capybara 10"', marsQty: 0, fbaQty: 0, ttsQty: 0, v: 8 },
    { sku: 'OG-M-011', name: 'Croissant Capybara 10"', marsQty: 220, fbaQty: 35, ttsQty: 20, v: 14 },
    { sku: 'OG-M-012', name: 'Coffee Capybara 10"', marsQty: 185, fbaQty: 28, ttsQty: 15, v: 12 },
    { sku: 'OG-KEY-007', name: 'Matcha Bag Charm', marsQty: 890, fbaQty: 150, ttsQty: 85, v: 28 },
    { sku: 'OG-KEY-009', name: 'Cherry Bag Charm', marsQty: 720, fbaQty: 130, ttsQty: 70, v: 32 },
    { sku: 'OG-KEY-003', name: 'Watermelon Bag Charm', marsQty: 450, fbaQty: 65, ttsQty: 35, v: 20 },
    { sku: 'OG-KEY-008', name: 'Blueberry Bag Charm', marsQty: 380, fbaQty: 55, ttsQty: 30, v: 18 },
    { sku: 'OG-KEY-001', name: 'Orange Bag Charm', marsQty: 25, fbaQty: 5, ttsQty: 3, v: 15 },
    { sku: 'LE-M-006', name: 'Secret Crush Valentine', marsQty: 340, fbaQty: 0, ttsQty: 0, v: 45 },
    { sku: 'LE-M-007', name: 'Rose Valentine', marsQty: 280, fbaQty: 0, ttsQty: 0, v: 38 },
    { sku: 'LE-M-008', name: 'White Choco Valentine', marsQty: 195, fbaQty: 0, ttsQty: 0, v: 32 },
  ];

  // Channel-specific velocity multipliers
  const velocityMultipliers: Record<WarehouseType, number> = {
    mars: 0.7,  // 70% of sales through Shopify (Mars)
    fba: 0.2,   // 20% through Amazon
    tts: 0.1,   // 10% through TikTok
    us3pl: 0,
  };

  return products.map(p => {
    const qty = warehouse === 'mars' ? p.marsQty 
              : warehouse === 'fba' ? p.fbaQty 
              : warehouse === 'tts' ? p.ttsQty 
              : 0;
    
    const velocity = p.v * velocityMultipliers[warehouse];
    const daysOfStock = velocity > 0 ? Math.round(qty / velocity) : 999;
    const reserved = Math.round(qty * 0.05); // 5% reserved for pending orders
    
    return {
      id: `${warehouse}-${p.sku}`,
      sku: p.sku,
      productName: p.name,
      warehouseId: `wh-${warehouse}`,
      warehouseCode: warehouse,
      quantity: qty,
      reservedQty: reserved,
      availableQty: qty - reserved,
      inboundQty: Math.random() > 0.7 ? Math.round(Math.random() * 200) : 0,
      velocity3d: velocity * (0.8 + Math.random() * 0.4),
      velocity7d: velocity * (0.9 + Math.random() * 0.2),
      velocity14d: velocity * (0.95 + Math.random() * 0.1),
      velocity30d: velocity,
      daysOfStock,
      reorderPoint: Math.round(velocity * 21), // 21 days lead time
      stockStatus: getStockStatus(daysOfStock),
      lastUpdated: new Date(),
    };
  });
}

function getMockTransfers(): WarehouseTransfer[] {
  return [
    {
      id: 'tr-001',
      fromWarehouse: 'mars',
      toWarehouse: 'fba',
      sku: 'OG-M-009',
      productName: 'Cherry Capybara 10"',
      quantity: 500,
      status: 'in_transit',
      reason: 'fba_replenishment',
      estimatedArrival: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      cost: 1250,
    },
    {
      id: 'tr-002',
      fromWarehouse: 'mars',
      toWarehouse: 'tts',
      sku: 'OG-M-002',
      productName: 'Strawberry Capybara 10"',
      quantity: 200,
      status: 'pending',
      reason: 'rebalance',
      createdAt: new Date(),
      cost: 500,
    },
  ];
}
