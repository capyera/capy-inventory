import { useState } from 'react';
import { 
  Warehouse as WarehouseIcon, 
  MapPin, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2,
  ArrowRight,
  Package,
  TrendingUp,
  Clock,
  Plus,
  X,
  Send
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Header } from '../components/layout/Header';
import { formatNumber, cn } from '../lib/utils';
import type { Warehouse, WarehouseInventory, WarehouseTransfer, StockStatus } from '../types/warehouse';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

// Mock Warehouses
const warehouses: Warehouse[] = [
  { 
    id: 'mars', 
    code: 'mars',
    name: 'Mars Warehouse', 
    location: 'Kuala Lumpur, Malaysia', 
    type: 'primary',
    leadTimeDays: 2,
    isActive: true,
    capabilities: ['shopify_fulfillment', 'b2b_wholesale', 'international'],
    costPerUnit: 0.85,
    apiConnected: true,
    lastSyncAt: new Date(Date.now() - 15 * 60 * 1000), // 15 min ago
  },
  { 
    id: 'fba-us', 
    code: 'fba',
    name: 'Amazon FBA US', 
    location: 'United States', 
    type: 'marketplace',
    leadTimeDays: 1,
    isActive: true,
    capabilities: ['amazon_fba'],
    costPerUnit: 3.25,
    apiConnected: true,
    lastSyncAt: new Date(Date.now() - 45 * 60 * 1000), // 45 min ago
  },
  { 
    id: 'tts-my', 
    code: 'tts',
    name: 'TikTok Shop MY', 
    location: 'Malaysia', 
    type: 'marketplace',
    leadTimeDays: 1,
    isActive: true,
    capabilities: ['tiktok_fulfillment'],
    costPerUnit: 1.50,
    apiConnected: true,
    lastSyncAt: new Date(Date.now() - 30 * 60 * 1000), // 30 min ago
  },
  { 
    id: 'tts-us', 
    code: 'tts',
    name: 'TikTok Shop US', 
    location: 'United States', 
    type: 'marketplace',
    leadTimeDays: 1,
    isActive: false,
    capabilities: ['tiktok_fulfillment'],
    costPerUnit: 2.80,
    apiConnected: false,
    lastSyncAt: undefined,
  },
];

