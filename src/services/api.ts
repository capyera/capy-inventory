import type { InventoryItem, PurchaseOrder, Supplier, Bundle, COGSRecord, DashboardStats, AlertItem, ForecastSKU } from '../types';

// API Configuration
const CONVEX_URL = 'https://adventurous-fennec-839.convex.cloud';
// const SHOPIFY_STORE = '152919-65.myshopify.com';

// Helper to make Convex API calls
async function convexQuery<T>(functionName: string, args: Record<string, unknown> = {}): Promise<T> {
  const response = await fetch(`${CONVEX_URL}/api/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      path: functionName,
      args,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Convex query failed: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.value;
}

// Inventory API
export const inventoryApi = {
  async getAll(): Promise<InventoryItem[]> {
    try {
      const data = await convexQuery<Array<{
        sku: string;
        productName?: string;
        currentQty: number;
        updatedAt: number;
      }>>('inventory:listInventory');
      
      return data.map(item => ({
        id: item.sku,
        sku: item.sku,
        productName: item.productName || item.sku,
        category: getCategoryFromSKU(item.sku),
        currentQty: item.currentQty,
        inboundQty: 0,
        poQty: 0,
        totalAvailable: item.currentQty,
        velocity3d: 0,
        velocity14d: 0,
        velocity30d: 0,
        par3d: 999,
        par14d: 999,
        par30d: 999,
        reorderPoint: 100,
        reorderQty: 500,
        lastUpdated: new Date(item.updatedAt),
      }));
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
      return getMockInventory();
    }
  },
  
  async getBySku(sku: string): Promise<InventoryItem | null> {
    const all = await this.getAll();
    return all.find(item => item.sku === sku) || null;
  },
  
  async updateQuantity(sku: string, quantity: number): Promise<void> {
    // This would call a Convex mutation
    console.log(`Updating ${sku} to ${quantity}`);
  },
};

// Dashboard Stats
export const dashboardApi = {
  async getStats(): Promise<DashboardStats> {
    const inventory = await inventoryApi.getAll();
    
    const totalUnits = inventory.reduce((sum, item) => sum + item.currentQty, 0);
    const lowStockCount = inventory.filter(item => item.currentQty > 0 && item.currentQty < 50).length;
    const outOfStockCount = inventory.filter(item => item.currentQty === 0).length;
    
    // Calculate total value (assuming average cost of $8 per unit for plushies)
    const totalValue = inventory.reduce((sum, item) => {
      const unitCost = item.category === 'charm' ? 4 : 8;
      return sum + (item.currentQty * unitCost);
    }, 0);
    
    return {
      totalSKUs: inventory.length,
      totalUnits,
      totalValue,
      lowStockCount,
      outOfStockCount,
      inboundValue: 0,
      averageVelocity: inventory.reduce((sum, i) => sum + i.velocity30d, 0) / inventory.length || 0,
      turnoverRate: 4.2,
    };
  },
  
  async getAlerts(): Promise<AlertItem[]> {
    const inventory = await inventoryApi.getAll();
    const alerts: AlertItem[] = [];
    
    inventory.forEach(item => {
      if (item.currentQty === 0) {
        alerts.push({
          id: `alert-${item.sku}-stockout`,
          type: 'stockout',
          severity: 'critical',
          sku: item.sku,
          productName: item.productName,
          message: `${item.productName} is out of stock!`,
          createdAt: new Date(),
          isRead: false,
        });
      } else if (item.currentQty < 30) {
        alerts.push({
          id: `alert-${item.sku}-low`,
          type: 'low_stock',
          severity: 'warning',
          sku: item.sku,
          productName: item.productName,
          message: `${item.productName} is running low (${item.currentQty} units)`,
          createdAt: new Date(),
          isRead: false,
        });
      }
    });
    
    return alerts.slice(0, 10);
  },
};

// Bundles API
export const bundlesApi = {
  async getAll(): Promise<Bundle[]> {
    return getMockBundles();
  },
  
  async getById(id: string): Promise<Bundle | null> {
    const bundles = await this.getAll();
    return bundles.find(b => b.id === id) || null;
  },
};

// Purchase Orders API
export const purchaseOrdersApi = {
  async getAll(): Promise<PurchaseOrder[]> {
    return getMockPurchaseOrders();
  },
  
  async create(po: Partial<PurchaseOrder>): Promise<PurchaseOrder> {
    console.log('Creating PO:', po);
    throw new Error('Not implemented');
  },
};

// Suppliers API
export const suppliersApi = {
  async getAll(): Promise<Supplier[]> {
    return getMockSuppliers();
  },
};

// COGS API
export const cogsApi = {
  async getAll(): Promise<COGSRecord[]> {
    return getMockCOGS();
  },
};

// Forecast API
export const forecastApi = {
  async getForecastVsInventory(): Promise<ForecastSKU[]> {
    const inventory = await inventoryApi.getAll();
    
    return inventory.slice(0, 20).map(item => ({
      sku: item.sku,
      name: item.productName,
      forecastUnits: Math.round(item.velocity30d * 30) + 100,
      currentInventory: item.currentQty,
      inboundUnits: item.inboundQty,
      gap: Math.round(item.velocity30d * 30) + 100 - item.currentQty - item.inboundQty,
      canFulfill: item.currentQty + item.inboundQty >= Math.round(item.velocity30d * 30),
    }));
  },
};

// Helper functions
function getCategoryFromSKU(sku: string): string {
  if (sku.includes('KEY')) return 'charm';
  if (sku.includes('DUO') || sku.includes('FAMILY')) return 'bundle';
  if (sku.includes('-L-')) return 'jumbo';
  if (sku.includes('-M-')) return 'plushie';
  return 'plushie';
}

// Mock data for development
function getMockInventory(): InventoryItem[] {
  const products = [
    { sku: 'OG-M-009', name: 'Cherry Capybara 10"', category: 'plushie', qty: 1250, v30: 42 },
    { sku: 'OG-M-002', name: 'Strawberry Capybara 10"', category: 'plushie', qty: 890, v30: 35 },
    { sku: 'OG-M-001', name: 'Orange Capybara 10"', category: 'plushie', qty: 620, v30: 28 },
    { sku: 'OG-M-007', name: 'Matcha Capybara 10"', category: 'plushie', qty: 540, v30: 25 },
    { sku: 'OG-M-008', name: 'Blueberry Capybara 10"', category: 'plushie', qty: 380, v30: 22 },
    { sku: 'OG-M-003', name: 'Watermelon Capybara 10"', category: 'plushie', qty: 290, v30: 18 },
    { sku: 'OG-M-004', name: 'Sakura Capybara 10"', category: 'plushie', qty: 180, v30: 15 },
    { sku: 'OG-M-005', name: 'Violet Capybara 10"', category: 'plushie', qty: 75, v30: 12 },
    { sku: 'OG-M-006', name: 'Lily Capybara 10"', category: 'plushie', qty: 45, v30: 10 },
    { sku: 'OG-M-010', name: 'Avocado Capybara 10"', category: 'plushie', qty: 0, v30: 8 },
    { sku: 'OG-M-011', name: 'Croissant Capybara 10"', category: 'plushie', qty: 220, v30: 14 },
    { sku: 'OG-M-012', name: 'Coffee Capybara 10"', category: 'plushie', qty: 185, v30: 12 },
    { sku: 'OG-KEY-007', name: 'Matcha Bag Charm', category: 'charm', qty: 890, v30: 28 },
    { sku: 'OG-KEY-009', name: 'Cherry Bag Charm', category: 'charm', qty: 720, v30: 32 },
    { sku: 'OG-KEY-003', name: 'Watermelon Bag Charm', category: 'charm', qty: 450, v30: 20 },
    { sku: 'OG-KEY-008', name: 'Blueberry Bag Charm', category: 'charm', qty: 380, v30: 18 },
    { sku: 'OG-KEY-001', name: 'Orange Bag Charm', category: 'charm', qty: 25, v30: 15 },
    { sku: 'LE-M-006', name: 'Secret Crush Valentine', category: 'plushie', qty: 340, v30: 45 },
    { sku: 'LE-M-007', name: 'Rose Valentine', category: 'plushie', qty: 280, v30: 38 },
    { sku: 'LE-M-008', name: 'White Choco Valentine', category: 'plushie', qty: 195, v30: 32 },
  ];
  
  return products.map(p => ({
    id: p.sku,
    sku: p.sku,
    productName: p.name,
    category: p.category,
    currentQty: p.qty,
    inboundQty: Math.random() > 0.7 ? Math.round(Math.random() * 500) : 0,
    poQty: Math.random() > 0.8 ? Math.round(Math.random() * 1000) : 0,
    totalAvailable: p.qty,
    velocity3d: p.v30 * (0.8 + Math.random() * 0.4),
    velocity14d: p.v30 * (0.9 + Math.random() * 0.2),
    velocity30d: p.v30,
    par3d: p.v30 > 0 ? Math.round(p.qty / (p.v30 * 1.1)) : 999,
    par14d: p.v30 > 0 ? Math.round(p.qty / p.v30) : 999,
    par30d: p.v30 > 0 ? Math.round(p.qty / (p.v30 * 0.9)) : 999,
    reorderPoint: p.v30 * 14,
    reorderQty: p.v30 * 30,
    lastUpdated: new Date(),
    cost: p.category === 'charm' ? 4.50 : 8.25,
    price: p.category === 'charm' ? 13.53 : 16.19,
  }));
}

function getMockBundles(): Bundle[] {
  return [
    {
      id: 'bundle-1',
      sku: 'OG-DUO-009',
      name: 'Cherry Duo Bundle',
      price: 27.99,
      isActive: true,
      components: [
        { sku: 'OG-M-009', name: 'Cherry Capybara 10"', quantity: 1 },
        { sku: 'OG-KEY-009', name: 'Cherry Bag Charm', quantity: 1 },
      ],
    },
    {
      id: 'bundle-2',
      sku: 'OG-DUO-007',
      name: 'Matcha Duo Bundle',
      price: 27.99,
      isActive: true,
      components: [
        { sku: 'OG-M-007', name: 'Matcha Capybara 10"', quantity: 1 },
        { sku: 'OG-KEY-007', name: 'Matcha Bag Charm', quantity: 1 },
      ],
    },
    {
      id: 'bundle-3',
      sku: 'OG-FAMILY-009',
      name: 'Cherry Family Bundle',
      price: 45.99,
      isActive: true,
      components: [
        { sku: 'OG-L-009', name: 'Cherry Capybara Jumbo', quantity: 1 },
        { sku: 'OG-M-009', name: 'Cherry Capybara 10"', quantity: 1 },
        { sku: 'OG-KEY-009', name: 'Cherry Bag Charm', quantity: 1 },
      ],
    },
  ];
}

function getMockSuppliers(): Supplier[] {
  return [
    {
      id: 'sup-1',
      code: 'MARS',
      name: 'Mars Factory',
      email: 'orders@marsfactory.cn',
      phone: '+86 123 456 7890',
      leadTimeDays: 21,
      minOrderQty: 500,
      products: ['OG-M-*', 'OG-KEY-*'],
      notes: 'Primary plushie manufacturer',
      createdAt: new Date('2024-01-01'),
    },
    {
      id: 'sup-2',
      code: 'STAR',
      name: 'Star Textiles',
      email: 'sales@startextiles.com',
      leadTimeDays: 30,
      minOrderQty: 200,
      products: ['CLOTHING-*'],
      createdAt: new Date('2024-03-15'),
    },
  ];
}

function getMockPurchaseOrders(): PurchaseOrder[] {
  const suppliers = getMockSuppliers();
  return [
    {
      id: 'po-001',
      poNumber: 'PO-2026-0215',
      supplier: suppliers[0],
      status: 'confirmed',
      totalCost: 12500,
      expectedDate: new Date('2026-02-28'),
      createdAt: new Date('2026-02-01'),
      items: [
        { sku: 'OG-M-009', name: 'Cherry Capybara 10"', quantityOrdered: 500, quantityReceived: 0, unitCost: 8.25, totalCost: 4125 },
        { sku: 'OG-M-002', name: 'Strawberry Capybara 10"', quantityOrdered: 400, quantityReceived: 0, unitCost: 8.25, totalCost: 3300 },
        { sku: 'OG-KEY-007', name: 'Matcha Bag Charm', quantityOrdered: 600, quantityReceived: 0, unitCost: 4.50, totalCost: 2700 },
      ],
    },
    {
      id: 'po-002',
      poNumber: 'PO-2026-0210',
      supplier: suppliers[0],
      status: 'partial',
      totalCost: 8750,
      expectedDate: new Date('2026-02-20'),
      createdAt: new Date('2026-01-28'),
      items: [
        { sku: 'LE-M-006', name: 'Secret Crush Valentine', quantityOrdered: 800, quantityReceived: 400, unitCost: 9.50, totalCost: 7600 },
      ],
    },
  ];
}

function getMockCOGS(): COGSRecord[] {
  const products = getMockInventory().slice(0, 12);
  
  return products.map((p, i) => {
    const unitsSold = Math.round(p.velocity30d * 30);
    const revenue = unitsSold * (p.price || 16.19);
    const cost = unitsSold * (p.cost || 8.25);
    const profit = revenue - cost;
    
    return {
      id: `cogs-${i}`,
      sku: p.sku,
      productName: p.productName,
      unitCost: p.cost || 8.25,
      unitPrice: p.price || 16.19,
      margin: (p.price || 16.19) - (p.cost || 8.25),
      marginPercent: ((p.price || 16.19) - (p.cost || 8.25)) / (p.price || 16.19),
      totalUnitsSold: unitsSold,
      totalRevenue: revenue,
      totalCost: cost,
      totalProfit: profit,
      period: 'Last 30 Days',
    };
  });
}
