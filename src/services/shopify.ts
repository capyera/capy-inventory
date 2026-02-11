/**
 * Shopify API Integration Service
 * 
 * Connects to Shopify Admin API for:
 * - Products/Variants
 * - Orders (for velocity calculations)
 * - Inventory levels
 * - Customer data
 * 
 * Note: Uses a proxy to handle CORS since Shopify Admin API
 * requires server-side authentication.
 */

// Configuration
// const SHOPIFY_STORE = '152919-65.myshopify.com';
// const API_VERSION = '2024-01';

// Proxy URL - can be Cloudflare Worker, Vercel Function, etc.
// For local dev, can use Vite proxy
const PROXY_BASE = import.meta.env.VITE_SHOPIFY_PROXY_URL || '/api/shopify';

// Types
export interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  status: 'active' | 'archived' | 'draft';
  vendor: string;
  product_type: string;
  created_at: string;
  updated_at: string;
  tags: string;
  variants: ShopifyVariant[];
  images: ShopifyImage[];
}

export interface ShopifyVariant {
  id: number;
  product_id: number;
  title: string;
  sku: string;
  price: string;
  compare_at_price: string | null;
  inventory_item_id: number;
  inventory_quantity: number;
  inventory_management: string | null;
  weight: number;
  weight_unit: string;
  requires_shipping: boolean;
}

export interface ShopifyImage {
  id: number;
  product_id: number;
  src: string;
  alt: string | null;
}

export interface ShopifyOrder {
  id: number;
  order_number: number;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  cancelled_at: string | null;
  financial_status: 'pending' | 'paid' | 'refunded' | 'partially_refunded';
  fulfillment_status: 'fulfilled' | 'partial' | null;
  total_price: string;
  subtotal_price: string;
  total_tax: string;
  total_discounts: string;
  total_shipping_price_set: { shop_money: { amount: string } };
  currency: string;
  customer: ShopifyCustomer | null;
  line_items: ShopifyLineItem[];
  shipping_address: ShopifyAddress | null;
  tags: string;
}

export interface ShopifyLineItem {
  id: number;
  variant_id: number;
  product_id: number;
  title: string;
  variant_title: string;
  sku: string;
  quantity: number;
  price: string;
  total_discount: string;
  fulfillment_status: string | null;
}

export interface ShopifyCustomer {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  orders_count: number;
  total_spent: string;
  created_at: string;
  tags: string;
}

export interface ShopifyAddress {
  city: string;
  province: string;
  country: string;
  country_code: string;
  zip: string;
}

export interface ShopifyInventoryLevel {
  inventory_item_id: number;
  location_id: number;
  available: number | null;
  updated_at: string;
}

export interface ShopifyLocation {
  id: number;
  name: string;
  address1: string;
  city: string;
  country: string;
  active: boolean;
  legacy: boolean;
}

// Aggregated types for our app
export interface SKUInventoryData {
  sku: string;
  productId: number;
  variantId: number;
  productTitle: string;
  variantTitle: string;
  price: number;
  compareAtPrice: number | null;
  inventoryItemId: number;
  shopifyQuantity: number;
  imageUrl?: string;
  productType: string;
  tags: string[];
}

export interface SKUVelocityData {
  sku: string;
  unitsSold7d: number;
  unitsSold14d: number;
  unitsSold30d: number;
  revenue7d: number;
  revenue14d: number;
  revenue30d: number;
  velocity7d: number;
  velocity14d: number;
  velocity30d: number;
  orderCount: number;
}

export interface OrderSummary {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  newCustomerOrders: number;
  returningCustomerOrders: number;
  topSellingSkus: { sku: string; units: number; revenue: number }[];
}