// Mock Inventory Per Warehouse
const warehouseInventory: WarehouseInventory[] = [
  // Mars Warehouse
  { id: 'mars-cherry', sku: 'OG-M-009', productName: 'Cherry Capybara 10"', warehouseId: 'mars', warehouseCode: 'mars', quantity: 1250, reservedQty: 85, availableQty: 1165, inboundQty: 500, velocity3d: 38, velocity7d: 40, velocity14d: 41, velocity30d: 42, daysOfStock: 28, reorderPoint: 420, stockStatus: 'good', lastUpdated: new Date() },
  { id: 'mars-strawberry', sku: 'OG-M-002', productName: 'Strawberry Capybara 10"', warehouseId: 'mars', warehouseCode: 'mars', quantity: 890, reservedQty: 45, availableQty: 845, inboundQty: 300, velocity3d: 32, velocity7d: 34, velocity14d: 35, velocity30d: 35, daysOfStock: 25, reorderPoint: 350, stockStatus: 'good', lastUpdated: new Date() },
  { id: 'mars-matcha', sku: 'OG-M-007', productName: 'Matcha Capybara 10"', warehouseId: 'mars', warehouseCode: 'mars', quantity: 540, reservedQty: 20, availableQty: 520, inboundQty: 0, velocity3d: 28, velocity7d: 26, velocity14d: 25, velocity30d: 25, daysOfStock: 21, reorderPoint: 250, stockStatus: 'good', lastUpdated: new Date() },
  { id: 'mars-blueberry', sku: 'OG-M-008', productName: 'Blueberry Capybara 10"', warehouseId: 'mars', warehouseCode: 'mars', quantity: 380, reservedQty: 15, availableQty: 365, inboundQty: 200, velocity3d: 25, velocity7d: 23, velocity14d: 22, velocity30d: 22, daysOfStock: 17, reorderPoint: 220, stockStatus: 'watch', lastUpdated: new Date() },
  { id: 'mars-violet', sku: 'OG-M-005', productName: 'Violet Capybara 10"', warehouseId: 'mars', warehouseCode: 'mars', quantity: 75, reservedQty: 5, availableQty: 70, inboundQty: 0, velocity3d: 14, velocity7d: 13, velocity14d: 12, velocity30d: 12, daysOfStock: 6, reorderPoint: 120, stockStatus: 'critical', lastUpdated: new Date() },
  { id: 'mars-lily', sku: 'OG-M-006', productName: 'Lily Capybara 10"', warehouseId: 'mars', warehouseCode: 'mars', quantity: 45, reservedQty: 8, availableQty: 37, inboundQty: 0, velocity3d: 12, velocity7d: 11, velocity14d: 10, velocity30d: 10, daysOfStock: 4, reorderPoint: 100, stockStatus: 'critical', lastUpdated: new Date() },
  
  // Amazon FBA US
  { id: 'fba-cherry', sku: 'OG-M-009', productName: 'Cherry Capybara 10"', warehouseId: 'fba-us', warehouseCode: 'fba', quantity: 420, reservedQty: 35, availableQty: 385, inboundQty: 200, fbaInboundWorking: 0, fbaInboundShipped: 200, fbaInboundReceiving: 0, velocity3d: 18, velocity7d: 16, velocity14d: 15, velocity30d: 15, daysOfStock: 26, reorderPoint: 150, stockStatus: 'good', lastUpdated: new Date() },
  { id: 'fba-strawberry', sku: 'OG-M-002', productName: 'Strawberry Capybara 10"', warehouseId: 'fba-us', warehouseCode: 'fba', quantity: 280, reservedQty: 20, availableQty: 260, inboundQty: 0, velocity3d: 14, velocity7d: 12, velocity14d: 12, velocity30d: 12, daysOfStock: 22, reorderPoint: 120, stockStatus: 'good', lastUpdated: new Date() },
  { id: 'fba-matcha', sku: 'OG-M-007', productName: 'Matcha Capybara 10"', warehouseId: 'fba-us', warehouseCode: 'fba', quantity: 85, reservedQty: 10, availableQty: 75, inboundQty: 0, velocity3d: 10, velocity7d: 9, velocity14d: 8, velocity30d: 8, daysOfStock: 9, reorderPoint: 80, stockStatus: 'low', lastUpdated: new Date() },
  { id: 'fba-blueberry', sku: 'OG-M-008', productName: 'Blueberry Capybara 10"', warehouseId: 'fba-us', warehouseCode: 'fba', quantity: 45, reservedQty: 5, availableQty: 40, inboundQty: 150, velocity3d: 8, velocity7d: 7, velocity14d: 7, velocity30d: 7, daysOfStock: 6, reorderPoint: 70, stockStatus: 'critical', lastUpdated: new Date() },
  
  // TikTok Shop MY
  { id: 'tts-my-cherry', sku: 'OG-M-009', productName: 'Cherry Capybara 10"', warehouseId: 'tts-my', warehouseCode: 'tts', quantity: 185, reservedQty: 12, availableQty: 173, inboundQty: 0, velocity3d: 22, velocity7d: 20, velocity14d: 18, velocity30d: 18, daysOfStock: 10, reorderPoint: 180, stockStatus: 'low', lastUpdated: new Date() },
  { id: 'tts-my-strawberry', sku: 'OG-M-002', productName: 'Strawberry Capybara 10"', warehouseId: 'tts-my', warehouseCode: 'tts', quantity: 120, reservedQty: 8, availableQty: 112, inboundQty: 100, velocity3d: 15, velocity7d: 14, velocity14d: 12, velocity30d: 12, daysOfStock: 9, reorderPoint: 120, stockStatus: 'low', lastUpdated: new Date() },
  { id: 'tts-my-matcha', sku: 'OG-M-007', productName: 'Matcha Capybara 10"', warehouseId: 'tts-my', warehouseCode: 'tts', quantity: 95, reservedQty: 5, availableQty: 90, inboundQty: 0, velocity3d: 12, velocity7d: 10, velocity14d: 10, velocity30d: 10, daysOfStock: 9, reorderPoint: 100, stockStatus: 'low', lastUpdated: new Date() },
];

