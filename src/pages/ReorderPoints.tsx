import { useState, useEffect } from 'react';
import { AlertTriangle, Settings, ShoppingCart, Clock, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Header } from '../components/layout/Header';
import { inventoryApi } from '../services/api';
import { formatNumber, cn } from '../lib/utils';
import type { InventoryItem } from '../types';

export function ReorderPoints() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [leadTimeDays, setLeadTimeDays] = useState(21);
  const [safetyStockDays, setSafetyStockDays] = useState(7);

  useEffect(() => {
    loadInventory();
  }, []);

  async function loadInventory() {
    setIsLoading(true);
    try {
      const data = await inventoryApi.getAll();
      setInventory(data);
    } catch (error) {
      console.error('Failed to load inventory:', error);
    } finally {
      setIsLoading(false);
    }
  }

  // Calculate reorder points based on velocity and lead time
  const reorderAnalysis = inventory.map(item => {
    const dailyVelocity = item.velocity30d;
    const reorderPoint = Math.ceil(dailyVelocity * (leadTimeDays + safetyStockDays));
    const suggestedOrderQty = Math.ceil(dailyVelocity * 30); // 30 days of stock
    const daysUntilReorder = dailyVelocity > 0 
      ? Math.max(0, Math.floor((item.currentQty - reorderPoint) / dailyVelocity))
      : 999;
    const needsReorder = item.currentQty <= reorderPoint;
    
    return {
      ...item,
      reorderPoint,
      suggestedOrderQty,
      daysUntilReorder,
      needsReorder,
    };
  }).sort((a, b) => a.daysUntilReorder - b.daysUntilReorder);

  const needsReorderCount = reorderAnalysis.filter(r => r.needsReorder).length;
  const urgentCount = reorderAnalysis.filter(r => r.daysUntilReorder < 7).length;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header 
        title="Smart Reorder Points" 
        subtitle="AI-powered reorder suggestions based on velocity and lead time"
        onRefresh={loadInventory}
        isLoading={isLoading}
      />
      
      <div className="flex-1 overflow-y-auto p-6">
        {/* Config Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-gray-400" />
              Reorder Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Default Lead Time (days)
                </label>
                <input
                  type="number"
                  value={leadTimeDays}
                  onChange={(e) => setLeadTimeDays(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Safety Stock (days)
                </label>
                <input
                  type="number"
                  value={safetyStockDays}
                  onChange={(e) => setSafetyStockDays(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="flex items-end">
                <div className="bg-amber-50 p-3 rounded-lg flex-1">
                  <p className="text-xs text-amber-600">Reorder Point Formula</p>
                  <p className="text-sm font-medium">Velocity × (Lead Time + Safety)</p>
                </div>
              </div>
              <div className="flex items-end">
                <Button variant="primary" className="w-full">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Create POs for All
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-50 text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{needsReorderCount}</p>
                  <p className="text-sm text-gray-500">Need to reorder now</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-50 text-orange-600">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{urgentCount}</p>
                  <p className="text-sm text-gray-500">Urgent (&lt; 7 days)</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-50 text-green-600">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{inventory.length - needsReorderCount}</p>
                  <p className="text-sm text-gray-500">Healthy stock</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reorder Queue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Reorder Queue</CardTitle>
            <div className="flex gap-2">
              <Badge variant="danger">{needsReorderCount} need reorder</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Priority</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Current Qty</TableHead>
                  <TableHead className="text-right">Velocity</TableHead>
                  <TableHead className="text-right">Reorder Point</TableHead>
                  <TableHead className="text-right">Days Until Reorder</TableHead>
                  <TableHead className="text-right">Suggested Qty</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reorderAnalysis.slice(0, 20).map((item, index) => (
                  <TableRow 
                    key={item.sku}
                    className={cn(
                      item.needsReorder && 'bg-red-50/50',
                      item.daysUntilReorder < 7 && !item.needsReorder && 'bg-orange-50/50'
                    )}
                  >
                    <TableCell>
                      {item.needsReorder ? (
                        <Badge variant="danger">NOW</Badge>
                      ) : item.daysUntilReorder < 7 ? (
                        <Badge variant="warning">SOON</Badge>
                      ) : (
                        <span className="text-gray-400 text-sm">#{index + 1}</span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                    <TableCell className="max-w-[150px] truncate">{item.productName}</TableCell>
                    <TableCell className={cn(
                      "text-right font-medium",
                      item.currentQty < item.reorderPoint ? "text-red-600" : "text-gray-900"
                    )}>
                      {formatNumber(item.currentQty)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-amber-700">{item.velocity30d.toFixed(1)}</span>
                      <span className="text-gray-400 text-xs">/day</span>
                    </TableCell>
                    <TableCell className="text-right text-gray-500">
                      {formatNumber(item.reorderPoint)}
                    </TableCell>
                    <TableCell className={cn(
                      "text-right font-medium",
                      item.daysUntilReorder < 7 ? "text-red-600" : 
                      item.daysUntilReorder < 14 ? "text-orange-600" : "text-green-600"
                    )}>
                      {item.daysUntilReorder === 999 ? '∞' : `${item.daysUntilReorder}d`}
                    </TableCell>
                    <TableCell className="text-right font-medium text-blue-600">
                      {formatNumber(item.suggestedOrderQty)}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        Create PO
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* How It Works */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>How Smart Reorder Points Work</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm flex-shrink-0">
                  1
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Track Velocity</h4>
                  <p className="text-sm text-gray-500 mt-1">
                    We calculate daily sales velocity from actual Shopify orders over the last 30 days.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm flex-shrink-0">
                  2
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Factor Lead Time</h4>
                  <p className="text-sm text-gray-500 mt-1">
                    Supplier lead times determine when you need to reorder to avoid stockouts.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm flex-shrink-0">
                  3
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Add Safety Buffer</h4>
                  <p className="text-sm text-gray-500 mt-1">
                    Extra days of safety stock protect against unexpected demand spikes.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm flex-shrink-0">
                  4
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Smart Suggestions</h4>
                  <p className="text-sm text-gray-500 mt-1">
                    Order quantities are calculated to maintain optimal stock levels.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
