import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Edit2, Trash2, Package, Truck, AlertTriangle, Check, 
  X, ChevronDown, ChevronRight, History, Download, ArrowLeft
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input, SearchInput } from '../components/ui/Input';
import { Header } from '../components/layout/Header';
import { inboundRegistry, type InboundRecord } from '../services/inboundRegistry';
import { poRegistry } from '../services/poRegistry';
import { formatNumber } from '../lib/utils';

// Batch Inbound Form - Full Page
interface BatchInboundFormProps {
  onSave: () => void;
  onCancel: () => void;
}

interface LineItemInput {
  sku: string;
  productName: string;
  ordered: number;
  alreadyReceived: number;
  remaining: number;
  qtyReceived: string;
  qtyGood: string;
  qtyDefective: string;
}

function BatchInboundForm({ onSave, onCancel }: BatchInboundFormProps) {
  const [selectedPO, setSelectedPO] = useState('');
  const [dateReceived, setDateReceived] = useState(new Date().toISOString().split('T')[0]);
  const [lineItems, setLineItems] = useState<LineItemInput[]>([]);
  const [qcStatus, setQcStatus] = useState<'pending' | 'in_progress' | 'complete'>('pending');
  const [notes, setNotes] = useState('');

  // Get PO summary for dropdown
  const poSummary = useMemo(() => poRegistry.getPOSummary(), []);

  // When PO is selected, populate line items
  useEffect(() => {
    if (!selectedPO) {
      setLineItems([]);
      return;
    }
    
    const lines = poRegistry.getByPONumber(selectedPO);
    const received = inboundRegistry.getTotalReceivedForPO(selectedPO);
    
    const items = lines.map(line => {
      const rec = received.get(line.sku) || { received: 0, good: 0, defective: 0 };
      return {
        sku: line.sku,
        productName: line.productName || line.sku,
        ordered: line.qtyOrdered,
        alreadyReceived: rec.received,
        remaining: line.qtyOrdered - rec.received,
        qtyReceived: '',
        qtyGood: '',
        qtyDefective: '0',
      };
    });
    
    setLineItems(items);
  }, [selectedPO]);

  const selectedPOData = poSummary.find(p => p.poNumber === selectedPO);

  // Update line item
  const updateLine = (index: number, field: keyof LineItemInput, value: string) => {
    setLineItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      
      // Auto-calculate good qty when received changes
      if (field === 'qtyReceived' || field === 'qtyDefective') {
        const received = parseInt(updated[index].qtyReceived) || 0;
        const defective = parseInt(updated[index].qtyDefective) || 0;
        if (received > 0 && !updated[index].qtyGood) {
          updated[index].qtyGood = Math.max(0, received - defective).toString();
        }
      }
      
      return updated;
    });
  };

  // Fill all remaining
  const fillAllRemaining = () => {
    setLineItems(prev => prev.map(item => ({
      ...item,
      qtyReceived: item.remaining.toString(),
      qtyGood: item.remaining.toString(),
      qtyDefective: '0',
    })));
  };

  // Calculate totals
  const totals = useMemo(() => {
    let received = 0, good = 0, defective = 0;
    lineItems.forEach(item => {
      received += parseInt(item.qtyReceived) || 0;
      good += parseInt(item.qtyGood) || 0;
      defective += parseInt(item.qtyDefective) || 0;
    });
    return { received, good, defective };
  }, [lineItems]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create inbound records for each line with qty > 0
    const linesToSave = lineItems.filter(item => parseInt(item.qtyReceived) > 0);
    
    if (linesToSave.length === 0) {
      alert('Please enter quantities for at least one item');
      return;
    }
    
    linesToSave.forEach(item => {
      inboundRegistry.create({
        poNumber: selectedPO,
        sku: item.sku,
        productName: item.productName,
        supplierCode: selectedPOData?.supplierCode || '',
        supplierName: selectedPOData?.supplierName || '',
        warehouseId: 'speedfulfill-cn',
        dateReceived,
        qtyReceived: parseInt(item.qtyReceived) || 0,
        qtyGood: parseInt(item.qtyGood) || 0,
        qtyDefective: parseInt(item.qtyDefective) || 0,
        qcStatus,
        notes: notes || undefined,
      });
    });
    
    onSave();
  };

  const hasItems = lineItems.length > 0;
  const hasQuantities = lineItems.some(item => parseInt(item.qtyReceived) > 0);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={onCancel}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Log New Inbound</h1>
            <p className="text-sm text-slate-500">Receive goods from a Purchase Order</p>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6">
        <form onSubmit={handleSubmit}>
          {/* PO Selection */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Purchase Order *</label>
                  <select
                    value={selectedPO}
                    onChange={(e) => setSelectedPO(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    required
                  >
                    <option value="">Select PO...</option>
                    {poSummary.filter(p => p.status !== 'Complete').map(po => (
                      <option key={po.poNumber} value={po.poNumber}>
                        {po.poNumber} - {po.supplierName} ({formatNumber(po.totalRemaining)} remaining)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Date Received *</label>
                  <Input
                    type="date"
                    value={dateReceived}
                    onChange={(e) => setDateReceived(e.target.value)}
                    required
                    className="py-2.5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">QC Status</label>
                  <select
                    value={qcStatus}
                    onChange={(e) => setQcStatus(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  >
                    <option value="pending">⏳ Pending QC</option>
                    <option value="in_progress">🔍 QC In Progress</option>
                    <option value="complete">✅ QC Complete</option>
                  </select>
                </div>
              </div>
              
              {selectedPOData && (
                <div className="mt-4 p-3 bg-slate-50 rounded-lg flex items-center gap-6 text-sm">
                  <div>
                    <span className="text-slate-500">Supplier:</span>{' '}
                    <span className="font-medium">{selectedPOData.supplierName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Total Ordered:</span>{' '}
                    <span className="font-medium">{formatNumber(selectedPOData.totalOrdered)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Remaining:</span>{' '}
                    <span className="font-medium text-amber-600">{formatNumber(selectedPOData.totalRemaining)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Line Items Table */}
          {hasItems && (
            <Card className="mb-6">
              <CardHeader className="flex flex-row items-center justify-between py-4">
                <CardTitle className="text-base">Items to Receive ({lineItems.length} SKUs)</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={fillAllRemaining}>
                  Fill All Remaining
                </Button>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-y">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-slate-700">SKU</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-700">Product</th>
                      <th className="px-4 py-3 text-center font-medium text-slate-700">Ordered</th>
                      <th className="px-4 py-3 text-center font-medium text-slate-700">Already Received</th>
                      <th className="px-4 py-3 text-center font-medium text-slate-700">Remaining</th>
                      <th className="px-4 py-3 text-center font-medium text-slate-700 bg-amber-50">Qty Received</th>
                      <th className="px-4 py-3 text-center font-medium text-slate-700 bg-green-50">Qty Good</th>
                      <th className="px-4 py-3 text-center font-medium text-slate-700 bg-red-50">Qty Defective</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {lineItems.map((item, index) => (
                      <tr key={item.sku} className={item.remaining === 0 ? 'bg-slate-50 opacity-50' : ''}>
                        <td className="px-4 py-3">
                          <span className="font-mono text-slate-700">{item.sku}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-600 max-w-[200px] truncate">
                          {item.productName}
                        </td>
                        <td className="px-4 py-3 text-center text-slate-600">
                          {formatNumber(item.ordered)}
                        </td>
                        <td className="px-4 py-3 text-center text-slate-500">
                          {formatNumber(item.alreadyReceived)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={item.remaining > 0 ? 'font-medium text-amber-600' : 'text-green-600'}>
                            {formatNumber(item.remaining)}
                          </span>
                        </td>
                        <td className="px-4 py-3 bg-amber-50/50">
                          <input
                            type="number"
                            min="0"
                            max={item.remaining}
                            value={item.qtyReceived}
                            onChange={(e) => updateLine(index, 'qtyReceived', e.target.value)}
                            placeholder="0"
                            disabled={item.remaining === 0}
                            className="w-24 mx-auto block px-2 py-1.5 text-center border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                          />
                        </td>
                        <td className="px-4 py-3 bg-green-50/50">
                          <input
                            type="number"
                            min="0"
                            value={item.qtyGood}
                            onChange={(e) => updateLine(index, 'qtyGood', e.target.value)}
                            placeholder="0"
                            disabled={item.remaining === 0}
                            className="w-24 mx-auto block px-2 py-1.5 text-center border border-green-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                          />
                        </td>
                        <td className="px-4 py-3 bg-red-50/50">
                          <input
                            type="number"
                            min="0"
                            value={item.qtyDefective}
                            onChange={(e) => updateLine(index, 'qtyDefective', e.target.value)}
                            placeholder="0"
                            disabled={item.remaining === 0}
                            className="w-24 mx-auto block px-2 py-1.5 text-center border border-red-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {/* Totals Row */}
                  <tfoot className="bg-slate-100 border-t-2 font-medium">
                    <tr>
                      <td colSpan={5} className="px-4 py-3 text-right text-slate-700">
                        Totals:
                      </td>
                      <td className="px-4 py-3 text-center bg-amber-100 text-amber-800">
                        {formatNumber(totals.received)}
                      </td>
                      <td className="px-4 py-3 text-center bg-green-100 text-green-800">
                        {formatNumber(totals.good)}
                      </td>
                      <td className="px-4 py-3 text-center bg-red-100 text-red-800">
                        {formatNumber(totals.defective)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Card>
          )}

          {/* Notes */}
          {hasItems && (
            <Card className="mb-6">
              <CardContent className="p-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any notes about this shipment..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none"
                  rows={3}
                />
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={!hasQuantities}>
              <Package className="w-4 h-4 mr-2" />
              Log Inbound ({lineItems.filter(i => parseInt(i.qtyReceived) > 0).length} items)
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Single Item Edit Modal (for editing existing inbounds)
interface EditInboundModalProps {
  inbound: InboundRecord;
  onSave: () => void;
  onCancel: () => void;
}

function EditInboundModal({ inbound, onSave, onCancel }: EditInboundModalProps) {
  const [qtyReceived, setQtyReceived] = useState(inbound.qtyReceived.toString());
  const [qtyGood, setQtyGood] = useState(inbound.qtyGood.toString());
  const [qtyDefective, setQtyDefective] = useState(inbound.qtyDefective.toString());
  const [defectNotes, setDefectNotes] = useState(inbound.defectNotes || '');
  const [qcStatus, setQcStatus] = useState(inbound.qcStatus);
  const [notes, setNotes] = useState(inbound.notes || '');
  const [updateNote, setUpdateNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    inboundRegistry.update(inbound.id, {
      qtyReceived: parseInt(qtyReceived) || 0,
      qtyGood: parseInt(qtyGood) || 0,
      qtyDefective: parseInt(qtyDefective) || 0,
      defectNotes: defectNotes || undefined,
      qcStatus,
      qcDate: qcStatus === 'complete' ? new Date().toISOString().split('T')[0] : undefined,
      notes: notes || undefined,
    }, updateNote || undefined);
    
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <CardTitle className="flex items-center gap-2">
            <Edit2 className="w-5 h-5 text-amber-600" />
            Edit Inbound {inbound.id}
          </CardTitle>
          <button onClick={onCancel} className="p-1 hover:bg-slate-100 rounded">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Info */}
            <div className="p-3 bg-slate-50 rounded-lg text-sm">
              <p><strong>PO:</strong> {inbound.poNumber}</p>
              <p><strong>SKU:</strong> {inbound.sku}</p>
              <p><strong>Date:</strong> {inbound.dateReceived}</p>
            </div>

            {/* Quantities */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Qty Received</label>
                <Input
                  type="number"
                  min="0"
                  value={qtyReceived}
                  onChange={(e) => setQtyReceived(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Qty Good</label>
                <Input
                  type="number"
                  min="0"
                  value={qtyGood}
                  onChange={(e) => setQtyGood(e.target.value)}
                  className="border-green-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Qty Defective</label>
                <Input
                  type="number"
                  min="0"
                  value={qtyDefective}
                  onChange={(e) => setQtyDefective(e.target.value)}
                  className="border-red-300"
                />
              </div>
            </div>

            {/* Defect Notes */}
            {(parseInt(qtyDefective) || 0) > 0 && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Defect Notes</label>
                <Input
                  value={defectNotes}
                  onChange={(e) => setDefectNotes(e.target.value)}
                  placeholder="Describe defects..."
                />
              </div>
            )}

            {/* QC Status */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">QC Status</label>
              <select
                value={qcStatus}
                onChange={(e) => setQcStatus(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              >
                <option value="pending">⏳ Pending QC</option>
                <option value="in_progress">🔍 QC In Progress</option>
                <option value="complete">✅ QC Complete</option>
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes..."
              />
            </div>

            {/* Update Reason */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Update Reason</label>
              <Input
                value={updateNote}
                onChange={(e) => setUpdateNote(e.target.value)}
                placeholder="Why are you updating this? (optional)"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
              <Button type="submit">Update Inbound</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// History Modal
function HistoryModal({ inbound, onClose }: { inbound: InboundRecord; onClose: () => void }) {
  const history = inboundRegistry.getHistory(inbound.id);
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            History: {inbound.id}
          </CardTitle>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </CardHeader>
        <CardContent className="p-4 max-h-96 overflow-y-auto">
          {history.length > 0 ? (
            <div className="space-y-3">
              {history.map((h, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-lg text-sm">
                  <div className="flex justify-between text-slate-500 mb-1">
                    <span className="font-medium">{h.field}</span>
                    <span>{new Date(h.timestamp).toLocaleString()}</span>
                  </div>
                  <p>
                    <span className="text-red-600 line-through">{String(h.oldValue)}</span>
                    {' → '}
                    <span className="text-green-600 font-medium">{String(h.newValue)}</span>
                  </p>
                  {h.note && <p className="text-slate-600 mt-1 italic">"{h.note}"</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-8">No changes recorded</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Delete Confirmation Modal
function DeleteConfirmModal({ inbound, onConfirm, onCancel }: { 
  inbound: InboundRecord; 
  onConfirm: () => void; 
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Delete Inbound Record?</h3>
            <p className="text-sm text-slate-500 mb-4">
              This will permanently delete inbound <strong>{inbound.id}</strong> for {inbound.sku}.
              This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={onCancel}>Cancel</Button>
              <Button variant="danger" onClick={onConfirm}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Main Inbounds Page
export function Inbounds() {
  const [inbounds, setInbounds] = useState<InboundRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showBatchForm, setShowBatchForm] = useState(false);
  const [editingInbound, setEditingInbound] = useState<InboundRecord | null>(null);
  const [viewingHistory, setViewingHistory] = useState<InboundRecord | null>(null);
  const [deletingInbound, setDeletingInbound] = useState<InboundRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadInbounds();
  }, []);

  function loadInbounds() {
    setIsLoading(true);
    const data = inboundRegistry.getAll();
    data.sort((a, b) => new Date(b.dateReceived).getTime() - new Date(a.dateReceived).getTime());
    setInbounds(data);
    setIsLoading(false);
  }

  function handleDelete() {
    if (deletingInbound) {
      inboundRegistry.delete(deletingInbound.id);
      setDeletingInbound(null);
      loadInbounds();
    }
  }

  function handleExport() {
    const json = inboundRegistry.exportJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'capy-inbounds.json';
    a.click();
  }

  const stats = useMemo(() => inboundRegistry.getStats(), [inbounds]);

  const filteredInbounds = useMemo(() => {
    return inbounds.filter(i => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!i.id.toLowerCase().includes(q) && 
            !i.poNumber.toLowerCase().includes(q) && 
            !i.sku.toLowerCase().includes(q)) {
          return false;
        }
      }
      if (filterStatus !== 'all' && i.qcStatus !== filterStatus) {
        return false;
      }
      return true;
    });
  }, [inbounds, searchQuery, filterStatus]);

  // Show batch form full screen
  if (showBatchForm) {
    return (
      <BatchInboundForm
        onSave={() => { loadInbounds(); setShowBatchForm(false); }}
        onCancel={() => setShowBatchForm(false)}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header 
        title="Inbounds" 
        subtitle="Goods receiving and QC tracking"
        onRefresh={loadInbounds}
        isLoading={isLoading}
      />
      
      <div className="flex-1 overflow-y-auto p-6">
        {/* Modals */}
        {editingInbound && (
          <EditInboundModal
            inbound={editingInbound}
            onSave={() => { loadInbounds(); setEditingInbound(null); }}
            onCancel={() => setEditingInbound(null)}
          />
        )}
        {viewingHistory && (
          <HistoryModal inbound={viewingHistory} onClose={() => setViewingHistory(null)} />
        )}
        {deletingInbound && (
          <DeleteConfirmModal 
            inbound={deletingInbound}
            onConfirm={handleDelete}
            onCancel={() => setDeletingInbound(null)}
          />
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card className="bg-amber-50">
            <CardContent className="p-4">
              <p className="text-xs text-amber-600 font-medium uppercase">Total Inbounds</p>
              <p className="text-2xl font-bold text-amber-700">{stats.totalInbounds}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-slate-500 font-medium uppercase">This Month</p>
              <p className="text-2xl font-bold">{formatNumber(stats.thisMonthReceived)}</p>
              <p className="text-xs text-slate-500">{stats.thisMonthInbounds} receipts</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-green-600 font-medium uppercase">Total Good</p>
              <p className="text-2xl font-bold text-green-700">{formatNumber(stats.totalGood)}</p>
            </CardContent>
          </Card>
          <Card className={stats.totalDefective > 0 ? 'bg-red-50' : ''}>
            <CardContent className="p-4">
              <p className="text-xs text-red-600 font-medium uppercase">Total Defective</p>
              <p className="text-2xl font-bold text-red-700">{formatNumber(stats.totalDefective)}</p>
              <p className="text-xs text-red-600">{stats.defectRate}% rate</p>
            </CardContent>
          </Card>
          <Card className={stats.pendingQC > 0 ? 'bg-yellow-50' : ''}>
            <CardContent className="p-4">
              <p className="text-xs text-yellow-600 font-medium uppercase">Pending QC</p>
              <p className="text-2xl font-bold text-yellow-700">{stats.pendingQC}</p>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-[200px] max-w-md">
            <SearchInput
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search inbound ID, PO, or SKU..."
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">All QC Status</option>
            <option value="pending">⏳ Pending QC</option>
            <option value="in_progress">🔍 In Progress</option>
            <option value="complete">✅ Complete</option>
          </select>
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setShowBatchForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Log Inbound
          </Button>
        </div>

        {/* Inbounds Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-700">Inbound ID</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-700">Date</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-700">PO</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-700">SKU</th>
                  <th className="px-4 py-3 text-center font-medium text-slate-700">Received</th>
                  <th className="px-4 py-3 text-center font-medium text-slate-700">Good</th>
                  <th className="px-4 py-3 text-center font-medium text-slate-700">Defective</th>
                  <th className="px-4 py-3 text-center font-medium text-slate-700">QC Status</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredInbounds.map((inb) => (
                  <tr key={inb.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm font-medium text-amber-700">{inb.id}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{inb.dateReceived}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-slate-600">{inb.poNumber}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-mono">{inb.sku}</p>
                      {inb.productName && <p className="text-xs text-slate-500">{inb.productName}</p>}
                    </td>
                    <td className="px-4 py-3 text-center font-medium">{formatNumber(inb.qtyReceived)}</td>
                    <td className="px-4 py-3 text-center text-green-600 font-medium">{formatNumber(inb.qtyGood)}</td>
                    <td className="px-4 py-3 text-center">
                      {inb.qtyDefective > 0 ? (
                        <span className="text-red-600 font-medium">{formatNumber(inb.qtyDefective)}</span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={
                        inb.qcStatus === 'complete' ? 'success' :
                        inb.qcStatus === 'in_progress' ? 'info' : 'warning'
                      }>
                        {inb.qcStatus === 'pending' && '⏳ Pending'}
                        {inb.qcStatus === 'in_progress' && '🔍 In Progress'}
                        {inb.qcStatus === 'complete' && '✅ Complete'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewingHistory(inb)}
                          title="View history"
                        >
                          <History className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingInbound(inb)}
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingInbound(inb)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {filteredInbounds.length === 0 && !isLoading && (
          <Card className="text-center py-12 mt-4">
            <CardContent>
              <Truck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 mb-4">No inbound records found</p>
              <Button onClick={() => setShowBatchForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Log First Inbound
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Card className="mt-6">
          <CardContent className="p-6">
            <h3 className="font-semibold text-slate-900 mb-3">📦 Inbound Workflow</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="font-medium text-slate-700">1. Receive</p>
                <p className="text-slate-500">Shipment arrives, log physical count</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="font-medium text-slate-700">2. QC Inspect</p>
                <p className="text-slate-500">Check quality, count good vs defective</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="font-medium text-slate-700">3. Update</p>
                <p className="text-slate-500">Edit record if more defects found later</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="font-medium text-slate-700">4. Complete</p>
                <p className="text-slate-500">Good qty → available inventory</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