// Mock Pending Transfers
const pendingTransfers: WarehouseTransfer[] = [
  { id: 'tr-001', fromWarehouse: 'mars', toWarehouse: 'fba', sku: 'OG-M-007', productName: 'Matcha Capybara 10"', quantity: 200, status: 'in_transit', reason: 'fba_replenishment', estimatedArrival: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), cost: 450 },
  { id: 'tr-002', fromWarehouse: 'mars', toWarehouse: 'fba', sku: 'OG-M-008', productName: 'Blueberry Capybara 10"', quantity: 150, status: 'pending', reason: 'stockout_prevention', estimatedArrival: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), createdAt: new Date(), cost: 340 },
  { id: 'tr-003', fromWarehouse: 'mars', toWarehouse: 'tts', sku: 'OG-M-009', productName: 'Cherry Capybara 10"', quantity: 100, status: 'pending', reason: 'rebalance', estimatedArrival: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), createdAt: new Date(), cost: 85 },
];

const statusColors: Record<StockStatus, string> = {
  out_of_stock: 'bg-gray-100 text-gray-700',
  critical: 'bg-red-100 text-red-700',
  low: 'bg-orange-100 text-orange-700',
  watch: 'bg-yellow-100 text-yellow-700',
  good: 'bg-green-100 text-green-700',
  overstock: 'bg-blue-100 text-blue-700',
};

const statusLabels: Record<StockStatus, string> = {
  out_of_stock: 'Out of Stock',
  critical: 'Critical',
  low: 'Low',
  watch: 'Watch',
  good: 'Good',
  overstock: 'Overstock',
};

