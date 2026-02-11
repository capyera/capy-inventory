/**
 * Supplier Registry - localStorage-based supplier management
 */

// Supplier categories
export const SUPPLIER_CATEGORIES = [
  'Plush Toys',
  'Apparels',
  'Accessories',
  'Bags',
  'Packaging',
  'Auxiliary Materials',
  '3PL',
  'Marketing',
  'Other',
] as const;

export type SupplierCategory = typeof SUPPLIER_CATEGORIES[number];

export interface SupplierData {
  id: string;
  code: string;
  name: string;
  category: string;
  email?: string;
  phone?: string;
  address?: string;
  skus?: string[]; // SKUs this supplier can produce
  paymentTerms?: string;
  notes?: string;
}

const STORAGE_KEY = 'capy-suppliers';

function generateId(): string {
  return `sup_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function loadSuppliers(): SupplierData[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load suppliers:', e);
  }
  return [];
}

function saveSuppliers(suppliers: SupplierData[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(suppliers));
}

export const supplierRegistry = {
  getAll(): SupplierData[] {
    return loadSuppliers();
  },

  getByCode(code: string): SupplierData | undefined {
    return loadSuppliers().find(s => s.code === code);
  },

  getById(id: string): SupplierData | undefined {
    return loadSuppliers().find(s => s.id === id);
  },

  /**
   * Get suppliers that produce a specific SKU
   */
  getBySku(sku: string): SupplierData[] {
    return loadSuppliers().filter(s => s.skus?.includes(sku));
  },

  create(data: Omit<SupplierData, 'id'>): SupplierData {
    const suppliers = loadSuppliers();
    const newSupplier: SupplierData = {
      ...data,
      id: generateId(),
    };
    suppliers.push(newSupplier);
    saveSuppliers(suppliers);
    return newSupplier;
  },

  update(id: string, data: Partial<Omit<SupplierData, 'id'>>): SupplierData | null {
    const suppliers = loadSuppliers();
    const index = suppliers.findIndex(s => s.id === id);
    if (index === -1) return null;
    
    suppliers[index] = { ...suppliers[index], ...data };
    saveSuppliers(suppliers);
    return suppliers[index];
  },

  delete(id: string): boolean {
    const suppliers = loadSuppliers();
    const filtered = suppliers.filter(s => s.id !== id);
    if (filtered.length === suppliers.length) return false;
    saveSuppliers(filtered);
    return true;
  },

  deleteAll(): void {
    saveSuppliers([]);
  },

  /**
   * Bulk import suppliers (upsert by code)
   */
  bulkImport(data: Array<{ code: string; name: string; category?: string }>): number {
    const suppliers = loadSuppliers();
    let imported = 0;

    for (const item of data) {
      const existing = suppliers.find(s => s.code === item.code);
      if (existing) {
        // Update
        existing.name = item.name;
        existing.category = item.category || existing.category;
      } else {
        // Create
        suppliers.push({
          id: generateId(),
          code: item.code,
          name: item.name,
          category: item.category || '',
        });
        imported++;
      }
    }

    saveSuppliers(suppliers);
    return imported;
  },

  exportJSON(): string {
    return JSON.stringify(loadSuppliers(), null, 2);
  },
};
