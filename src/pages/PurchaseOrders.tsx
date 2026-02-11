import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Upload, Download, ChevronDown, ChevronRight, Truck, AlertTriangle, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input, SearchInput } from '../components/ui/Input';
import { Header } from '../components/layout/Header';
import { poRegistry } from '../services/poRegistry';
import { supplierRegistry } from '../services/supplierRegistry';
import { productRegistry } from '../services/productRegistry';
import { formatNumber } from '../lib/utils';

// Mars Sheet PO data for import
const MARS_POS = [
  { poNumber: 'A025-09', supplierCode: 'CPY_A01', supplierName: 'Youdingzhi Textile', sku: 'OG-M-001', qtyOrdered: 1443, qtyReceived: 0, qtyRemaining: 1443, status: 'Pending' },
  { poNumber: 'A025-09', supplierCode: 'CPY_A01', supplierName: 'Youdingzhi Textile', sku: 'OG-M-008', qtyOrdered: 1200, qtyReceived: 0, qtyRemaining: 1200, status: 'Pending' },
  { poNumber: 'A025-09', supplierCode: 'CPY_A01', supplierName: 'Youdingzhi Textile', sku: 'OG-M-010', qtyOrdered: 1023, qtyReceived: 0, qtyRemaining: 1023, status: 'Pending' },
  { poNumber: 'A025-09', supplierCode: 'CPY_A01', supplierName: 'Youdingzhi Textile', sku: 'OG-M-012', qtyOrdered: 324, qtyReceived: 0, qtyRemaining: 324, status: 'Pending' },
  { poNumber: 'A025-09', supplierCode: 'CPY_A01', supplierName: 'Youdingzhi Textile', sku: 'OG-KEY-001', qtyOrdered: 1785, qtyReceived: 0, qtyRemaining: 1785, status: 'Pending' },
  { poNumber: 'A025-09', supplierCode: 'CPY_A01', supplierName: 'Youdingzhi Textile', sku: 'OG-KEY-002', qtyOrdered: 1248, qtyReceived: 0, qtyRemaining: 1248, status: 'Pending' },
  { poNumber: 'A025-09', supplierCode: 'CPY_A01', supplierName: 'Youdingzhi Textile', sku: 'OG-KEY-003', qtyOrdered: 1755, qtyReceived: 0, qtyRemaining: 1755, status: 'Pending' },
  { poNumber: 'A025-09', supplierCode: 'CPY_A01', supplierName: 'Youdingzhi Textile', sku: 'OG-KEY-004', qtyOrdered: 912, qtyReceived: 0, qtyRemaining: 912, status: 'Pending' },
  { poNumber: 'A025-09', supplierCode: 'CPY_A01', supplierName: 'Youdingzhi Textile', sku: 'OG-KEY-005', qtyOrdered: 970, qtyReceived: 0, qtyRemaining: 970, status: 'Pending' },
  { poNumber: 'A025-09', supplierCode: 'CPY_A01', supplierName: 'Youdingzhi Textile', sku: 'OG-KEY-006', qtyOrdered: 510, qtyReceived: 0, qtyRemaining: 510, status: 'Pending' },
  { poNumber: 'A025-09', supplierCode: 'CPY_A01', supplierName: 'Youdingzhi Textile', sku: 'OG-KEY-007', qtyOrdered: 640, qtyReceived: 0, qtyRemaining: 640, status: 'Pending' },
  { poNumber: 'A025-09', supplierCode: 'CPY_A01', supplierName: 'Youdingzhi Textile', sku: 'OG-KEY-008', qtyOrdered: 695, qtyReceived: 0, qtyRemaining: 695, status: 'Pending' },
  { poNumber: 'A025-09', supplierCode: 'CPY_A01', supplierName: 'Youdingzhi Textile', sku: 'OG-KEY-009', qtyOrdered: 1405, qtyReceived: 0, qtyRemaining: 1405, status: 'Pending' },
  { poNumber: 'A025-09', supplierCode: 'CPY_A01', supplierName: 'Youdingzhi Textile', sku: 'OG-KEY-010', qtyOrdered: 445, qtyReceived: 0, qtyRemaining: 445, status: 'Pending' },
  { poNumber: 'A025-09', supplierCode: 'CPY_A01', supplierName: 'Youdingzhi Textile', sku: 'OG-KEY-011', qtyOrdered: 360, qtyReceived: 0, qtyRemaining: 360, status: 'Pending' },
  { poNumber: 'A025-09', supplierCode: 'CPY_A01', supplierName: 'Youdingzhi Textile', sku: 'OG-KEY-012', qtyOrdered: 295, qtyReceived: 0, qtyRemaining: 295, status: 'Pending' },
  { poNumber: 'A025-09', supplierCode: 'CPY_A01', supplierName: 'Youdingzhi Textile', sku: 'OG-PC-009', qtyOrdered: 1035, qtyReceived: 0, qtyRemaining: 1035, status: 'Pending' },
  { poNumber: 'A025-09', supplierCode: 'CPY_A01', supplierName: 'Youdingzhi Textile', sku: 'OG-PC-007', qtyOrdered: 800, qtyReceived: 0, qtyRemaining: 800, status: 'Pending' },
  { poNumber: 'A025-09', supplierCode: 'CPY_A01', supplierName: 'Youdingzhi Textile', sku: 'OG-PC-002', qtyOrdered: 800, qtyReceived: 0, qtyRemaining: 800, status: 'Pending' },
  { poNumber: 'A025-09', supplierCode: 'CPY_A01', supplierName: 'Youdingzhi Textile', sku: 'OG-PC-008', qtyOrdered: 600, qtyReceived: 0, qtyRemaining: 600, status: 'Pending' },
  { poNumber: 'A025-09', supplierCode: 'CPY_A01', supplierName: 'Youdingzhi Textile', sku: 'OG-PC-005', qtyOrdered: 500, qtyReceived: 0, qtyRemaining: 500, status: 'Pending' },
  { poNumber: 'A025-11', supplierCode: 'CPY_A01', supplierName: 'Youdingzhi Textile', sku: 'OG-M-009', qtyOrdered: 5000, qtyReceived: 5000, qtyRemaining: 0, status: 'Complete' },
  { poNumber: 'A025-11', supplierCode: 'CPY_A01', supplierName: 'Youdingzhi Textile', sku: 'OG-M-002', qtyOrdered: 5000, qtyReceived: 5000, qtyRemaining: 0, status: 'Complete' },
  { poNumber: 'A025-11', supplierCode: 'CPY_A01', supplierName: 'Youdingzhi Textile', sku: 'OG-M-005', qtyOrdered: 5000, qtyReceived: 3022, qtyRemaining: 1978, status: 'Partial' },
  { poNumber: 'A025-11', supplierCode: 'CPY_A01', supplierName: 'Youdingzhi Textile', sku: 'OG-M-007', qtyOrdered: 5000, qtyReceived: 3000, qtyRemaining: 2000, status: 'Partial' },
  { poNumber: 'A025-11', supplierCode: 'CPY_A01', supplierName: 'Youdingzhi Textile', sku: 'OG-M-003', qtyOrdered: 3000, qtyReceived: 1568, qtyRemaining: 1432, status: 'Partial' },
  { poNumber: 'A025-11', supplierCode: 'CPY_A01', supplierName: 'Youdingzhi Textile', sku: 'OG-M-008', qtyOrdered: 5000, qtyReceived: 2600, qtyRemaining: 2400, status: 'Partial' },
  { poNumber: 'A025-11', supplierCode: 'CPY_A01', supplierName: 'Youdingzhi Textile', sku: 'OG-M-001', qtyOrdered: 5000, qtyReceived: 0, qtyRemaining: 5000, status: 'Pending' },
  { poNumber: 'A025-11', supplierCode: 'CPY_A01', supplierName: 'Youdingzhi Textile', sku: 'OG-M-004', qtyOrdered: 5000, qtyReceived: 956, qtyRemaining: 4044, status: 'Partial' },
  { poNumber: 'A025-11', supplierCode: 'CPY_A01', supplierName: 'Youdingzhi Textile', sku: 'OG-M-006', qtyOrdered: 5000, qtyReceived: 530, qtyRemaining: 4470, status: 'Partial' },
  { poNumber: 'A025-11', supplierCode: 'CPY_A01', supplierName: 'Youdingzhi Textile', sku: 'OG-M-010', qtyOrdered: 3000, qtyReceived: 2000, qtyRemaining: 1000, status: 'Partial' },
  { poNumber: 'A025-11', supplierCode: 'CPY_A01', supplierName: 'Youdingzhi Textile', sku: 'OG-M-011', qtyOrdered: 3000, qtyReceived: 1000, qtyRemaining: 2000, status: 'Partial' },
  { poNumber: 'A025-11', supplierCode: 'CPY_A01', supplierName: 'Youdingzhi Textile', sku: 'OG-M-012', qtyOrdered: 4000, qtyReceived: 1000, qtyRemaining: 3000, status: 'Partial' },
  { poNumber: 'A026-01', supplierCode: 'CPY_A01', supplierName: 'Youdingzhi Textile', sku: 'OG-M-009', qtyOrdered: 3000, qtyReceived: 0, qtyRemaining: 3000, status: 'Pending' },
  { poNumber: 'A026-01', supplierCode: 'CPY_A01', supplierName: 'Youdingzhi Textile', sku: 'OG-M-002', qtyOrdered: 3000, qtyReceived: 0, qtyRemaining: 3000, status: 'Pending' },
  { poNumber: 'A026-01', supplierCode: 'CPY_A01', supplierName: 'Youdingzhi Textile', sku: 'OG-M-008', qtyOrdered: 3000, qtyReceived: 0, qtyRemaining: 3000, status: 'Pending' },
  { poNumber: 'A026-01', supplierCode: 'CPY_A01', supplierName: 'Youdingzhi Textile', sku: 'OG-M-005', qtyOrdered: 3000, qtyReceived: 0, qtyRemaining: 3000, status: 'Pending' },
  { poNumber: 'A026-01', supplierCode: 'CPY_A01', supplierName: 'Youdingzhi Textile', sku: 'OG-M-007', qtyOrdered: 3000, qtyReceived: 0, qtyRemaining: 3000, status: 'Pending' },
  { poNumber: 'A026-01', supplierCode: 'CPY_A01', supplierName: 'Youdingzhi Textile', sku: 'OG-M-001', qtyOrdered: 3000, qtyReceived: 0, qtyRemaining: 3000, status: 'Pending' },
];

