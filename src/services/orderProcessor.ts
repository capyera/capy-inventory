/**
 * Order Processor Service
 * 
 * Processes Shopify orders with bundle auto-breakdown:
 * - Detects bundle SKUs in line items
 * - Explodes bundles into component SKUs
 * - Tracks quantity at component level
 * - Supports velocity calculation at component level
 */

import { bundleRegistry, isBundle, getBundleComponents, getProductName } from './bundleRegistry';
import type { ShopifyOrder, ShopifyLineItem } from './shopify';

/**
 * A processed line item with bundle information
 */
export interface ProcessedLineItem {
  sku: string;
  name: string;
  quantity: number;
  price: number;
  originalSku: string;
  fromBundle: string | null;
  bundleName: string | null;
  isComponent: boolean;
}

/**
 * Aggregated SKU sales data (component-level)
 */
export interface SKUSalesData {
  sku: string;
  name: string;
  totalQuantity: number;
  directSales: number;      // Sold as standalone
  bundleSales: number;      // Sold as part of bundles
  bundleBreakdown: {        // Which bundles contributed
    bundleSku: string;
    bundleName: string;
    quantity: number;
  }[];
  revenue: number;
  orderCount: number;
}

/**
 * Bundle sales summary
 */
export interface BundleSalesData {
  bundleSku: string;
  bundleName: string;
  totalQuantity: number;
  revenue: number;
  orderCount: number;
  componentImpact: {        // Component demand generated
    sku: string;
    name: string;
    quantity: number;
  }[];
}

/**
 * Process a single order's line items, exploding bundles into components
 */
export function processOrderLineItems(lineItems: ShopifyLineItem[]): ProcessedLineItem[] {
  const explodedItems: ProcessedLineItem[] = [];
  
  for (const item of lineItems) {
    if (!item.sku) continue;
    
    if (isBundle(item.sku)) {
      // Get bundle info
      const bundle = bundleRegistry.getBySku(item.sku);
      const componentSkus = getBundleComponents(item.sku);
      
      // Add original bundle line (for tracking bundle-level sales)
      explodedItems.push({
        sku: item.sku,
        name: bundle?.name || item.title,
        quantity: item.quantity,
        price: parseFloat(item.price),
        originalSku: item.sku,
        fromBundle: null,
        bundleName: null,
        isComponent: false,
      });
      
      // Explode into components
      for (const componentSku of componentSkus) {
        explodedItems.push({
          sku: componentSku,
          name: getProductName(componentSku),
          quantity: item.quantity,
          price: 0, // Component price not tracked separately
          originalSku: componentSku,
          fromBundle: item.sku,
          bundleName: bundle?.name || item.sku,
          isComponent: true,
        });
      }
    } else {
      // Regular item, pass through
      explodedItems.push({
        sku: item.sku,
        name: item.title,
        quantity: item.quantity,
        price: parseFloat(item.price),
        originalSku: item.sku,
        fromBundle: null,
        bundleName: null,
        isComponent: false,
      });
    }
  }
  
  return explodedItems;
}

/**
 * Process multiple orders and return exploded line items
 */
export function processOrders(orders: ShopifyOrder[]): ProcessedLineItem[] {
  const allItems: ProcessedLineItem[] = [];
  
  for (const order of orders) {
    // Skip cancelled/refunded orders
    if (order.cancelled_at || order.financial_status === 'refunded') continue;
    
    const processedItems = processOrderLineItems(order.line_items);
    allItems.push(...processedItems);
  }
  
  return allItems;
}

/**
 * Aggregate sales data by SKU at component level
 */
export function aggregateSalesBySKU(items: ProcessedLineItem[]): Map<string, SKUSalesData> {
  const salesMap = new Map<string, SKUSalesData>();
  
  for (const item of items) {
    // Skip bundle-level entries (we only want components/direct sales)
    if (isBundle(item.sku) && !item.fromBundle) continue;
    
    let data = salesMap.get(item.sku);
    if (!data) {
      data = {
        sku: item.sku,
        name: item.name,
        totalQuantity: 0,
        directSales: 0,
        bundleSales: 0,
        bundleBreakdown: [],
        revenue: 0,
        orderCount: 0,
      };
      salesMap.set(item.sku, data);
    }
    
    data.totalQuantity += item.quantity;
    data.orderCount++;
    
    if (item.fromBundle) {
      // This came from a bundle
      data.bundleSales += item.quantity;
      
      // Track which bundle
      const existingBundle = data.bundleBreakdown.find(b => b.bundleSku === item.fromBundle);
      if (existingBundle) {
        existingBundle.quantity += item.quantity;
      } else {
        data.bundleBreakdown.push({
          bundleSku: item.fromBundle!,
          bundleName: item.bundleName || item.fromBundle!,
          quantity: item.quantity,
        });
      }
    } else {
      // Direct sale
      data.directSales += item.quantity;
      data.revenue += item.price * item.quantity;
    }
  }
  
  return salesMap;
}

