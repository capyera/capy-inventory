/**
 * Purchase Order Registry - localStorage-based PO management
 */

export interface POLineData {
  id: string;
  poNumber: string;
  supplierCode: string;
  supplierName: string;
  sku: string;
  productName?: string;
  qtyOrdered: number;
  qtyReceived: number;
  qtyRemaining: number;
  status: 'Pending' | 'Partial' | 'Complete' | 'Cancelled';
  expectedDate?: string;
  notes?: string;
  createdAt: number;
}

const STORAGE_KEY = 'capy-purchase-orders';

function generateId(): string {
  return `po_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function loadPOs(): POLineData[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load POs:', e);
  }
  return [];
}

function savePOs(pos: POLineData[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pos));
}

export const poRegistry = {
  getAll(): POLineData[] {
    return loadPOs();
  },

  getByPONumber(poNumber: string): POLineData[] {
    return loadPOs().filter(p => p.poNumber === poNumber);
  },

  getBySku(sku: string): POLineData[] {
    return loadPOs().filter(p => p.sku === sku);
  },

  getById(id: string): POLineData | undefined {
    return loadPOs().find(p => p.id === id);
  },

  /**
   * Get unique PO numbers with summary
   */
  getPOSummary(): Array<{
    poNumber: string;
    supplierCode: string;
    supplierName: string;
    totalSkus: number;
    totalOrdered: number;
    totalReceived: number;
    totalRemaining: number;
    status: string;
  }> {
    const pos = loadPOs();
    const grouped = new Map<string, POLineData[]>();
    
    for (const po of pos) {
      const existing = grouped.get(po.poNumber) || [];
      existing.push(po);
      grouped.set(po.poNumber, existing);
    }

    return Array.from(grouped.entries()).map(([poNumber, lines]) => {
      const totalOrdered = lines.reduce((sum, l) => sum + l.qtyOrdered, 0);
      const totalReceived = lines.reduce((sum, l) => sum + l.qtyReceived, 0);
      const totalRemaining = lines.reduce((sum, l) => sum + l.qtyRemaining, 0);
      
      let status = 'Pending';
      if (totalReceived >= totalOrdered) status = 'Complete';
      else if (totalReceived > 0) status = 'Partial';

      return {
        poNumber,
        supplierCode: lines[0].supplierCode,
        supplierName: lines[0].supplierName,
        totalSkus: lines.length,
        totalOrdered,
        totalReceived,
        totalRemaining,
        status,
      };
    });
  },

  /**
   * Get total inbound qty per SKU (pending POs)
   */
  getInboundBySku(): Map<string, number> {
    const pos = loadPOs();
    const inbound = new Map<string, number>();
    
    for (const po of pos) {
      if (po.status !== 'Complete' && po.status !== 'Cancelled') {
        const current = inbound.get(po.sku) || 0;
        inbound.set(po.sku, current + po.qtyRemaining);
      }
    }
    
    return inbound;
  },

  create(data: Omit<POLineData, 'id' | 'createdAt'>): POLineData {
    const pos = loadPOs();
    const newPO: POLineData = {
      ...data,
      id: generateId(),
      createdAt: Date.now(),
    };
    pos.push(newPO);
    savePOs(pos);
    return newPO;
  },

  update(id: string, data: Partial<Omit<POLineData, 'id' | 'createdAt'>>): POLineData | null {
    const pos = loadPOs();
    const index = pos.findIndex(p => p.id === id);
    if (index === -1) return null;
    
    pos[index] = { ...pos[index], ...data };
    savePOs(pos);
    return pos[index];
  },

  delete(id: string): boolean {
    const pos = loadPOs();
    const filtered = pos.filter(p => p.id !== id);
    if (filtered.length === pos.length) return false;
    savePOs(filtered);
    return true;
  },

  deletePO(poNumber: string): number {
    const pos = loadPOs();
    const filtered = pos.filter(p => p.poNumber !== poNumber);
    const deleted = pos.length - filtered.length;
    savePOs(filtered);
    return deleted;
  },

  deleteAll(): void {
    savePOs([]);
  },

  /**
   * Bulk import PO lines (upsert by poNumber + sku)
   */
  bulkImport(data: Array<{
    poNumber: string;
    supplierCode: string;
    supplierName: string;
    sku: string;
    qtyOrdered: number;
    qtyReceived: number;
    qtyRemaining: number;
    status: string;
  }>): number {
    const pos = loadPOs();
    let imported = 0;

    for (const item of data) {
      const existing = pos.find(p => p.poNumber === item.poNumber && p.sku === item.sku);
      if (existing) {
        // Update
        existing.qtyOrdered = item.qtyOrdered;
        existing.qtyReceived = item.qtyReceived;
        existing.qtyRemaining = item.qtyRemaining;
        existing.status = item.status as POLineData['status'];
      } else {
        // Create
        pos.push({
          id: generateId(),
          poNumber: item.poNumber,
          supplierCode: item.supplierCode,
          supplierName: item.supplierName,
          sku: item.sku,
          qtyOrdered: item.qtyOrdered,
          qtyReceived: item.qtyReceived,
          qtyRemaining: item.qtyRemaining,
          status: (item.status || 'Pending') as POLineData['status'],
          createdAt: Date.now(),
        });
        imported++;
      }
    }

    savePOs(pos);
    return imported;
  },

  exportJSON(): string {
    return JSON.stringify(loadPOs(), null, 2);
  },
};
