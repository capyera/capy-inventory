/**
 * Inbound Registry - Track goods receiving and QC
 * 
 * One PO can have multiple inbounds (partial shipments)
 * Each inbound tracks: received qty, QC passed, defects
 */

export interface InboundRecord {
  id: string;
  poNumber: string;
  sku: string;
  productName?: string;
  supplierCode: string;
  supplierName: string;
  warehouseId: string; // For future multi-warehouse
  
  // Receiving
  dateReceived: string; // ISO date
  qtyReceived: number; // Physical count of what arrived
  
  // QC Results
  qtyGood: number; // Passed QC, goes to inventory
  qtyDefective: number;
  defectNotes?: string;
  qcStatus: 'pending' | 'in_progress' | 'complete';
  qcDate?: string;
  
  // Tracking
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface InboundUpdate {
  id: string;
  timestamp: number;
  field: string;
  oldValue: any;
  newValue: any;
  note?: string;
}

const STORAGE_KEY = 'capy-inbounds';
const HISTORY_KEY = 'capy-inbound-history';

function generateId(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `INB-${year}${month}-${random}`;
}

function loadInbounds(): InboundRecord[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.error('Failed to load inbounds:', e);
  }
  return [];
}

function saveInbounds(inbounds: InboundRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(inbounds));
}

function loadHistory(): InboundUpdate[] {
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.error('Failed to load inbound history:', e);
  }
  return [];
}

function saveHistory(history: InboundUpdate[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export const inboundRegistry = {
  getAll(): InboundRecord[] {
    return loadInbounds();
  },

  getById(id: string): InboundRecord | undefined {
    return loadInbounds().find(i => i.id === id);
  },

  getByPO(poNumber: string): InboundRecord[] {
    return loadInbounds().filter(i => i.poNumber === poNumber);
  },

  getBySku(sku: string): InboundRecord[] {
    return loadInbounds().filter(i => i.sku === sku);
  },

  getByWarehouse(warehouseId: string): InboundRecord[] {
    return loadInbounds().filter(i => i.warehouseId === warehouseId);
  },

  /**
   * Get total received qty per SKU from a PO
   */
  getTotalReceivedForPO(poNumber: string): Map<string, { received: number; good: number; defective: number }> {
    const inbounds = this.getByPO(poNumber);
    const totals = new Map<string, { received: number; good: number; defective: number }>();
    
    for (const inb of inbounds) {
      const current = totals.get(inb.sku) || { received: 0, good: 0, defective: 0 };
      current.received += inb.qtyReceived;
      current.good += inb.qtyGood;
      current.defective += inb.qtyDefective;
      totals.set(inb.sku, current);
    }
    
    return totals;
  },

  /**
   * Get summary stats
   */
  getStats() {
    const inbounds = loadInbounds();
    const now = new Date();
    const thisMonth = inbounds.filter(i => {
      const date = new Date(i.dateReceived);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });
    
    const totalReceived = inbounds.reduce((sum, i) => sum + i.qtyReceived, 0);
    const totalGood = inbounds.reduce((sum, i) => sum + i.qtyGood, 0);
    const totalDefective = inbounds.reduce((sum, i) => sum + i.qtyDefective, 0);
    const pendingQC = inbounds.filter(i => i.qcStatus !== 'complete').length;
    
    return {
      totalInbounds: inbounds.length,
      totalReceived,
      totalGood,
      totalDefective,
      defectRate: totalReceived > 0 ? (totalDefective / totalReceived * 100).toFixed(1) : '0',
      pendingQC,
      thisMonthInbounds: thisMonth.length,
      thisMonthReceived: thisMonth.reduce((sum, i) => sum + i.qtyReceived, 0),
    };
  },

  create(data: Omit<InboundRecord, 'id' | 'createdAt' | 'updatedAt'>): InboundRecord {
    const inbounds = loadInbounds();
    const now = Date.now();
    const newInbound: InboundRecord = {
      ...data,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    inbounds.push(newInbound);
    saveInbounds(inbounds);
    return newInbound;
  },

  update(id: string, data: Partial<Omit<InboundRecord, 'id' | 'createdAt'>>, note?: string): InboundRecord | null {
    const inbounds = loadInbounds();
    const index = inbounds.findIndex(i => i.id === id);
    if (index === -1) return null;
    
    const old = inbounds[index];
    const history = loadHistory();
    
    // Track changes
    for (const [key, newValue] of Object.entries(data)) {
      if (key !== 'updatedAt' && old[key as keyof InboundRecord] !== newValue) {
        history.push({
          id,
          timestamp: Date.now(),
          field: key,
          oldValue: old[key as keyof InboundRecord],
          newValue,
          note,
        });
      }
    }
    saveHistory(history);
    
    inbounds[index] = { ...old, ...data, updatedAt: Date.now() };
    saveInbounds(inbounds);
    return inbounds[index];
  },

  delete(id: string): boolean {
    const inbounds = loadInbounds();
    const filtered = inbounds.filter(i => i.id !== id);
    if (filtered.length === inbounds.length) return false;
    saveInbounds(filtered);
    return true;
  },

  deleteAll(): void {
    saveInbounds([]);
    saveHistory([]);
  },

  getHistory(inboundId: string): InboundUpdate[] {
    return loadHistory().filter(h => h.id === inboundId);
  },

  exportJSON(): string {
    return JSON.stringify({
      inbounds: loadInbounds(),
      history: loadHistory(),
    }, null, 2);
  },
};

/**
 * Warehouse Transfer Registry (future-ready)
 */
export interface WarehouseTransfer {
  id: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  sku: string;
  qty: number;
  status: 'pending' | 'in_transit' | 'received' | 'cancelled';
  requestedDate: string;
  shippedDate?: string;
  receivedDate?: string;
  eta?: string;
  notes?: string;
  createdAt: number;
}

const TRANSFER_KEY = 'capy-warehouse-transfers';

function loadTransfers(): WarehouseTransfer[] {
  try {
    const stored = localStorage.getItem(TRANSFER_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.error('Failed to load transfers:', e);
  }
  return [];
}

function saveTransfers(transfers: WarehouseTransfer[]) {
  localStorage.setItem(TRANSFER_KEY, JSON.stringify(transfers));
}

export const transferRegistry = {
  getAll(): WarehouseTransfer[] {
    return loadTransfers();
  },

  getById(id: string): WarehouseTransfer | undefined {
    return loadTransfers().find(t => t.id === id);
  },

  getPending(): WarehouseTransfer[] {
    return loadTransfers().filter(t => t.status === 'pending' || t.status === 'in_transit');
  },

  create(data: Omit<WarehouseTransfer, 'id' | 'createdAt'>): WarehouseTransfer {
    const transfers = loadTransfers();
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    const newTransfer: WarehouseTransfer = {
      ...data,
      id: `TRF-${year}${month}-${random}`,
      createdAt: Date.now(),
    };
    transfers.push(newTransfer);
    saveTransfers(transfers);
    return newTransfer;
  },

  update(id: string, data: Partial<Omit<WarehouseTransfer, 'id' | 'createdAt'>>): WarehouseTransfer | null {
    const transfers = loadTransfers();
    const index = transfers.findIndex(t => t.id === id);
    if (index === -1) return null;
    
    transfers[index] = { ...transfers[index], ...data };
    saveTransfers(transfers);
    return transfers[index];
  },

  delete(id: string): boolean {
    const transfers = loadTransfers();
    const filtered = transfers.filter(t => t.id !== id);
    if (filtered.length === transfers.length) return false;
    saveTransfers(filtered);
    return true;
  },
};
