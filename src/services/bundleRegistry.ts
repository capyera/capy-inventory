/**
 * Bundle Registry Service
 * 
 * Stores bundle → component SKU mappings
 * Provides CRUD operations for bundle management
 * Pre-populated with Capy-Era bundles
 */

import type { Bundle, BundleComponent } from '../types';

// Storage key for localStorage persistence
const STORAGE_KEY = 'capy-bundle-registry';

// Pre-defined bundle mappings for Capy-Era products
export const DEFAULT_BUNDLE_MAPPINGS: Record<string, string[]> = {
  // DUO Bundles (10" + Charm)
  'OG-DUO-001': ['OG-M-001', 'OG-KEY-001'], // Orange
  'OG-DUO-002': ['OG-M-002', 'OG-KEY-002'], // Strawberry
  'OG-DUO-003': ['OG-M-003', 'OG-KEY-003'], // Watermelon
  'OG-DUO-004': ['OG-M-004', 'OG-KEY-004'], // Sakura
  'OG-DUO-005': ['OG-M-005', 'OG-KEY-005'], // Violet
  'OG-DUO-006': ['OG-M-006', 'OG-KEY-006'], // Lily
  'OG-DUO-007': ['OG-M-007', 'OG-KEY-007'], // Matcha
  'OG-DUO-008': ['OG-M-008', 'OG-KEY-008'], // Blueberry
  'OG-DUO-009': ['OG-M-009', 'OG-KEY-009'], // Cherry
  'OG-DUO-010': ['OG-M-010', 'OG-KEY-010'], // Avocado
  'OG-DUO-011': ['OG-M-011', 'OG-KEY-011'], // Croissant
  'OG-DUO-012': ['OG-M-012', 'OG-KEY-012'], // Coffee

  // FAMILY Bundles (Jumbo + 10" + Charm)
  'OG-FAMILY-001': ['OG-L-001', 'OG-M-001', 'OG-KEY-001'], // Orange
  'OG-FAMILY-002': ['OG-L-002', 'OG-M-002', 'OG-KEY-002'], // Strawberry
  'OG-FAMILY-003': ['OG-L-003', 'OG-M-003', 'OG-KEY-003'], // Watermelon
  'OG-FAMILY-004': ['OG-L-004', 'OG-M-004', 'OG-KEY-004'], // Sakura
  'OG-FAMILY-005': ['OG-L-005', 'OG-M-005', 'OG-KEY-005'], // Violet
  'OG-FAMILY-006': ['OG-L-006', 'OG-M-006', 'OG-KEY-006'], // Lily
  'OG-FAMILY-007': ['OG-L-007', 'OG-M-007', 'OG-KEY-007'], // Matcha
  'OG-FAMILY-008': ['OG-L-008', 'OG-M-008', 'OG-KEY-008'], // Blueberry
  'OG-FAMILY-009': ['OG-L-009', 'OG-M-009', 'OG-KEY-009'], // Cherry
  'OG-FAMILY-010': ['OG-L-010', 'OG-M-010', 'OG-KEY-010'], // Avocado
  'OG-FAMILY-011': ['OG-L-011', 'OG-M-011', 'OG-KEY-011'], // Croissant
  'OG-FAMILY-012': ['OG-L-012', 'OG-M-012', 'OG-KEY-012'], // Coffee
};

// Product name mappings for display
export const PRODUCT_NAMES: Record<string, string> = {
  // 10" Plushies
  'OG-M-001': 'Orange Capybara 10"',
  'OG-M-002': 'Strawberry Capybara 10"',
  'OG-M-003': 'Watermelon Capybara 10"',
  'OG-M-004': 'Sakura Capybara 10"',
  'OG-M-005': 'Violet Capybara 10"',
  'OG-M-006': 'Lily Capybara 10"',
  'OG-M-007': 'Matcha Capybara 10"',
  'OG-M-008': 'Blueberry Capybara 10"',
  'OG-M-009': 'Cherry Capybara 10"',
  'OG-M-010': 'Avocado Capybara 10"',
  'OG-M-011': 'Croissant Capybara 10"',
  'OG-M-012': 'Coffee Capybara 10"',
  // Jumbo Plushies
  'OG-L-001': 'Orange Capybara Jumbo',
  'OG-L-002': 'Strawberry Capybara Jumbo',
  'OG-L-003': 'Watermelon Capybara Jumbo',
  'OG-L-004': 'Sakura Capybara Jumbo',
  'OG-L-005': 'Violet Capybara Jumbo',
  'OG-L-006': 'Lily Capybara Jumbo',
  'OG-L-007': 'Matcha Capybara Jumbo',
  'OG-L-008': 'Blueberry Capybara Jumbo',
  'OG-L-009': 'Cherry Capybara Jumbo',
  'OG-L-010': 'Avocado Capybara Jumbo',
  'OG-L-011': 'Croissant Capybara Jumbo',
  'OG-L-012': 'Coffee Capybara Jumbo',
  // Bag Charms
  'OG-KEY-001': 'Orange Bag Charm',
  'OG-KEY-002': 'Strawberry Bag Charm',
  'OG-KEY-003': 'Watermelon Bag Charm',
  'OG-KEY-004': 'Sakura Bag Charm',
  'OG-KEY-005': 'Violet Bag Charm',
  'OG-KEY-006': 'Lily Bag Charm',
  'OG-KEY-007': 'Matcha Bag Charm',
  'OG-KEY-008': 'Blueberry Bag Charm',
  'OG-KEY-009': 'Cherry Bag Charm',
  'OG-KEY-010': 'Avocado Bag Charm',
  'OG-KEY-011': 'Croissant Bag Charm',
  'OG-KEY-012': 'Coffee Bag Charm',
};