// API helper
async function shopifyFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${PROXY_BASE}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Shopify API error: ${response.status} - ${error}`);
  }
  
  return response.json();
}

// Pagination helper (for future use with large catalogs)
// async function fetchAllPages<T>(
//   endpoint: string,
//   dataKey: string,
//   limit: number = 250
// ): Promise<T[]> {
//   const allItems: T[] = [];
//   let pageInfo: string | null = null;
//   
//   do {
//     const url = pageInfo 
//       ? `${endpoint}?limit=${limit}&page_info=${pageInfo}`
//       : `${endpoint}?limit=${limit}`;
//     
//     const response = await fetch(`${PROXY_BASE}${url}`, {
//       headers: { 'Content-Type': 'application/json' },
//     });
//     
//     if (!response.ok) break;
//     
//     const data = await response.json();
//     allItems.push(...(data[dataKey] || []));
//     
//     // Get next page from Link header
//     const linkHeader = response.headers.get('Link');
//     if (linkHeader?.includes('rel="next"')) {
//       const match = linkHeader.match(/page_info=([^>&]*)/);
//       pageInfo = match ? match[1] : null;
//     } else {
//       pageInfo = null;
//     }
//   } while (pageInfo);
//   
//   return allItems;
// }

/**
 * Shopify API Service
 */
export const shopifyApi = {
  /**
   * Fetch all products with variants
   */
  async getProducts(): Promise<ShopifyProduct[]> {
    try {
      const data = await shopifyFetch<{ products: ShopifyProduct[] }>(
        '/products.json?limit=250&status=active'
      );
      return data.products || [];
    } catch (error) {
      console.error('Failed to fetch products:', error);
      return [];
    }
  },

  /**
   * Fetch a single product by ID
   */
  async getProduct(productId: number): Promise<ShopifyProduct | null> {
    try {
      const data = await shopifyFetch<{ product: ShopifyProduct }>(
        `/products/${productId}.json`
      );
      return data.product;
    } catch (error) {
      console.error(`Failed to fetch product ${productId}:`, error);
      return null;
    }
  },

  /**
   * Fetch orders within a date range
   */
  async getOrders(params: {
    createdAtMin?: string;
    createdAtMax?: string;
    status?: 'any' | 'open' | 'closed' | 'cancelled';
    limit?: number;
  } = {}): Promise<ShopifyOrder[]> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('limit', String(params.limit || 250));
      queryParams.append('status', params.status || 'any');
      if (params.createdAtMin) queryParams.append('created_at_min', params.createdAtMin);
      if (params.createdAtMax) queryParams.append('created_at_max', params.createdAtMax);
      
      const data = await shopifyFetch<{ orders: ShopifyOrder[] }>(
        `/orders.json?${queryParams.toString()}`
      );
      return data.orders || [];
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      return [];
    }
  },

  /**
   * Fetch orders from the last N days
   */
  async getRecentOrders(days: number = 30): Promise<ShopifyOrder[]> {
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    
    return this.getOrders({
      createdAtMin: startDate.toISOString(),
      status: 'any',
    });
  },

  /**
   * Fetch inventory levels for all locations
   */
  async getInventoryLevels(inventoryItemIds: number[]): Promise<ShopifyInventoryLevel[]> {
    try {
      // Shopify limits to 50 IDs per request
      const chunks = [];
      for (let i = 0; i < inventoryItemIds.length; i += 50) {
        chunks.push(inventoryItemIds.slice(i, i + 50));
      }
      
      const allLevels: ShopifyInventoryLevel[] = [];
      for (const chunk of chunks) {
        const data = await shopifyFetch<{ inventory_levels: ShopifyInventoryLevel[] }>(
          `/inventory_levels.json?inventory_item_ids=${chunk.join(',')}`
        );
        allLevels.push(...(data.inventory_levels || []));
      }
      
      return allLevels;
    } catch (error) {
      console.error('Failed to fetch inventory levels:', error);
      return [];
    }
  },

  /**
   * Fetch all locations (warehouses)
   */
  async getLocations(): Promise<ShopifyLocation[]> {
    try {
      const data = await shopifyFetch<{ locations: ShopifyLocation[] }>(
        '/locations.json'
      );
      return data.locations || [];
    } catch (error) {
      console.error('Failed to fetch locations:', error);
      return [];
    }
  },

  /**
   * Get product count
   */
  async getProductCount(): Promise<number> {
    try {
      const data = await shopifyFetch<{ count: number }>('/products/count.json');
      return data.count || 0;
    } catch (error) {
      console.error('Failed to fetch product count:', error);
      return 0;
    }
  },

  /**
   * Get order count for a period
   */
  async getOrderCount(createdAtMin?: string): Promise<number> {
    try {
      const url = createdAtMin 
        ? `/orders/count.json?created_at_min=${createdAtMin}&status=any`
        : '/orders/count.json?status=any';
      const data = await shopifyFetch<{ count: number }>(url);
      return data.count || 0;
    } catch (error) {
      console.error('Failed to fetch order count:', error);
      return 0;
    }
  },
};

/**
 * Data transformation utilities
 */
export const shopifyTransform = {
  /**
   * Transform products to SKU inventory data
   */
  productsToSKUData(products: ShopifyProduct[]): SKUInventoryData[] {
    const skuData: SKUInventoryData[] = [];
    
    for (const product of products) {
      const mainImage = product.images[0]?.src;
      const tags = product.tags.split(',').map(t => t.trim()).filter(Boolean);
      
      for (const variant of product.variants) {
        if (variant.sku) {
          skuData.push({
            sku: variant.sku,
            productId: product.id,
            variantId: variant.id,
            productTitle: product.title,
            variantTitle: variant.title,
            price: parseFloat(variant.price),
            compareAtPrice: variant.compare_at_price ? parseFloat(variant.compare_at_price) : null,
            inventoryItemId: variant.inventory_item_id,
            shopifyQuantity: variant.inventory_quantity,
            imageUrl: mainImage,
            productType: product.product_type,
            tags,
          });
        }
      }
    }
    
    return skuData;
  },

  /**
   * Calculate velocity data from orders
   */
  ordersToVelocityData(orders: ShopifyOrder[]): Map<string, SKUVelocityData> {
    const now = new Date();
    const day7ago = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const day14ago = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const day30ago = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const velocityMap = new Map<string, SKUVelocityData>();
    
    for (const order of orders) {
      // Skip cancelled/refunded orders
      if (order.cancelled_at || order.financial_status === 'refunded') continue;
      
      const orderDate = new Date(order.created_at);
      
      for (const item of order.line_items) {
        if (!item.sku) continue;
        
        let data = velocityMap.get(item.sku);
        if (!data) {
          data = {
            sku: item.sku,
            unitsSold7d: 0,
            unitsSold14d: 0,
            unitsSold30d: 0,
            revenue7d: 0,
            revenue14d: 0,
            revenue30d: 0,
            velocity7d: 0,
            velocity14d: 0,
            velocity30d: 0,
            orderCount: 0,
          };
          velocityMap.set(item.sku, data);
        }
        
        const itemRevenue = parseFloat(item.price) * item.quantity;
        
        // Count for all periods
        if (orderDate >= day30ago) {
          data.unitsSold30d += item.quantity;
          data.revenue30d += itemRevenue;
        }
        if (orderDate >= day14ago) {
          data.unitsSold14d += item.quantity;
          data.revenue14d += itemRevenue;
        }
        if (orderDate >= day7ago) {
          data.unitsSold7d += item.quantity;
          data.revenue7d += itemRevenue;
        }
        
        data.orderCount++;
      }
    }
    
    // Calculate daily velocity
    for (const data of velocityMap.values()) {
      data.velocity7d = Math.round((data.unitsSold7d / 7) * 10) / 10;
      data.velocity14d = Math.round((data.unitsSold14d / 14) * 10) / 10;
      data.velocity30d = Math.round((data.unitsSold30d / 30) * 10) / 10;
    }
    
    return velocityMap;
  },

  /**
   * Calculate order summary
   */
  ordersToSummary(orders: ShopifyOrder[]): OrderSummary {
    let totalRevenue = 0;
    let newCustomerOrders = 0;
    let returningCustomerOrders = 0;
    const skuSales = new Map<string, { units: number; revenue: number }>();
    
    for (const order of orders) {
      if (order.cancelled_at || order.financial_status === 'refunded') continue;
      
      totalRevenue += parseFloat(order.total_price);
      
      // New vs returning (if customer exists and has orders_count > 1, returning)
      if (order.customer) {
        if (order.customer.orders_count > 1) {
          returningCustomerOrders++;
        } else {
          newCustomerOrders++;
        }
      } else {
        newCustomerOrders++;
      }
      
      // SKU aggregation
      for (const item of order.line_items) {
        if (!item.sku) continue;
        const current = skuSales.get(item.sku) || { units: 0, revenue: 0 };
        current.units += item.quantity;
        current.revenue += parseFloat(item.price) * item.quantity;
        skuSales.set(item.sku, current);
      }
    }
    
    // Top selling SKUs
    const topSellingSkus = Array.from(skuSales.entries())
      .map(([sku, data]) => ({ sku, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
    
    return {
      totalOrders: orders.filter(o => !o.cancelled_at).length,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      averageOrderValue: orders.length > 0 
        ? Math.round((totalRevenue / orders.length) * 100) / 100 
        : 0,
      newCustomerOrders,
      returningCustomerOrders,
      topSellingSkus,
    };
  },
};

/**
 * High-level data fetching with caching
 */
let productCache: { data: ShopifyProduct[]; timestamp: number } | null = null;
let orderCache: { data: ShopifyOrder[]; timestamp: number; days: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const shopifyData = {
  /**
   * Get all SKU inventory data (with caching)
   */
  async getSKUInventory(forceRefresh = false): Promise<SKUInventoryData[]> {
    if (!forceRefresh && productCache && Date.now() - productCache.timestamp < CACHE_TTL) {
      return shopifyTransform.productsToSKUData(productCache.data);
    }
    
    const products = await shopifyApi.getProducts();
    productCache = { data: products, timestamp: Date.now() };
    return shopifyTransform.productsToSKUData(products);
  },

  /**
   * Get velocity data for all SKUs (with caching)
   */
  async getSKUVelocity(days = 30, forceRefresh = false): Promise<Map<string, SKUVelocityData>> {
    if (!forceRefresh && orderCache && 
        Date.now() - orderCache.timestamp < CACHE_TTL &&
        orderCache.days >= days) {
      return shopifyTransform.ordersToVelocityData(orderCache.data);
    }
    
    const orders = await shopifyApi.getRecentOrders(days);
    orderCache = { data: orders, timestamp: Date.now(), days };
    return shopifyTransform.ordersToVelocityData(orders);
  },

  /**
   * Get order summary for dashboard
   */
  async getOrderSummary(days = 30): Promise<OrderSummary> {
    const orders = await shopifyApi.getRecentOrders(days);
    return shopifyTransform.ordersToSummary(orders);
  },

  /**
   * Get full inventory with velocity data combined
   */
  async getFullInventoryData(): Promise<Array<SKUInventoryData & Partial<SKUVelocityData>>> {
    const [inventory, velocityMap] = await Promise.all([
      this.getSKUInventory(),
      this.getSKUVelocity(30),
    ]);
    
    return inventory.map(item => ({
      ...item,
      ...(velocityMap.get(item.sku) || {}),
    }));
  },

  /**
   * Clear all caches
   */
  clearCache() {
    productCache = null;
    orderCache = null;
  },
};

export default shopifyApi;