/**
 * Aggregate sales data by bundle
 */
export function aggregateSalesByBundle(items: ProcessedLineItem[]): Map<string, BundleSalesData> {
  const bundleMap = new Map<string, BundleSalesData>();
  
  for (const item of items) {
    // Only process bundle-level entries (not component explosions)
    if (!isBundle(item.sku) || item.fromBundle) continue;
    
    let data = bundleMap.get(item.sku);
    if (!data) {
      const bundle = bundleRegistry.getBySku(item.sku);
      data = {
        bundleSku: item.sku,
        bundleName: bundle?.name || item.name,
        totalQuantity: 0,
        revenue: 0,
        orderCount: 0,
        componentImpact: [],
      };
      bundleMap.set(item.sku, data);
    }
    
    data.totalQuantity += item.quantity;
    data.revenue += item.price * item.quantity;
    data.orderCount++;
  }
  
  // Calculate component impact for each bundle
  for (const data of bundleMap.values()) {
    const componentSkus = getBundleComponents(data.bundleSku);
    data.componentImpact = componentSkus.map(sku => ({
      sku,
      name: getProductName(sku),
      quantity: data.totalQuantity,
    }));
  }
  
  return bundleMap;
}

/**
 * Calculate velocity at component level from orders
 */
export function calculateComponentVelocity(
  orders: ShopifyOrder[],
  days: number = 30
): Map<string, {
  sku: string;
  name: string;
  totalUnits: number;
  directUnits: number;
  bundleUnits: number;
  dailyVelocity: number;
  bundleContribution: number; // Percentage from bundles
}> {
  const processedItems = processOrders(orders);
  const salesData = aggregateSalesBySKU(processedItems);
  
  const velocityMap = new Map<string, {
    sku: string;
    name: string;
    totalUnits: number;
    directUnits: number;
    bundleUnits: number;
    dailyVelocity: number;
    bundleContribution: number;
  }>();
  
  for (const [sku, data] of salesData) {
    velocityMap.set(sku, {
      sku: data.sku,
      name: data.name,
      totalUnits: data.totalQuantity,
      directUnits: data.directSales,
      bundleUnits: data.bundleSales,
      dailyVelocity: Math.round((data.totalQuantity / days) * 100) / 100,
      bundleContribution: data.totalQuantity > 0 
        ? Math.round((data.bundleSales / data.totalQuantity) * 100) 
        : 0,
    });
  }
  
  return velocityMap;
}

/**
 * Calculate potential bundle fulfillment based on component inventory
 */
export function calculateBundleFulfillment(
  bundleSku: string,
  inventoryMap: Map<string, number>
): {
  canFulfill: number;
  limitingComponent: string | null;
  componentAvailability: { sku: string; name: string; available: number; needed: number }[];
} {
  const componentSkus = getBundleComponents(bundleSku);
  
  if (componentSkus.length === 0) {
    return {
      canFulfill: 0,
      limitingComponent: null,
      componentAvailability: [],
    };
  }
  
  let minCanFulfill = Infinity;
  let limitingComponent: string | null = null;
  const componentAvailability: { sku: string; name: string; available: number; needed: number }[] = [];
  
  for (const sku of componentSkus) {
    const available = inventoryMap.get(sku) || 0;
    const canMake = available; // Assuming 1 of each component per bundle
    
    componentAvailability.push({
      sku,
      name: getProductName(sku),
      available,
      needed: 1,
    });
    
    if (canMake < minCanFulfill) {
      minCanFulfill = canMake;
      limitingComponent = sku;
    }
  }
  
  return {
    canFulfill: minCanFulfill === Infinity ? 0 : minCanFulfill,
    limitingComponent,
    componentAvailability,
  };
}

/**
 * Simulate inventory deduction for a bundle sale
 */
export function simulateBundleDeduction(
  bundleSku: string,
  quantity: number,
  inventoryMap: Map<string, number>
): {
  success: boolean;
  deductions: { sku: string; quantity: number }[];
  errors: string[];
} {
  const componentSkus = getBundleComponents(bundleSku);
  const deductions: { sku: string; quantity: number }[] = [];
  const errors: string[] = [];
  
  // Check if all components are available
  for (const sku of componentSkus) {
    const available = inventoryMap.get(sku) || 0;
    if (available < quantity) {
      errors.push(`Insufficient ${getProductName(sku)}: need ${quantity}, have ${available}`);
    } else {
      deductions.push({ sku, quantity });
    }
  }
  
  return {
    success: errors.length === 0,
    deductions,
    errors,
  };
}

/**
 * Order Processor Service object
 */
export const orderProcessor = {
  processOrderLineItems,
  processOrders,
  aggregateSalesBySKU,
  aggregateSalesByBundle,
  calculateComponentVelocity,
  calculateBundleFulfillment,
  simulateBundleDeduction,
};

export default orderProcessor;