// Bundle names
export const BUNDLE_NAMES: Record<string, string> = {
  'OG-DUO-001': 'Orange Duo Bundle',
  'OG-DUO-002': 'Strawberry Duo Bundle',
  'OG-DUO-003': 'Watermelon Duo Bundle',
  'OG-DUO-004': 'Sakura Duo Bundle',
  'OG-DUO-005': 'Violet Duo Bundle',
  'OG-DUO-006': 'Lily Duo Bundle',
  'OG-DUO-007': 'Matcha Duo Bundle',
  'OG-DUO-008': 'Blueberry Duo Bundle',
  'OG-DUO-009': 'Cherry Duo Bundle',
  'OG-DUO-010': 'Avocado Duo Bundle',
  'OG-DUO-011': 'Croissant Duo Bundle',
  'OG-DUO-012': 'Coffee Duo Bundle',
  'OG-FAMILY-001': 'Orange Family Bundle',
  'OG-FAMILY-002': 'Strawberry Family Bundle',
  'OG-FAMILY-003': 'Watermelon Family Bundle',
  'OG-FAMILY-004': 'Sakura Family Bundle',
  'OG-FAMILY-005': 'Violet Family Bundle',
  'OG-FAMILY-006': 'Lily Family Bundle',
  'OG-FAMILY-007': 'Matcha Family Bundle',
  'OG-FAMILY-008': 'Blueberry Family Bundle',
  'OG-FAMILY-009': 'Cherry Family Bundle',
  'OG-FAMILY-010': 'Avocado Family Bundle',
  'OG-FAMILY-011': 'Croissant Family Bundle',
  'OG-FAMILY-012': 'Coffee Family Bundle',
};

// Default prices
export const BUNDLE_PRICES: Record<string, number> = {
  'OG-DUO-001': 27.99,
  'OG-DUO-002': 27.99,
  'OG-DUO-003': 27.99,
  'OG-DUO-004': 27.99,
  'OG-DUO-005': 27.99,
  'OG-DUO-006': 27.99,
  'OG-DUO-007': 27.99,
  'OG-DUO-008': 27.99,
  'OG-DUO-009': 27.99,
  'OG-DUO-010': 27.99,
  'OG-DUO-011': 27.99,
  'OG-DUO-012': 27.99,
  'OG-FAMILY-001': 45.99,
  'OG-FAMILY-002': 45.99,
  'OG-FAMILY-003': 45.99,
  'OG-FAMILY-004': 45.99,
  'OG-FAMILY-005': 45.99,
  'OG-FAMILY-006': 45.99,
  'OG-FAMILY-007': 45.99,
  'OG-FAMILY-008': 45.99,
  'OG-FAMILY-009': 45.99,
  'OG-FAMILY-010': 45.99,
  'OG-FAMILY-011': 45.99,
  'OG-FAMILY-012': 45.99,
};

export interface BundleRegistryData {
  bundles: Bundle[];
  customMappings: Record<string, string[]>;
  lastUpdated: string;
}

/**
 * Get product name from SKU
 */
export function getProductName(sku: string): string {
  return PRODUCT_NAMES[sku] || sku;
}

/**
 * Check if a SKU is a bundle
 */
export function isBundle(sku: string): boolean {
  const allMappings = { ...DEFAULT_BUNDLE_MAPPINGS, ...getCustomMappings() };
  return sku in allMappings;
}

/**
 * Get component SKUs for a bundle
 */
export function getBundleComponents(bundleSku: string): string[] {
  const allMappings = { ...DEFAULT_BUNDLE_MAPPINGS, ...getCustomMappings() };
  return allMappings[bundleSku] || [];
}

/**
 * Get all bundle SKUs
 */
