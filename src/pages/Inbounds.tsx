import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Edit2, Trash2, Package, Truck, AlertTriangle, Check, 
  X, ChevronDown, ChevronRight, History, Download
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input, SearchInput } from '../components/ui/Input';
import { Header } from '../components/layout/Header';
import { inboundRegistry, InboundRecord } from '../services/inboundRegistry';
import { poRegistry } from '../services/poRegistry';
import { formatNumber } from '../lib/utils';

// Inbound Form Modal
interface InboundFormProps {
  inbound?: InboundRecord;
  onSave: () => void;
  onCancel: () => void;
}

function InboundFormModal({ inbound, onSave, onCancel }: InboundFormProps) {
  const [selectedPO, setSelectedPO] = useState(inbound?.poNumber || '');
  const [selectedSku, setSelectedSku] = useState(inbound?.sku || '');
  const [dateReceived, setDateReceived] = useState(inbound?.dateReceived || new Date().toISOString().split('T')[0]);
  const [qtyReceived, setQtyReceived] = useState(inbound?.qtyReceived?.toString() || '');
  const [qtyGood, setQtyGood] = useState(inbound?.qtyGood?.toString() || '');
  const [qtyDefective, setQtyDefective] = useState(inbound?.qtyDefective?.toString() || '0');
  const [defectNotes, setDefectNotes] = useState(inbound?.defectNotes || '');
  const [qcStatus, setQcStatus] = useState<'pending' | 'in_progress' | 'complete'>(inbound?.qcStatus || 'pending');
  const [notes, setNotes] = useState(inbound?.notes || '');
  const [updateNote, setUpdateNote] = useState('');

  const isEditing = !!inbound;

  // Get PO summary for dropdown
  const poSummary = useMemo(() => poRegistry.getPOSummary(), []);
  
  // Get SKUs for selected PO
  const poSkus = useMemo(() => {
    if (!selectedPO) return [];
    const lines = poRegistry.getByPONumber(selectedPO);
    const received = inboundRegistry.getTotalReceivedForPO(selectedPO);
    
    return lines.map(line => {
      const rec = received.get(line.sku) || { received: 0, good: 0, defective: 0 };
      return {
        sku: line.sku,
        ordered: line.qtyOrdered,
        alreadyReceived: rec.received,
        remaining: line.qtyOrdered - rec.received,
      };
    });
  }, [selectedPO]);

  const selectedPOData = poSummary.find(p => p.poNumber === selectedPO);
  const selectedSkuData = poSkus.find(s => s.sku === selectedSku);

  // Auto-calculate good qty when received changes
  useEffect(() => {
    if (!isEditing && qtyReceived && !qtyGood) {
      const received = parseInt(qtyReceived) || 0;
      const defective = parseInt(qtyDefective) || 0;
      setQtyGood((received - defective).toString());
    }
  }, [qtyReceived, qtyDefective, isEditing, qtyGood]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const received = parseInt(qtyReceived) || 0;
    const good = parseInt(qtyGood) || 0;
    const defective = parseInt(qtyDefective) || 0;

    if (isEditing && inbound) {
      inboundRegistry.update(inbound.id, {
        qtyReceived: received,
        qtyGood: good,
        qtyDefective: defective,
        defectNotes: defectNotes || undefined,
        qcStatus,
        qcDate: qcStatus === 'complete' ? new Date().toISOString().split('T')[0] : undefined,
        notes: notes || undefined,
      }, updateNote || undefined);
    } else {
      const poLine = poRegistry.getByPONumber(selectedPO).find(l => l.sku === selectedSku);
      inboundRegistry.create({
        poNumber: selectedPO,
        sku: selectedSku,
        productName: poLine?.productName,
        supplierCode: selectedPOData?.supplierCode || '',
        supplierName: selectedPOData?.supplierName || '',
        warehouseId: 'speedfulfill-cn', // Default warehouse
        dateReceived,
        qtyReceived: received,
        qtyGood: good,
        qtyDefective: defective,
        defectNotes: defectNotes || undefined,
        qcStatus,
        notes: notes || undefined,
      });
    }
    
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between border-b flex-shrink-0">
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-600" />
            {isEditing ? `Edit Inbound ${inbound.id}` : 'Log New Inbound'}
          </CardTitle>
          <button onClick={onCancel} className="p-1 hover:bg-slate-100 rounded">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </CardHeader>
        <CardContent className="overflow-y-auto flex-1 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isEditing ? (
              <>
                {/* PO Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Purchase Order *</label>
                    <select
                      value={selectedPO}
                      onChange={(e) => { setSelectedPO(e.target.value); setSelectedSku(''); }}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      required
                    >
                      <option value="">Select PO...</option>
                      {poSummary.filter(p => p.status !== 'Complete').map(po => (
                        <option key={po.poNumber} value={po.poNumber}>
                          {po.poNumber} - {po.supplierName} ({po.totalRemaining} remaining)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Date Received *</label>
                    <Input
                      type="date"
                      value={dateReceived}
                      onChange={(e) => setDateReceived(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* SKU Selection */}
                {selectedPO && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">SKU *</label>
                    <select
                      value={selectedSku}
                      onChange={(e) => setSelectedSku(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      required
                    >
                      <option value="">Select SKU...</option>
                      {poSkus.filter(s => s.remaining > 0).map(sku => (
                        <option key={sku.sku} value={sku.sku}>
                          {sku.sku} - Ordered: {formatNumber(sku.ordered)}, Remaining: {formatNumber(sku.remaining)}
                        </option>
                      ))}
                    </select>
                    {selectedSkuData && (
                      <p className="text-xs text-slate-500 mt-1">
                        Already received: {formatNumber(selectedSkuData.alreadyReceived)} of {formatNumber(selectedSkuData.ordered)}
                      </p>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-sm"><strong>PO:</strong> {inbound?.poNumber}</p>
                <p className="text-sm"><strong>SKU:</strong> {inbound?.sku}</p>
                <p className="text-sm"><strong>Date:</strong> {inbound?.dateReceived}</p>
              </div>
            )}

            {/* Quantities */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Qty Received *</label>
                <Input
                  type="number"
                  min="0"
                  value={qtyReceived}
                  onChange={(e) => setQtyReceived(e.target.value)}
                  placeholder="0"
                  required
                />
                <p className="text-xs text-slate-500 mt-1">Physical count</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Qty Good (QC Passed)</label>
                <Input
                  type="number"
                  min="0"
                  value={qtyGood}
                  onChange={(e) => setQtyGood(e.target.value)}
                  placeholder="0"
                  className="border-green-300 focus:border-green-500"
                />
                <p className="text-xs text-green-600 mt-1">→ Inventory</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Qty Defective</label>
                <Input
                  type="number"
                  min="0"
                  value={qtyDefective}
                  onChange={(e) => setQtyDefective(e.target.value)}
                  placeholder="0"
                  className="border-red-300 focus:border-red-500"
                />
                <p className="text-xs text-red-600 mt-1">Failed QC</p>
              </div>
            </div>

            {/* Defect Notes */}
            {(parseInt(qtyDefective) || 0) > 0 && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Defect Notes</label>
                <Input
                  value={defectNotes}
                  onChange={(e) => setDefectNotes(e.target.value)}
                  placeholder="Describe defects (damage, wrong color, quality issue...)"
                />
              </div>
            )}

            {/* QC Status */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">QC Status</label>
              <div className="flex gap-2">
                {(['pending', 'in_progress', 'complete'] as const).map(status => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setQcStatus(status)}
                    className={`px-3 py-2 rounded-lg text-sm border ${
                      qcStatus === status 
                        ? 'bg-amber-100 border-amber-300 text-amber-800' 
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {status === 'pending' && '⏳ Pending QC'}
                    {status === 'in_progress' && '🔍 QC In Progress'}
                    {status === 'complete' && '✅ QC Complete'}
                  </button>
                ))}
              </div>
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

            {/* Update Note (for edits) */}
            {isEditing && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Update Reason</label>
                <Input
                  value={updateNote}
                  onChange={(e) => setUpdateNote(e.target.value)}
                  placeholder="Why are you updating this? (optional)"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
              <Button type="submit" disabled={!isEditing && (!selectedPO || !selectedSku || !qtyReceived)}>
                {isEditing ? 'Update Inbound' : 'Log Inbound'}
              </Button>
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

export function Inbounds() {
  const [inbounds, setInbounds] = useState<InboundRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingInbound, setEditingInbound] = useState<InboundRecord | null>(null);
  const [viewingHistory, setViewingHistory] = useState<InboundRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [expandedInbounds, setExpandedInbounds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadInbounds();
  }, []);

  function loadInbounds() {
    setIsLoading(true);
    const data = inboundRegistry.getAll();
    // Sort by date descending
    data.sort((a, b) => new Date(b.dateReceived).getTime() - new Date(a.dateReceived).getTime());
    setInbounds(data);
    setIsLoading(false);
  }

  function handleDelete(id: string) {
    if (confirm('Delete this inbound record?')) {
      inboundRegistry.delete(id);
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
        {(showForm || editingInbound) && (
          <InboundFormModal
            inbound={editingInbound || undefined}
            onSave={() => { loadInbounds(); setShowForm(false); setEditingInbound(null); }}
            onCancel={() => { setShowForm(false); setEditingInbound(null); }}
          />
        )}
        {viewingHistory && (
          <HistoryModal inbound={viewingHistory} onClose={() => setViewingHistory(null)} />
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
          <Button onClick={() => setShowForm(true)}>
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
                          onClick={() => handleDelete(inb.id)}
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
              <Button onClick={() => setShowForm(true)}>
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