export function Warehouses() {
  const [selectedWarehouse, setSelectedWarehouse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);

  const activeWarehouses = warehouses.filter(w => w.isActive);
  
  // Calculate cross-warehouse totals
  const crossWarehouseTotals = warehouseInventory.reduce((acc, inv) => {
    if (!acc[inv.sku]) {
      acc[inv.sku] = {
        sku: inv.sku,
        productName: inv.productName,
        totalQty: 0,
        totalAvailable: 0,
        totalInbound: 0,
        warehouses: {} as Record<string, number>,
      };
    }
    acc[inv.sku].totalQty += inv.quantity;
    acc[inv.sku].totalAvailable += inv.availableQty;
    acc[inv.sku].totalInbound += inv.inboundQty;
    acc[inv.sku].warehouses[inv.warehouseId] = inv.quantity;
    return acc;
  }, {} as Record<string, { sku: string; productName: string; totalQty: number; totalAvailable: number; totalInbound: number; warehouses: Record<string, number> }>);
  
  const totalsArray = Object.values(crossWarehouseTotals);
  
  // Calculate warehouse stats for chart
  const warehouseChartData = activeWarehouses.map(w => {
    const inv = warehouseInventory.filter(i => i.warehouseId === w.id);
    return {
      name: w.name.split(' ')[0],
      units: inv.reduce((s, i) => s + i.quantity, 0),
      skus: inv.length,
    };
  });

  const selectedWarehouseInventory = selectedWarehouse
    ? warehouseInventory.filter(i => i.warehouseId === selectedWarehouse)
    : [];

  async function handleRefresh() {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setIsLoading(false);
  }

  function getTimeSince(date?: Date): string {
    if (!date) return 'Never';
    const mins = Math.floor((Date.now() - date.getTime()) / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header 
        title="Warehouses" 
        subtitle="Multi-location inventory management"
        onRefresh={handleRefresh}
        isLoading={isLoading}
      />
      
      <div className="flex-1 overflow-y-auto p-6">
        {/* Warehouse Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {warehouses.map((warehouse) => {
            const inv = warehouseInventory.filter(i => i.warehouseId === warehouse.id);
            const totalUnits = inv.reduce((s, i) => s + i.quantity, 0);
            const criticalCount = inv.filter(i => i.stockStatus === 'critical' || i.stockStatus === 'low').length;
            
            return (
              <Card 
                key={warehouse.id}
                className={cn(
                  "cursor-pointer transition-all",
                  selectedWarehouse === warehouse.id ? "ring-2 ring-amber-500" : "",
                  !warehouse.isActive && "opacity-60"
                )}
                onClick={() => setSelectedWarehouse(
                  selectedWarehouse === warehouse.id ? null : warehouse.id
                )}
              >
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      warehouse.type === 'primary' ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
                    )}>
                      <WarehouseIcon className="w-5 h-5" />
                    </div>
                    <div className="flex items-center gap-2">
                      {warehouse.apiConnected ? (
                        <span className="flex items-center gap-1 text-xs text-green-600">
                          <CheckCircle2 className="w-3 h-3" />
                          Connected
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <AlertCircle className="w-3 h-3" />
                          Offline
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <h3 className="font-semibold text-gray-900">{warehouse.name}</h3>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" />
                    {warehouse.location}
                  </p>
                  
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-lg font-bold text-gray-900">{formatNumber(totalUnits)}</p>
                      <p className="text-xs text-gray-500">Units</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900">{inv.length}</p>
                      <p className="text-xs text-gray-500">SKUs</p>
                    </div>
                  </div>
                  
                  {criticalCount > 0 && (
                    <div className="mt-3 p-2 bg-red-50 rounded-lg flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span className="text-xs text-red-700">{criticalCount} SKUs need attention</span>
                    </div>
                  )}
                  
                  <div className="mt-3 pt-3 border-t flex items-center justify-between">
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3" />
                      {getTimeSince(warehouse.lastSyncAt)}
                    </span>
                    <Badge variant={warehouse.type === 'primary' ? 'warning' : 'info'}>
                      {warehouse.type}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Warehouse Units Chart */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Inventory Distribution</CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowTransferModal(true)}
              >
                <Plus className="w-4 h-4 mr-1" />
                Create Transfer
              </Button>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={warehouseChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={100} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px'
                      }}
                      formatter={(value) => [formatNumber(Number(value)), 'Units']}
                    />
                    <Bar dataKey="units" fill="#8B4513" radius={[0, 4, 4, 0]}>
                      {warehouseChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#8B4513' : '#D2691E'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Pending Transfers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="w-5 h-5 text-gray-400" />
                Pending Transfers
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {pendingTransfers.map(transfer => {
                  const fromWh = warehouses.find(w => w.code === transfer.fromWarehouse);
                  const toWh = warehouses.find(w => w.code === transfer.toWarehouse);
                  return (
                    <div key={transfer.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <span>{fromWh?.name.split(' ')[0]}</span>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                        <span>{toWh?.name.split(' ')[0]}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{transfer.productName}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-medium">{formatNumber(transfer.quantity)} units</span>
                        <Badge variant={transfer.status === 'in_transit' ? 'info' : 'default'}>
                          {transfer.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      {transfer.estimatedArrival && (
                        <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          ETA: {transfer.estimatedArrival.toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Selected Warehouse Inventory */}
        {selectedWarehouse && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-gray-400" />
                {warehouses.find(w => w.id === selectedWarehouse)?.name} Inventory
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">On Hand</TableHead>
                    <TableHead className="text-right">Reserved</TableHead>
                    <TableHead className="text-right">Available</TableHead>
                    <TableHead className="text-right">Inbound</TableHead>
                    <TableHead className="text-right">Velocity</TableHead>
                    <TableHead className="text-right">Days Left</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedWarehouseInventory.map(inv => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-mono text-xs">{inv.sku}</TableCell>
                      <TableCell className="max-w-[150px] truncate">{inv.productName}</TableCell>
                      <TableCell className="text-right font-medium">{formatNumber(inv.quantity)}</TableCell>
                      <TableCell className="text-right text-gray-500">{formatNumber(inv.reservedQty)}</TableCell>
                      <TableCell className="text-right text-green-600 font-medium">{formatNumber(inv.availableQty)}</TableCell>
                      <TableCell className="text-right">
                        {inv.inboundQty > 0 ? (
                          <span className="text-blue-600">+{formatNumber(inv.inboundQty)}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-medium">{inv.velocity7d.toFixed(1)}</span>
                        <span className="text-gray-500 text-xs">/day</span>
                      </TableCell>
                      <TableCell className={cn(
                        "text-right font-medium",
                        inv.daysOfStock <= 7 ? "text-red-600" : inv.daysOfStock <= 14 ? "text-yellow-600" : "text-green-600"
                      )}>
                        {inv.daysOfStock}d
                      </TableCell>
                      <TableCell>
                        <span className={cn("px-2 py-1 rounded-full text-xs font-medium", statusColors[inv.stockStatus])}>
                          {statusLabels[inv.stockStatus]}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Cross-Warehouse Totals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-gray-400" />
              Cross-Warehouse Inventory Totals
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Mars</TableHead>
                  <TableHead className="text-right">FBA US</TableHead>
                  <TableHead className="text-right">TikTok MY</TableHead>
                  <TableHead className="text-right">Total Stock</TableHead>
                  <TableHead className="text-right">Total Available</TableHead>
                  <TableHead className="text-right">Total Inbound</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {totalsArray.map(item => (
                  <TableRow key={item.sku}>
                    <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                    <TableCell className="max-w-[150px] truncate">{item.productName}</TableCell>
                    <TableCell className="text-right">{item.warehouses['mars'] ? formatNumber(item.warehouses['mars']) : '-'}</TableCell>
                    <TableCell className="text-right">{item.warehouses['fba-us'] ? formatNumber(item.warehouses['fba-us']) : '-'}</TableCell>
                    <TableCell className="text-right">{item.warehouses['tts-my'] ? formatNumber(item.warehouses['tts-my']) : '-'}</TableCell>
                    <TableCell className="text-right font-bold">{formatNumber(item.totalQty)}</TableCell>
                    <TableCell className="text-right text-green-600 font-medium">{formatNumber(item.totalAvailable)}</TableCell>
                    <TableCell className="text-right">
                      {item.totalInbound > 0 ? (
                        <span className="text-blue-600">+{formatNumber(item.totalInbound)}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Transfer Modal Placeholder */}
        {showTransferModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Create Transfer</h3>
                <button onClick={() => setShowTransferModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From Warehouse</label>
                  <select className="w-full border rounded-lg p-2">
                    {activeWarehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To Warehouse</label>
                  <select className="w-full border rounded-lg p-2">
                    {activeWarehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                  <select className="w-full border rounded-lg p-2">
                    {Array.from(new Set(warehouseInventory.map(i => i.sku))).map(sku => (
                      <option key={sku} value={sku}>{sku}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input type="number" className="w-full border rounded-lg p-2" placeholder="Enter quantity" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                  <select className="w-full border rounded-lg p-2">
                    <option value="fba_replenishment">FBA Replenishment</option>
                    <option value="stockout_prevention">Stockout Prevention</option>
                    <option value="rebalance">Inventory Rebalance</option>
                    <option value="seasonal_prep">Seasonal Prep</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button variant="outline" className="flex-1" onClick={() => setShowTransferModal(false)}>
                    Cancel
                  </Button>
                  <Button className="flex-1" onClick={() => setShowTransferModal(false)}>
                    Create Transfer
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
