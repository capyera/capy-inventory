/**
 * Product Registry Service
 * 
 * Stores master data for all SKUs:
 * - Image (base64)
 * - COGS (cost of goods)
 * - Weight (grams)
 * - Dimensions (L x W x H cm)
 * - Category, name, etc.
 */

// Storage key for localStorage persistence
const STORAGE_KEY = 'capy-product-registry';

/**
 * Product master data record
 */
export interface ProductMasterData {
  sku: string;
  name: string;
  category: 'plushie' | 'charm' | 'jumbo' | 'clothing' | 'accessory' | 'bundle' | 'other';
  imageBase64?: string;
  imageMimeType?: string;
  cogs: number; // Cost of goods sold
  weight: number; // Weight in grams
  dimensions: {
    length: number; // cm
    width: number;  // cm
    height: number; // cm
  };
  retailPrice?: number;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * CSV import row format
 */
export interface ProductCSVRow {
  sku: string;
  name: string;
  category?: string;
  cogs?: string | number;
  weight?: string | number;
  length?: string | number;
  width?: string | number;
  height?: string | number;
  retailPrice?: string | number;
  notes?: string;
}

/**
 * Default product data for known Capy-Era SKUs
 */
const DEFAULT_PRODUCTS: Partial<ProductMasterData>[] = [
  // 10" Plushies
  { sku: 'OG-M-001', name: 'Orange Capybara 10"', category: 'plushie', cogs: 8.25, weight: 180, dimensions: { length: 25, width: 20, height: 15 } },
  { sku: 'OG-M-002', name: 'Strawberry Capybara 10"', category: 'plushie', cogs: 8.25, weight: 180, dimensions: { length: 25, width: 20, height: 15 } },
  { sku: 'OG-M-003', name: 'Watermelon Capybara 10"', category: 'plushie', cogs: 8.25, weight: 180, dimensions: { length: 25, width: 20, height: 15 } },
  { sku: 'OG-M-004', name: 'Sakura Capybara 10"', category: 'plushie', cogs: 8.25, weight: 180, dimensions: { length: 25, width: 20, height: 15 } },
  { sku: 'OG-M-005', name: 'Violet Capybara 10"', category: 'plushie', cogs: 8.25, weight: 180, dimensions: { length: 25, width: 20, height: 15 } },
  { sku: 'OG-M-006', name: 'Lily Capybara 10"', category: 'plushie', cogs: 8.25, weight: 180, dimensions: { length: 25, width: 20, height: 15 } },
  { sku: 'OG-M-007', name: 'Matcha Capybara 10"', category: 'plushie', cogs: 8.25, weight: 180, dimensions: { length: 25, width: 20, height: 15 } },
  { sku: 'OG-M-008', name: 'Blueberry Capybara 10"', category: 'plushie', cogs: 8.25, weight: 180, dimensions: { length: 25, width: 20, height: 15 } },
  { sku: 'OG-M-009', name: 'Cherry Capybara 10"', category: 'plushie', cogs: 8.25, weight: 180, dimensions: { length: 25, width: 20, height: 15 } },
  { sku: 'OG-M-010', name: 'Avocado Capybara 10"', category: 'plushie', cogs: 8.25, weight: 180, dimensions: { length: 25, width: 20, height: 15 } },
  { sku: 'OG-M-011', name: 'Croissant Capybara 10"', category: 'plushie', cogs: 8.25, weight: 180, dimensions: { length: 25, width: 20, height: 15 } },
  { sku: 'OG-M-012', name: 'Coffee Capybara 10"', category: 'plushie', cogs: 8.25, weight: 180, dimensions: { length: 25, width: 20, height: 15 } },
  // Jumbo Plushies
  { sku: 'OG-L-001', name: 'Orange Capybara Jumbo', category: 'jumbo', cogs: 15.50, weight: 450, dimensions: { length: 40, width: 35, height: 25 } },
  { sku: 'OG-L-002', name: 'Strawberry Capybara Jumbo', category: 'jumbo', cogs: 15.50, weight: 450, dimensions: { length: 40, width: 35, height: 25 } },
  { sku: 'OG-L-003', name: 'Watermelon Capybara Jumbo', category: 'jumbo', cogs: 15.50, weight: 450, dimensions: { length: 40, width: 35, height: 25 } },
  { sku: 'OG-L-004', name: 'Sakura Capybara Jumbo', category: 'jumbo', cogs: 15.50, weight: 450, dimensions: { length: 40, width: 35, height: 25 } },
  { sku: 'OG-L-005', name: 'Violet Capybara Jumbo', category: 'jumbo', cogs: 15.50, weight: 450, dimensions: { length: 40, width: 35, height: 25 } },
  { sku: 'OG-L-006', name: 'Lily Capybara Jumbo', category: 'jumbo', cogs: 15.50, weight: 450, dimensions: { length: 40, width: 35, height: 25 } },
  { sku: 'OG-L-007', name: 'Matcha Capybara Jumbo', category: 'jumbo', cogs: 15.50, weight: 450, dimensions: { length: 40, width: 35, height: 25 } },
  { sku: 'OG-L-008', name: 'Blueberry Capybara Jumbo', category: 'jumbo', cogs: 15.50, weight: 450, dimensions: { length: 40, width: 35, height: 25 } },
  { sku: 'OG-L-009', name: 'Cherry Capybara Jumbo', category: 'jumbo', cogs: 15.50, weight: 450, dimensions: { length: 40, width: 35, height: 25 } },
  { sku: 'OG-L-010', name: 'Avocado Capybara Jumbo', category: 'jumbo', cogs: 15.50, weight: 450, dimensions: { length: 40, width: 35, height: 25 } },
  { sku: 'OG-L-011', name: 'Croissant Capybara Jumbo', category: 'jumbo', cogs: 15.50, weight: 450, dimensions: { length: 40, width: 35, height: 25 } },
  { sku: 'OG-L-012', name: 'Coffee Capybara Jumbo', category: 'jumbo', cogs: 15.50, weight: 450, dimensions: { length: 40, width: 35, height: 25 } },
  // Bag Charms
  { sku: 'OG-KEY-001', name: 'Orange Bag Charm', category: 'charm', cogs: 4.50, weight: 35, dimensions: { length: 8, width: 6, height: 4 } },
  { sku: 'OG-KEY-002', name: 'Strawberry Bag Charm', category: 'charm', cogs: 4.50, weight: 35, dimensions: { length: 8, width: 6, height: 4 } },
  { sku: 'OG-KEY-003', name: 'Watermelon Bag Charm', category: 'charm', cogs: 4.50, weight: 35, dimensions: { length: 8, width: 6, height: 4 } },
  { sku: 'OG-KEY-004', name: 'Sakura Bag Charm', category: 'charm', cogs: 4.50, weight: 35, dimensions: { length: 8, width: 6, height: 4 } },
  { sku: 'OG-KEY-005', name: 'Violet Bag Charm', category: 'charm', cogs: 4.50, weight: 35, dimensions: { length: 8, width: 6, height: 4 } },
  { sku: 'OG-KEY-006', name: 'Lily Bag Charm', category: 'charm', cogs: 4.50, weight: 35, dimensions: { length: 8, width: 6, height: 4 } },
  { sku: 'OG-KEY-007', name: 'Matcha Bag Charm', category: 'charm', cogs: 4.50, weight: 35, dimensions: { length: 8, width: 6, height: 4 } },
  { sku: 'OG-KEY-008', name: 'Blueberry Bag Charm', category: 'charm', cogs: 4.50, weight: 35, dimensions: { length: 8, width: 6, height: 4 } },
  { sku: 'OG-KEY-009', name: 'Cherry Bag Charm', category: 'charm', cogs: 4.50, weight: 35, dimensions: { length: 8, width: 6, height: 4 } },
  { sku: 'OG-KEY-010', name: 'Avocado Bag Charm', category: 'charm', cogs: 4.50, weight: 35, dimensions: { length: 8, width: 6, height: 4 } },
  { sku: 'OG-KEY-011', name: 'Croissant Bag Charm', category: 'charm', cogs: 4.50, weight: 35, dimensions: { length: 8, width: 6, height: 4 } },
  { sku: 'OG-KEY-012', name: 'Coffee Bag Charm', category: 'charm', cogs: 4.50, weight: 35, dimensions: { length: 8, width: 6, height: 4 } },
  // Limited Edition
  { sku: 'LE-M-006', name: 'Secret Crush Valentine', category: 'plushie', cogs: 9.50, weight: 180, dimensions: { length: 25, width: 20, height: 15 } },
  { sku: 'LE-M-007', name: 'Rose Valentine', category: 'plushie', cogs: 9.50, weight: 180, dimensions: { length: 25, width: 20, height: 15 } },
  { sku: 'LE-M-008', name: 'White Choco Valentine', category: 'plushie', cogs: 9.50, weight: 180, dimensions: { length: 25, width: 20, height: 15 } },
];

/**
 * Load products from localStorage
 */
function loadProducts(): Map<string, ProductMasterData> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data: ProductMasterData[] = JSON.parse(stored);
      return new Map(data.map(p => [p.sku, p]));
    }
  } catch (error) {
    console.error('Failed to load product registry:', error);
  }
  return new Map();
}

