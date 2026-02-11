import React, { useState, useEffect, useMemo } from 'react';
import { Trash2, Upload, Download, ChevronDown, ChevronRight, Truck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { SearchInput } from '../components/ui/Input';
import { Header } from '../components/layout/Header';
import { poRegistry, POLineData } from '../services/poRegistry';
import { formatNumber } from '../lib/utils';

// Mars Sheet PO data for import
const MARS_POS: Array<{
  poNumber: string;
  supplierCode: string;
  supplierName: string;
  sku: string;
  qtyOrdered: number;
  qtyReceived: number;
  qtyRemaining: number;
  status: string;
}> = [
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

export function PurchaseOrders() {
  const [poLines, setPOLines] = useState<POLineData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPOs, setExpandedPOs] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<string>('all');

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
    if (confirm('Delete ALL purchase orders? This cannot be undone.')) {
      poRegistry.deleteAll();
      loadPOs();
    }
  }

  function handleDeletePO(poNumber: string) {
    if (confirm(`Delete PO ${poNumber} and all its lines?`)) {
      poRegistry.deletePO(poNumber);
      loadPOs();
    }
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
    // Filter
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
            <Button variant="outline" onClick={handleDeleteAll} className="text-red-600 hover:bg-red-50">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete All
            </Button>
          )}
        </div>

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
                            onClick={() => handleDeletePO(po.poNumber)}
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

        {poSummary.length === 0 && !isLoading && (
          <Card className="text-center py-12 mt-4">
            <CardContent>
              <Truck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 mb-4">No purchase orders found</p>
              <Button onClick={handleImportMars}>
                <Upload className="w-4 h-4 mr-2" />
                Import from Mars Sheet
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