// Delete Confirmation Modal
interface DeleteConfirmModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteConfirmModal({ title, message, onConfirm, onCancel }: DeleteConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600 mb-6">{message}</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onCancel}>Cancel</Button>
            <Button onClick={onConfirm} className="bg-red-600 hover:bg-red-700 text-white">
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Generate next PO number
function generatePONumber(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  return `PO${year}${month}-${random}`;
}

// Create PO Form
interface POFormProps {
  onSave: () => void;
  onCancel: () => void;
}

function POForm({ onSave, onCancel }: POFormProps) {
  const [poNumber, setPONumber] = useState(generatePONumber());
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [skuQuantities, setSkuQuantities] = useState<Record<string, number>>({});
  const [expectedDate, setExpectedDate] = useState('');
  
  const suppliers = supplierRegistry.getAll();
  const allProducts = productRegistry.getAll();
  
  // Get SKUs for selected supplier
  const supplierSkus = useMemo(() => {
    if (!selectedSupplier) return [];
    const supplier = suppliers.find(s => s.code === selectedSupplier);
    if (!supplier?.skus?.length) {
      // If no SKUs assigned, show all products
      return allProducts.map(p => ({ sku: p.sku, name: p.name }));
    }
    return supplier.skus.map(sku => {
      const product = allProducts.find(p => p.sku === sku);
      return { sku, name: product?.name || sku };
    });
  }, [selectedSupplier, suppliers, allProducts]);

  const selectedSupplierData = suppliers.find(s => s.code === selectedSupplier);
  
  const totalUnits = Object.values(skuQuantities).reduce((sum, qty) => sum + (qty || 0), 0);
  const skusWithQty = Object.entries(skuQuantities).filter(([_, qty]) => qty > 0).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier || skusWithQty === 0) return;
    
    // Create PO lines
    Object.entries(skuQuantities).forEach(([sku, qty]) => {
      if (qty > 0) {
        poRegistry.create({
          poNumber,
          supplierCode: selectedSupplierData?.code || '',
          supplierName: selectedSupplierData?.name || '',
          sku,
          qtyOrdered: qty,
          qtyReceived: 0,
          qtyRemaining: qty,
          status: 'Pending',
          expectedDate: expectedDate || undefined,
        });
      }
    });
    
    onSave();
  };

  const handleQtyChange = (sku: string, value: string) => {
    const qty = parseInt(value) || 0;
    setSkuQuantities(prev => ({ ...prev, [sku]: qty }));
  };

  return (
    <Card className="border-2 border-amber-300 bg-amber-50/30 mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="w-5 h-5 text-amber-600" />
          Create New Purchase Order
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">PO Number</label>
              <Input
                value={poNumber}
                onChange={(e) => setPONumber(e.target.value.toUpperCase())}
                placeholder="PO2602-01"
                className="font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Supplier *</label>
              <select
                value={selectedSupplier}
                onChange={(e) => {
                  setSelectedSupplier(e.target.value);
                  setSkuQuantities({});
                }}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                required
              >
                <option value="">Select supplier...</option>
                {suppliers.map(s => (
                  <option key={s.code} value={s.code}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Expected Date</label>
              <Input
                type="date"
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
              />
            </div>
          </div>

          {/* SKU Selection */}
          {selectedSupplier && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Order Quantities ({skusWithQty} SKUs, {formatNumber(totalUnits)} units)
              </label>
              <div className="border border-slate-200 rounded-lg bg-white max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-slate-700">SKU</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-700">Product</th>
                      <th className="px-3 py-2 text-right font-medium text-slate-700 w-32">Quantity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {supplierSkus.map(({ sku, name }) => (
                      <tr key={sku} className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-mono text-slate-600">{sku}</td>
                        <td className="px-3 py-2 text-slate-700">{name}</td>
                        <td className="px-3 py-2">
                          <Input
                            type="number"
                            min="0"
                            value={skuQuantities[sku] || ''}
                            onChange={(e) => handleQtyChange(sku, e.target.value)}
                            placeholder="0"
                            className="w-28 text-right"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {supplierSkus.length === 0 && (
                <p className="text-sm text-slate-500 p-4 text-center">
                  No SKUs assigned to this supplier. Assign SKUs in the Suppliers page.
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
            <Button type="submit" disabled={!selectedSupplier || skusWithQty === 0}>
              Create PO ({skusWithQty} SKUs)
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function PurchaseOrders() {
  const [poLines, setPOLines] = useState<ReturnType<typeof poRegistry.getAll>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPOs, setExpandedPOs] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'po' | 'all'; poNumber?: string } | null>(null);

  useEffect(() => {
    loadPOs();
  }, []);

  function loadPOs() {
    setIsLoading(true);
    const data = poRegistry.getAll();
    setPOLines(data);
    setIsLoading(false);
  }

  function handleImportMars() {
    const count = poRegistry.bulkImport(MARS_POS);
    alert(`Imported ${count} new PO lines. ${MARS_POS.length - count} were updated.`);
    loadPOs();
  }

  function handleDeleteAll() {
    poRegistry.deleteAll();
    loadPOs();
    setDeleteConfirm(null);
  }

  function handleDeletePO(poNumber: string) {
    poRegistry.deletePO(poNumber);
    loadPOs();
    setDeleteConfirm(null);
  }

  function handleExport() {
    const json = poRegistry.exportJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'capy-purchase-orders.json';
    a.click();
  }

  function toggleExpanded(poNumber: string) {
    setExpandedPOs(prev => {
      const next = new Set(prev);
      if (next.has(poNumber)) next.delete(poNumber);
      else next.add(poNumber);
      return next;
    });
  }

  // Get PO summary
  const poSummary = useMemo(() => {
    const summary = poRegistry.getPOSummary();
    return summary.filter(po => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!po.poNumber.toLowerCase().includes(q) && !po.supplierName.toLowerCase().includes(q)) {
          return false;
        }
      }
      if (filterStatus !== 'all' && po.status.toLowerCase() !== filterStatus) {
        return false;
      }
      return true;
    });
  }, [poLines, searchQuery, filterStatus]);

  // Stats
  const stats = useMemo(() => {
    const summary = poRegistry.getPOSummary();
    return {
      totalPOs: summary.length,
      pending: summary.filter(p => p.status === 'Pending').length,
      partial: summary.filter(p => p.status === 'Partial').length,
      complete: summary.filter(p => p.status === 'Complete').length,
      totalUnitsOrdered: summary.reduce((sum, p) => sum + p.totalOrdered, 0),
      totalUnitsRemaining: summary.reduce((sum, p) => sum + p.totalRemaining, 0),
    };
  }, [poLines]);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header 
        title="Purchase Orders" 
        subtitle={`${stats.totalPOs} POs, ${formatNumber(stats.totalUnitsRemaining)} units pending`}
        onRefresh={loadPOs}
        isLoading={isLoading}
      />
      
      <div className="flex-1 overflow-y-auto p-6">
        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <DeleteConfirmModal
            title={deleteConfirm.type === 'all' ? 'Delete All Purchase Orders?' : `Delete PO ${deleteConfirm.poNumber}?`}
            message={deleteConfirm.type === 'all' 
              ? 'This will permanently delete all purchase orders and their line items. This action cannot be undone.'
              : `This will permanently delete PO ${deleteConfirm.poNumber} and all its line items. This action cannot be undone.`
            }
            onConfirm={() => deleteConfirm.type === 'all' ? handleDeleteAll() : handleDeletePO(deleteConfirm.poNumber!)}
            onCancel={() => setDeleteConfirm(null)}
          />
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card className="bg-amber-50">
            <CardContent className="p-4">
              <p className="text-xs text-amber-600 font-medium uppercase">Total POs</p>
              <p className="text-2xl font-bold text-amber-700">{stats.totalPOs}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-slate-500 font-medium uppercase">Pending</p>
              <p className="text-2xl font-bold">{stats.pending}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-blue-600 font-medium uppercase">Partial</p>
              <p className="text-2xl font-bold text-blue-700">{stats.partial}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-green-600 font-medium uppercase">Complete</p>
              <p className="text-2xl font-bold text-green-700">{stats.complete}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-slate-500 font-medium uppercase">Units Remaining</p>
              <p className="text-2xl font-bold">{formatNumber(stats.totalUnitsRemaining)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-[200px] max-w-md">
            <SearchInput
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search PO number or supplier..."
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="partial">Partial</option>
            <option value="complete">Complete</option>
          </select>
          <Button variant="outline" onClick={handleImportMars}>
            <Upload className="w-4 h-4 mr-2" />
            Import from Mars
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          {poLines.length > 0 && (
            <Button 
              variant="outline" 
              onClick={() => setDeleteConfirm({ type: 'all' })} 
              className="text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete All
            </Button>
          )}
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create PO
          </Button>
        </div>

        {/* Create PO Form */}
        {showForm && (
          <POForm
            onSave={() => { loadPOs(); setShowForm(false); }}
            onCancel={() => setShowForm(false)}
          />
        )}

        {/* PO Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-700 w-8"></th>
                  <th className="px-4 py-3 text-left font-medium text-slate-700">PO Number</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-700">Supplier</th>
                  <th className="px-4 py-3 text-center font-medium text-slate-700">SKUs</th>
                  <th className="px-4 py-3 text-center font-medium text-slate-700">Ordered</th>
                  <th className="px-4 py-3 text-center font-medium text-slate-700">Received</th>
                  <th className="px-4 py-3 text-center font-medium text-slate-700">Remaining</th>
                  <th className="px-4 py-3 text-center font-medium text-slate-700">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {poSummary.map((po) => {
                  const isExpanded = expandedPOs.has(po.poNumber);
                  const lines = poRegistry.getByPONumber(po.poNumber);
                  
                  return (
                    <React.Fragment key={po.poNumber}>
                      <tr className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <button 
                            onClick={() => toggleExpanded(po.poNumber)}
                            className="p-1 hover:bg-slate-100 rounded"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono font-semibold text-amber-700">{po.poNumber}</span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900">{po.supplierName}</p>
                          <p className="text-xs text-slate-500">{po.supplierCode}</p>
                        </td>
                        <td className="px-4 py-3 text-center">{po.totalSkus}</td>
                        <td className="px-4 py-3 text-center font-medium">{formatNumber(po.totalOrdered)}</td>
                        <td className="px-4 py-3 text-center text-green-600">{formatNumber(po.totalReceived)}</td>
                        <td className="px-4 py-3 text-center font-medium">{formatNumber(po.totalRemaining)}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={
                            po.status === 'Complete' ? 'success' :
                            po.status === 'Partial' ? 'info' :
                            'warning'
                          }>
                            {po.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteConfirm({ type: 'po', poNumber: po.poNumber })}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                      {isExpanded && lines.map((line) => (
                        <tr key={line.id} className="bg-slate-50/50">
                          <td></td>
                          <td className="px-4 py-2 pl-12">
                            <span className="text-slate-400 text-xs mr-2">└</span>
                            <span className="font-mono text-sm">{line.sku}</span>
                          </td>
                          <td className="px-4 py-2 text-slate-600">{line.productName || '-'}</td>
                          <td></td>
                          <td className="px-4 py-2 text-center text-sm">{formatNumber(line.qtyOrdered)}</td>
                          <td className="px-4 py-2 text-center text-sm text-green-600">{formatNumber(line.qtyReceived)}</td>
                          <td className="px-4 py-2 text-center text-sm">{formatNumber(line.qtyRemaining)}</td>
                          <td className="px-4 py-2 text-center">
                            <Badge variant={
                              line.status === 'Complete' ? 'success' :
                              line.status === 'Partial' ? 'info' :
                              'outline'
                            } className="text-xs">
                              {line.status}
                            </Badge>
                          </td>
                          <td></td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {poSummary.length === 0 && !isLoading && !showForm && (
          <Card className="text-center py-12 mt-4">
            <CardContent>
              <Truck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 mb-4">No purchase orders found</p>
              <div className="flex justify-center gap-2">
                <Button onClick={handleImportMars} variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  Import from Mars
                </Button>
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create PO
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