/**
 * Save products to localStorage
 */
function saveProducts(products: Map<string, ProductMasterData>): void {
  try {
    const data = Array.from(products.values());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save product registry:', error);
  }
}

// In-memory cache
let productsCache: Map<string, ProductMasterData> | null = null;

/**
 * Get all products (with defaults merged)
 */
function getProductsMap(): Map<string, ProductMasterData> {
  if (!productsCache) {
    productsCache = loadProducts();
    
    // Merge defaults for any SKUs not in storage
    for (const defaultProduct of DEFAULT_PRODUCTS) {
      if (!productsCache.has(defaultProduct.sku!)) {
        const now = new Date().toISOString();
        productsCache.set(defaultProduct.sku!, {
          sku: defaultProduct.sku!,
          name: defaultProduct.name!,
          category: defaultProduct.category as ProductMasterData['category'],
          cogs: defaultProduct.cogs || 0,
          weight: defaultProduct.weight || 0,
          dimensions: defaultProduct.dimensions || { length: 0, width: 0, height: 0 },
          isActive: true,
          createdAt: now,
          updatedAt: now,
        });
      }
    }
  }
  return productsCache;
}

/**
 * Parse category from string
 */
function parseCategory(cat?: string): ProductMasterData['category'] {
  if (!cat) return 'other';
  const lower = cat.toLowerCase();
  if (lower.includes('charm') || lower.includes('key')) return 'charm';
  if (lower.includes('jumbo') || lower === 'l' || lower === 'large') return 'jumbo';
  if (lower.includes('plush') || lower === 'm' || lower === 'medium' || lower === '10') return 'plushie';
  if (lower.includes('cloth') || lower.includes('shirt') || lower.includes('hoodie')) return 'clothing';
  if (lower.includes('bundle')) return 'bundle';
  if (lower.includes('access')) return 'accessory';
  return 'other';
}

