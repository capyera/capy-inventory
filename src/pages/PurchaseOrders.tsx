import { useState, useEffect } from 'react';
import { Plus, Truck, CheckCircle, Clock, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Header } from '../components/layout/Header';
import { purchaseOrdersApi } from '../services/api';
import { formatCurrency, formatNumber } from '../lib/utils';
import type { PurchaseOrder } from '../types';

export function PurchaseOrders() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    setIsLoading(true);
    try {
      const data = await purchaseOrdersApi.getAll();
      setOrders(data);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const statusCounts = {
    draft: orders.filter(o => o.status === 'draft').length,
    sent: orders.filter(o => o.status === 'sent').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    partial: orders.filter(o => o.status === 'partial').length,
    complete: orders.filter(o => o.status === 'complete').length,
  };

  const totalPending = orders
    .filter(o => ['sent', 'confirmed', 'partial'].includes(o.status))
    .reduce((sum, o) => sum + o.totalCost, 0);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header 
        title="Purchase Orders" 
        subtitle="Manage supplier orders and track inbound inventory"
        onRefresh={loadOrders}
        isLoading={isLoading}
      />
      
      <div className="flex-1 overflow-y-auto p-6">
        {/* Quick Actions */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-3">
            <StatusBadge icon={<Clock />} label="Draft" count={statusCounts.draft} color="gray" />
            <StatusBadge icon={<Truck />} label="In Transit" count={statusCounts.confirmed + statusCounts.sent} color="blue" />
            <StatusBadge icon={<Package />} label="Partial" count={statusCounts.partial} color="yellow" />
            <StatusBadge icon={<CheckCircle />} label="Complete" count={statusCounts.complete} color="green" />
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create PO
          </Button>
        </div>

        {/* Summary Card */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Total Value in Transit</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalPending)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Active Purchase Orders</p>
                <p className="text-2xl font-bold text-gray-900">{orders.filter(o => o.status !== 'complete' && o.status !== 'cancelled').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PO Table */}
        <Card>
          <CardHeader>
            <CardTitle>Purchase Orders</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="text-right">Total Cost</TableHead>
                  <TableHead>Expected Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id} onClick={() => setSelectedOrder(order)}>
                    <TableCell className="font-mono font-medium">{order.poNumber}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{order.supplier.name}</p>
                        <p className="text-xs text-gray-500">{order.supplier.code}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Package className="w-4 h-4 text-gray-400" />
                        <span>{order.items.length} items</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(order.totalCost)}</TableCell>
                    <TableCell>{order.expectedDate.toLocaleDateString()}</TableCell>
                    <TableCell>
                      <POStatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="text-gray-500">{order.createdAt.toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Order Detail Modal */}
        {selectedOrder && (
          <PODetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
        )}
      </div>
    </div>
  );
}

function StatusBadge({ icon, label, count, color }: { 
  icon: React.ReactNode; 
  label: string; 
  count: number;
  color: 'gray' | 'blue' | 'yellow' | 'green';
}) {
  const colors = {
    gray: 'bg-gray-100 text-gray-600',
    blue: 'bg-blue-100 text-blue-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    green: 'bg-green-100 text-green-600',
  };
  
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${colors[color]}`}>
      <span className="w-4 h-4">{icon}</span>
      <span className="text-sm font-medium">{label}</span>
      <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">{count}</span>
    </div>
  );
}

function POStatusBadge({ status }: { status: PurchaseOrder['status'] }) {
  const config: Record<PurchaseOrder['status'], { variant: 'default' | 'info' | 'warning' | 'success' | 'danger'; label: string }> = {
    draft: { variant: 'default', label: 'Draft' },
    sent: { variant: 'info', label: 'Sent' },
    confirmed: { variant: 'info', label: 'Confirmed' },
    partial: { variant: 'warning', label: 'Partial' },
    complete: { variant: 'success', label: 'Complete' },
    cancelled: { variant: 'danger', label: 'Cancelled' },
  };
  
  return <Badge variant={config[status].variant}>{config[status].label}</Badge>;
}

function PODetailModal({ order, onClose }: { order: PurchaseOrder; onClose: () => void }) {
  const totalOrdered = order.items.reduce((sum, i) => sum + i.quantityOrdered, 0);
  const totalReceived = order.items.reduce((sum, i) => sum + i.quantityReceived, 0);
  const progress = totalOrdered > 0 ? (totalReceived / totalOrdered) * 100 : 0;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <Card className="w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e?.stopPropagation()}>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle>{order.poNumber}</CardTitle>
            <p className="text-sm text-gray-500">{order.supplier.name}</p>
          </div>
          <POStatusBadge status={order.status} />
        </CardHeader>
        <CardContent>
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-500">Receiving Progress</span>
              <span className="font-medium">{progress.toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-amber-500 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{formatNumber(totalReceived)} received</span>
              <span>{formatNumber(totalOrdered)} ordered</span>
            </div>
          </div>
          
          {/* Order Info */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-500">Expected Date</p>
              <p className="font-medium">{order.expectedDate.toLocaleDateString()}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-500">Total Cost</p>
              <p className="font-medium">{formatCurrency(order.totalCost)}</p>
            </div>
          </div>
          
          {/* Line Items */}
          <p className="text-sm font-medium text-gray-700 mb-2">Line Items</p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Ordered</TableHead>
                <TableHead className="text-right">Received</TableHead>
                <TableHead className="text-right">Remaining</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item, i) => (
                <TableRow key={i}>
                  <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell className="text-right">{formatNumber(item.quantityOrdered)}</TableCell>
                  <TableCell className="text-right text-green-600">{formatNumber(item.quantityReceived)}</TableCell>
                  <TableCell className="text-right">
                    {item.quantityOrdered - item.quantityReceived > 0 ? (
                      <span className="text-orange-600">{formatNumber(item.quantityOrdered - item.quantityReceived)}</span>
                    ) : (
                      <span className="text-green-600">✓</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          <div className="mt-6 flex gap-3">
            <Button variant="primary" className="flex-1">
              Log Receipt
            </Button>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
