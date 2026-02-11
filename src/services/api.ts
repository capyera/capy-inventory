import type { InventoryItem, PurchaseOrder, Supplier, Bundle, COGSRecord, DashboardStats, AlertItem, ForecastSKU } from '../types';
import { shopifyApi, shopifyData, shopifyTransform, type SKUInventoryData, type SKUVelocityData } from './shopify';

// API Configuration
const CONVEX_URL = 'https://adventurous-fennec-839.convex.cloud';

// Feature flag: Use real Shopify data
const USE_SHOPIFY = import.meta.env.VITE_USE_SHOPIFY === 'true' || false;

// Shopify data cache
let shopifyInventoryCache: SKUInventoryData[] | null = null;
let shopifyVelocityCache: Map<string, SKUVelocityData> | null = null;
let shopifyCacheTime: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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
    // Try Shopify first if enabled
    if (USE_SHOPIFY) {
      try {
        return await this.getFromShopify();
      } catch (error) {
        console.warn('Shopify fetch failed, falling back to mock data:', error);
      }
    }
    
    // Try Convex
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
  
  async getFromShopify(): Promise<InventoryItem[]> {
    const now = Date.now();
    
    // Use cache if valid
    if (shopifyInventoryCache && shopifyVelocityCache && now - shopifyCacheTime < CACHE_TTL) {
      return this.transformShopifyData(shopifyInventoryCache, shopifyVelocityCache);
    }
    
    // Fetch fresh data from Shopify
    const [inventory, velocityMap] = await Promise.all([
      shopifyData.getSKUInventory(),
      shopifyData.getSKUVelocity(30),
    ]);
    
    // Update cache
    shopifyInventoryCache = inventory;
    shopifyVelocityCache = velocityMap;
    shopifyCacheTime = now;
    
    return this.transformShopifyData(inventory, velocityMap);
  },
  
  transformShopifyData(
    inventory: SKUInventoryData[], 
    velocityMap: Map<string, SKUVelocityData>
  ): InventoryItem[] {
    return inventory.map(item => {
      const velocity = velocityMap.get(item.sku);
      const v30 = velocity?.velocity30d || 0;
      const v14 = velocity?.velocity14d || 0;
      const v7 = velocity?.velocity7d || 0;
      
      return {
        id: item.sku,
        sku: item.sku,
        productName: `${item.productTitle}${item.variantTitle !== 'Default Title' ? ` - ${item.variantTitle}` : ''}`,
        category: getCategoryFromSKU(item.sku) || getCategoryFromType(item.productType),
        currentQty: item.shopifyQuantity,
        inboundQty: 0, // Would need separate tracking
        poQty: 0,
        totalAvailable: item.shopifyQuantity,
        velocity3d: v7,
        velocity14d: v14,
        velocity30d: v30,
        par3d: v7 > 0 ? Math.round(item.shopifyQuantity / v7) : 999,
        par14d: v14 > 0 ? Math.round(item.shopifyQuantity / v14) : 999,
        par30d: v30 > 0 ? Math.round(item.shopifyQuantity / v30) : 999,
        reorderPoint: Math.round(v30 * 14), // 2 weeks
        reorderQty: Math.round(v30 * 45), // 6 weeks
        lastUpdated: new Date(),
        cost: item.price * 0.5, // Estimate 50% margin
        price: item.price,
      };
    });
  },
  
  async getBySku(sku: string): Promise<InventoryItem | null> {
    const all = await this.getAll();
    return all.find(item => item.sku === sku) || null;
  },
  
  async updateQuantity(sku: string, quantity: number): Promise<void> {
    // This would call a Convex mutation or Shopify API
    console.log(`Updating ${sku} to ${quantity}`);
  },
  
  async syncFromShopify(): Promise<{ products: number; orders: number }> {
    shopifyData.clearCache();
    
    const [products, orders] = await Promise.all([
      shopifyApi.getProducts(),
      shopifyApi.getRecentOrders(30),
    ]);
    
    // Update caches
    shopifyInventoryCache = shopifyTransform.productsToSKUData(products);
    shopifyVelocityCache = shopifyTransform.ordersToVelocityData(orders);
    shopifyCacheTime = Date.now();
    
    return {
      products: products.length,
      orders: orders.length,
    };
  },
};