export function getAllBundleSkus(): string[] {
  const allMappings = { ...DEFAULT_BUNDLE_MAPPINGS, ...getCustomMappings() };
  return Object.keys(allMappings);
}

/**
 * Get custom mappings from localStorage
 */
function getCustomMappings(): Record<string, string[]> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data: BundleRegistryData = JSON.parse(stored);
      return data.customMappings || {};
    }
  } catch (error) {
    console.error('Failed to load bundle registry:', error);
  }
  return {};
}

/**
 * Save custom mappings to localStorage
 */
function saveCustomMappings(mappings: Record<string, string[]>): void {
  try {
    const data: BundleRegistryData = {
      bundles: [],
      customMappings: mappings,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save bundle registry:', error);
  }
}

/**
 * Bundle Registry Service
 */
export const bundleRegistry = {
  /**
   * Get all bundles as Bundle objects
   */
  getAll(): Bundle[] {
    const allMappings = { ...DEFAULT_BUNDLE_MAPPINGS, ...getCustomMappings() };
    
    return Object.entries(allMappings).map(([sku, componentSkus], index) => {
      const components: BundleComponent[] = componentSkus.map(cSku => ({
        sku: cSku,
        name: getProductName(cSku),
        quantity: 1,
      }));
      
      return {
        id: `bundle-${index}`,
        sku,
        name: BUNDLE_NAMES[sku] || `Bundle ${sku}`,
        components,
        price: BUNDLE_PRICES[sku] || 29.99,
        isActive: true,
      };
    });
  },

  /**
   * Get a bundle by SKU
   */
  getBySku(bundleSku: string): Bundle | null {
    const bundles = this.getAll();
    return bundles.find(b => b.sku === bundleSku) || null;
  },

  /**
   * Get a bundle by ID
   */
  getById(id: string): Bundle | null {
    const bundles = this.getAll();
    return bundles.find(b => b.id === id) || null;
  },

  /**
   * Add a new bundle
   */
  create(bundle: Omit<Bundle, 'id'>): Bundle {
    const customMappings = getCustomMappings();
    
    // Add to mappings
    customMappings[bundle.sku] = bundle.components.map(c => c.sku);
    saveCustomMappings(customMappings);
    
    // Update name and price registries (in memory for this session)
    BUNDLE_NAMES[bundle.sku] = bundle.name;
    BUNDLE_PRICES[bundle.sku] = bundle.price;
    
    return {
      id: `bundle-${Date.now()}`,
      ...bundle,
    };
  },

  /**
   * Update an existing bundle
   */
  update(bundleSku: string, updates: Partial<Bundle>): Bundle | null {
    const existing = this.getBySku(bundleSku);
    if (!existing) return null;
    
    const customMappings = getCustomMappings();
    
    // If components changed, update mappings
    if (updates.components) {
      customMappings[bundleSku] = updates.components.map(c => c.sku);
      saveCustomMappings(customMappings);
    }
    
    // Update names and prices
    if (updates.name) BUNDLE_NAMES[bundleSku] = updates.name;
    if (updates.price) BUNDLE_PRICES[bundleSku] = updates.price;
    
    return { ...existing, ...updates };
  },

  /**
   * Delete a bundle
   */
  delete(bundleSku: string): boolean {
    const customMappings = getCustomMappings();
    
    // Only allow deleting custom bundles, not default ones
    if (bundleSku in DEFAULT_BUNDLE_MAPPINGS) {
      console.warn('Cannot delete default bundle:', bundleSku);
      return false;
    }
    
    if (bundleSku in customMappings) {
      delete customMappings[bundleSku];
      saveCustomMappings(customMappings);
      return true;
    }
    
    return false;
  },

  /**
   * Check if a bundle is a custom (user-created) bundle
   */
  isCustomBundle(bundleSku: string): boolean {
    return !(bundleSku in DEFAULT_BUNDLE_MAPPINGS);
  },

  /**
   * Export all mappings (for backup/sync)
   */
  export(): Record<string, string[]> {
    return { ...DEFAULT_BUNDLE_MAPPINGS, ...getCustomMappings() };
  },

  /**
   * Import mappings (from backup/sync)
   */
  import(mappings: Record<string, string[]>): void {
    // Filter out default mappings, only save custom ones
    const customOnly: Record<string, string[]> = {};
    for (const [sku, components] of Object.entries(mappings)) {
      if (!(sku in DEFAULT_BUNDLE_MAPPINGS)) {
        customOnly[sku] = components;
      }
    }
    saveCustomMappings(customOnly);
  },

  /**
   * Clear all custom bundles
   */
  clearCustom(): void {
    saveCustomMappings({});
  },
};

export default bundleRegistry;