/**
 * Infer category from SKU
 */
function inferCategoryFromSKU(sku: string): ProductMasterData['category'] {
  if (sku.includes('KEY')) return 'charm';
  if (sku.includes('DUO') || sku.includes('FAMILY')) return 'bundle';
  if (sku.includes('-L-')) return 'jumbo';
  if (sku.includes('-M-')) return 'plushie';
  return 'other';
}

/**
 * Product Registry Service
 */
export const productRegistry = {
  /**
   * Get all products
   */
  getAll(): ProductMasterData[] {
    return Array.from(getProductsMap().values());
  },

  /**
   * Get product by SKU
   */
  getBySku(sku: string): ProductMasterData | null {
    return getProductsMap().get(sku) || null;
  },

  /**
   * Create or update a product
   */
  upsert(product: Partial<ProductMasterData> & { sku: string }): ProductMasterData {
    const products = getProductsMap();
    const existing = products.get(product.sku);
    const now = new Date().toISOString();
    
    const updated: ProductMasterData = {
      sku: product.sku,
      name: product.name || existing?.name || product.sku,
      category: product.category || existing?.category || inferCategoryFromSKU(product.sku),
      imageBase64: product.imageBase64 ?? existing?.imageBase64,
      imageMimeType: product.imageMimeType ?? existing?.imageMimeType,
      cogs: product.cogs ?? existing?.cogs ?? 0,
      weight: product.weight ?? existing?.weight ?? 0,
      dimensions: product.dimensions || existing?.dimensions || { length: 0, width: 0, height: 0 },
      retailPrice: product.retailPrice ?? existing?.retailPrice,
      isActive: product.isActive ?? existing?.isActive ?? true,
      notes: product.notes ?? existing?.notes,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };
    
    products.set(product.sku, updated);
    saveProducts(products);
    return updated;
  },

  /**
   * Update product image
   */
  updateImage(sku: string, imageBase64: string, mimeType: string): ProductMasterData | null {
    const product = this.getBySku(sku);
    if (!product) return null;
    
    return this.upsert({
      sku,
      imageBase64,
      imageMimeType: mimeType,
    });
  },

  /**
   * Delete a product
   */
  delete(sku: string): boolean {
    const products = getProductsMap();
    if (products.has(sku)) {
      products.delete(sku);
      saveProducts(products);
      return true;
    }
    return false;
  },

  /**
   * Get product image URL (data URL)
   */
  getImageUrl(sku: string): string | null {
    const product = this.getBySku(sku);
    if (product?.imageBase64 && product?.imageMimeType) {
      return `data:${product.imageMimeType};base64,${product.imageBase64}`;
    }
    return null;
  },

  /**
   * Import from CSV data
   */
  importFromCSV(rows: ProductCSVRow[]): { imported: number; errors: string[] } {
    const errors: string[] = [];
    let imported = 0;
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // 1-indexed, skip header
      
      if (!row.sku) {
        errors.push(`Row ${rowNum}: Missing SKU`);
        continue;
      }
      
      try {
        this.upsert({
          sku: row.sku.trim().toUpperCase(),
          name: row.name?.trim() || row.sku.trim(),
          category: parseCategory(row.category),
          cogs: typeof row.cogs === 'number' ? row.cogs : parseFloat(String(row.cogs || '0')) || 0,
          weight: typeof row.weight === 'number' ? row.weight : parseFloat(String(row.weight || '0')) || 0,
          dimensions: {
            length: typeof row.length === 'number' ? row.length : parseFloat(String(row.length || '0')) || 0,
            width: typeof row.width === 'number' ? row.width : parseFloat(String(row.width || '0')) || 0,
            height: typeof row.height === 'number' ? row.height : parseFloat(String(row.height || '0')) || 0,
          },
          retailPrice: row.retailPrice 
            ? (typeof row.retailPrice === 'number' ? row.retailPrice : parseFloat(String(row.retailPrice)) || undefined)
            : undefined,
          notes: row.notes?.trim(),
        });
        imported++;
      } catch (error) {
        errors.push(`Row ${rowNum}: ${error}`);
      }
    }
    
    return { imported, errors };
  },

  /**
   * Match image filename to SKU
   */
  matchImageToSKU(filename: string): string | null {
    // Remove extension and clean up
    const baseName = filename.replace(/\.[^.]+$/, '').trim().toUpperCase();
    
    // Direct match
    if (this.getBySku(baseName)) {
      return baseName;
    }
    
    // Try common patterns
    const patterns = [
      baseName,
      baseName.replace(/[_\s-]+/g, '-'),
      baseName.replace(/[_\s]+/g, '-'),
    ];
    
    for (const pattern of patterns) {
      if (this.getBySku(pattern)) {
        return pattern;
      }
    }
    
    // Fuzzy match - check if any SKU contains or is contained by the filename
    const allProducts = this.getAll();
    for (const product of allProducts) {
      if (baseName.includes(product.sku) || product.sku.includes(baseName)) {
        return product.sku;
      }
    }
    
    return null;
  },

  /**
   * Bulk import images
   */
  async importImages(files: File[]): Promise<{ 
    matched: { filename: string; sku: string }[];
    unmatched: string[];
  }> {
    const matched: { filename: string; sku: string }[] = [];
    const unmatched: string[] = [];
    
    for (const file of files) {
      const sku = this.matchImageToSKU(file.name);
      if (sku) {
        matched.push({ filename: file.name, sku });
      } else {
        unmatched.push(file.name);
      }
    }
    
    return { matched, unmatched };
  },

  /**
   * Apply matched images
   */
  async applyImages(files: File[], matches: { filename: string; sku: string }[]): Promise<number> {
    let applied = 0;
    
    for (const match of matches) {
      const file = files.find(f => f.name === match.filename);
      if (!file) continue;
      
      try {
        const base64 = await fileToBase64(file);
        this.updateImage(match.sku, base64, file.type);
        applied++;
      } catch (error) {
        console.error(`Failed to apply image ${match.filename}:`, error);
      }
    }
    
    return applied;
  },

  /**
   * Export all products as CSV
   */
  exportCSV(): string {
    const products = this.getAll();
    const headers = ['sku', 'name', 'category', 'cogs', 'weight', 'length', 'width', 'height', 'retailPrice', 'notes'];
    
    const rows = products.map(p => [
      p.sku,
      p.name,
      p.category,
      p.cogs,
      p.weight,
      p.dimensions.length,
      p.dimensions.width,
      p.dimensions.height,
      p.retailPrice || '',
      p.notes || '',
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
    
    return [headers.join(','), ...rows].join('\n');
  },

  /**
   * Clear cache (force reload from storage)
   */
  clearCache(): void {
    productsCache = null;
  },
};

/**
 * Convert file to base64
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix to get just the base64
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Parse CSV string to rows
 */
export function parseCSV(csvString: string): ProductCSVRow[] {
  const lines = csvString.trim().split('\n');
  if (lines.length < 2) return [];
  
  // Parse header
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine).map(h => h.toLowerCase().trim());
  
  // Map column indices
  const colMap: Record<string, number> = {};
  headers.forEach((h, i) => {
    // Normalize header names
    if (h === 'sku' || h === 'product_sku' || h === 'item_sku') colMap['sku'] = i;
    else if (h === 'name' || h === 'product_name' || h === 'title') colMap['name'] = i;
    else if (h === 'category' || h === 'type' || h === 'product_type') colMap['category'] = i;
    else if (h === 'cogs' || h === 'cost' || h === 'unit_cost') colMap['cogs'] = i;
    else if (h === 'weight' || h === 'weight_g' || h === 'weight_grams') colMap['weight'] = i;
    else if (h === 'length' || h === 'l' || h === 'dim_l') colMap['length'] = i;
    else if (h === 'width' || h === 'w' || h === 'dim_w') colMap['width'] = i;
    else if (h === 'height' || h === 'h' || h === 'dim_h') colMap['height'] = i;
    else if (h === 'price' || h === 'retail_price' || h === 'retail' || h === 'retailprice') colMap['retailPrice'] = i;
    else if (h === 'notes' || h === 'note' || h === 'description') colMap['notes'] = i;
  });
  
  // Parse data rows
  const rows: ProductCSVRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0 || !values[colMap['sku'] ?? 0]) continue;
    
    rows.push({
      sku: values[colMap['sku'] ?? 0] || '',
      name: values[colMap['name'] ?? 1] || '',
      category: values[colMap['category']] || undefined,
      cogs: values[colMap['cogs']] || undefined,
      weight: values[colMap['weight']] || undefined,
      length: values[colMap['length']] || undefined,
      width: values[colMap['width']] || undefined,
      height: values[colMap['height']] || undefined,
      retailPrice: values[colMap['retailPrice']] || undefined,
      notes: values[colMap['notes']] || undefined,
    });
  }
  
  return rows;
}

/**
 * Parse a single CSV line handling quotes
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  values.push(current.trim());
  return values;
}

export default productRegistry;