// Dashboard Stats
export const dashboardApi = {
  async getStats(): Promise<DashboardStats> {
    const inventory = await inventoryApi.getAll();
    
    const totalUnits = inventory.reduce((sum, item) => sum + item.currentQty, 0);
    const lowStockCount = inventory.filter(item => item.currentQty > 0 && item.currentQty < 50).length;
    const outOfStockCount = inventory.filter(item => item.currentQty === 0).length;
    
    // Calculate total value using actual prices
    const totalValue = inventory.reduce((sum, item) => {
      const unitCost = item.cost || (item.category === 'charm' ? 4 : 8);
      return sum + (item.currentQty * unitCost);
    }, 0);
    
    const avgVelocity = inventory.reduce((sum, i) => sum + i.velocity30d, 0) / inventory.length || 0;
    
    return {
      totalSKUs: inventory.length,
      totalUnits,
      totalValue,
      lowStockCount,
      outOfStockCount,
      inboundValue: inventory.reduce((sum, i) => sum + (i.inboundQty * (i.cost || 8)), 0),
      averageVelocity: avgVelocity,
      turnoverRate: avgVelocity > 0 ? (avgVelocity * 365) / (totalUnits / inventory.length) : 0,
    };
  },
  
  async getAlerts(): Promise<AlertItem[]> {
    const inventory = await inventoryApi.getAll();
    const alerts: AlertItem[] = [];
    
    inventory.forEach(item => {
      const daysOfStock = item.velocity30d > 0 ? item.currentQty / item.velocity30d : 999;
      
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
      } else if (daysOfStock < 7) {
        alerts.push({
          id: `alert-${item.sku}-critical`,
          type: 'low_stock',
          severity: 'critical',
          sku: item.sku,
          productName: item.productName,
          message: `${item.productName} has only ${Math.round(daysOfStock)} days of stock!`,
          createdAt: new Date(),
          isRead: false,
        });
      } else if (daysOfStock < 14) {
        alerts.push({
          id: `alert-${item.sku}-low`,
          type: 'low_stock',
          severity: 'warning',
          sku: item.sku,
          productName: item.productName,
          message: `${item.productName} is running low (${item.currentQty} units, ${Math.round(daysOfStock)} days)`,
          createdAt: new Date(),
          isRead: false,
        });
      }
    });
    
    return alerts.sort((a, b) => {
      const severityOrder = { critical: 0, warning: 1, info: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    }).slice(0, 10);
  },
  
  async getShopifyStats(): Promise<{
    connected: boolean;
    productCount: number;
    orderCount30d: number;
    revenue30d: number;
    aov: number;
    newCustomerPct: number;
    lastSync: Date | null;
  }> {
    if (!USE_SHOPIFY) {
      return {
        connected: false,
        productCount: 0,
        orderCount30d: 0,
        revenue30d: 0,
        aov: 0,
        newCustomerPct: 0,
        lastSync: null,
      };
    }
    
    try {
      const summary = await shopifyData.getOrderSummary(30);
      const productCount = await shopifyApi.getProductCount();
      
      return {
        connected: true,
        productCount,
        orderCount30d: summary.totalOrders,
        revenue30d: summary.totalRevenue,
        aov: summary.averageOrderValue,
        newCustomerPct: summary.totalOrders > 0 
          ? (summary.newCustomerOrders / summary.totalOrders) * 100 
          : 0,
        lastSync: new Date(),
      };
    } catch (error) {
      console.error('Failed to fetch Shopify stats:', error);
      return {
        connected: false,
        productCount: 0,
        orderCount30d: 0,
        revenue30d: 0,
        aov: 0,
        newCustomerPct: 0,
        lastSync: null,
      };
    }
  },
};

// Bundles API - now uses bundleRegistry
import { bundleRegistry } from './bundleRegistry';
import { orderProcessor, type ProcessedLineItem, type SKUSalesData } from './orderProcessor';

export const bundlesApi = {
  async getAll(): Promise<Bundle[]> {
    return bundleRegistry.getAll();
  },
  
  async getById(id: string): Promise<Bundle | null> {
    return bundleRegistry.getById(id);
  },
  
  async getBySku(sku: string): Promise<Bundle | null> {
    return bundleRegistry.getBySku(sku);
  },
  
  async create(bundle: Omit<Bundle, 'id'>): Promise<Bundle> {
    return bundleRegistry.create(bundle);
  },
  
  async update(bundleSku: string, updates: Partial<Bundle>): Promise<Bundle | null> {
    return bundleRegistry.update(bundleSku, updates);
  },
  
  async delete(bundleSku: string): Promise<boolean> {
    return bundleRegistry.delete(bundleSku);
  },
};

// Order Processing API - for bundle breakdown
export const orderProcessingApi = {
  /**
   * Process orders with bundle explosion
   */
  async processOrders(orders: { line_items: Array<{ sku: string; quantity: number; price: string; title: string }> }[]): Promise<ProcessedLineItem[]> {
    // Convert to ShopifyOrder format
    const shopifyOrders = orders.map((o, i) => ({
      id: i,
      order_number: i,
      name: `#${i}`,
      email: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      closed_at: null,
      cancelled_at: null,
      financial_status: 'paid' as const,
      fulfillment_status: null,
      total_price: '0',
      subtotal_price: '0',
      total_tax: '0',
      total_discounts: '0',
      total_shipping_price_set: { shop_money: { amount: '0' } },
      currency: 'USD',
      customer: null,
      line_items: o.line_items.map((item, j) => ({
        id: j,
        variant_id: 0,
        product_id: 0,
        title: item.title,
        variant_title: '',
        sku: item.sku,
        quantity: item.quantity,
        price: item.price,
        total_discount: '0',
        fulfillment_status: null,
      })),
      shipping_address: null,
      tags: '',
    }));
    
    return orderProcessor.processOrders(shopifyOrders);
  },
  
  /**
   * Get component-level velocity from Shopify orders
   */
  async getComponentVelocity(days: number = 30): Promise<Map<string, SKUSalesData>> {
    if (!USE_SHOPIFY) {
      return new Map();
    }
    
    try {
      const orders = await shopifyApi.getRecentOrders(days);
      const processedItems = orderProcessor.processOrders(orders);
      return orderProcessor.aggregateSalesBySKU(processedItems);
    } catch (error) {
      console.error('Failed to calculate component velocity:', error);
      return new Map();
    }
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

function getCategoryFromType(productType: string): string {
  const type = productType.toLowerCase();
  if (type.includes('charm') || type.includes('keychain')) return 'charm';
  if (type.includes('bundle')) return 'bundle';
  if (type.includes('jumbo') || type.includes('large')) return 'jumbo';
  if (type.includes('clothing') || type.includes('shirt') || type.includes('hoodie')) return 'clothing';
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

// getMockBundles removed - now using bundleRegistry

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
