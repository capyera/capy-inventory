import { useState, useEffect } from 'react';
import { Layers, Plus, Package, AlertTriangle, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Header } from '../components/layout/Header';
import { bundlesApi, inventoryApi } from '../services/api';
import { formatCurrency, formatNumber } from '../lib/utils';
import type { Bundle, InventoryItem } from '../types';

export function Bundles() {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    try {
      const [bundlesData, inventoryData] = await Promise.all([
        bundlesApi.getAll(),
        inventoryApi.getAll(),
      ]);
      setBundles(bundlesData);
      setInventory(inventoryData);
    } catch (error) {
      console.error('Failed to load bundles:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function getComponentStock(sku: string): number {
    const item = inventory.find(i => i.sku === sku);
    return item?.currentQty || 0;
  }

  function getBundleAvailability(bundle: Bundle): { available: number; limiting: string } {
    let minAvailable = Infinity;
    let limitingSku = '';
    
    for (const component of bundle.components) {
      const stock = getComponentStock(component.sku);
      const available = Math.floor(stock / component.quantity);
      if (available < minAvailable) {
        minAvailable = available;
        limitingSku = component.sku;
      }
    }
    
    return { available: minAvailable === Infinity ? 0 : minAvailable, limiting: limitingSku };
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header 
        title="Bundle Management" 
        subtitle="Manage product bundles and track component inventory"
        onRefresh={loadData}
        isLoading={isLoading}
      />
      
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-gray-600">
              {bundles.length} bundles configured • Auto-deduct on sale
            </p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Bundle
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {bundles.map((bundle) => {
            const { available, limiting } = getBundleAvailability(bundle);
            const isLow = available < 50;
            const isOut = available === 0;
            
            return (
              <Card key={bundle.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
                      <Layers className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{bundle.name}</CardTitle>
                      <p className="text-xs text-gray-500 font-mono">{bundle.sku}</p>
                    </div>
                  </div>
                  <Badge variant={bundle.isActive ? 'success' : 'default'}>
                    {bundle.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </CardHeader>
                <CardContent>
                  {/* Components */}
                  <div className="mb-4">
                    <p className="text-xs font-medium text-gray-500 uppercase mb-2">
                      Components ({bundle.components.length})
                    </p>
                    <div className="space-y-2">
                      {bundle.components.map((component) => {
                        const stock = getComponentStock(component.sku);
                        const isLimiting = component.sku === limiting;
                        
                        return (
                          <div 
                            key={component.sku} 
                            className={`flex items-center justify-between p-2 rounded-lg ${
                              isLimiting && isLow ? 'bg-yellow-50' : 'bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Package className="w-4 h-4 text-gray-400" />
                              <div>
                                <p className="text-sm font-medium">{component.name}</p>
                                <p className="text-xs text-gray-500 font-mono">{component.sku}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">×{component.quantity}</p>
                              <p className={`text-xs ${stock < 50 ? 'text-orange-600' : 'text-gray-500'}`}>
                                {formatNumber(stock)} avail
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Availability */}
                  <div className={`p-3 rounded-lg ${
                    isOut ? 'bg-red-50' : isLow ? 'bg-yellow-50' : 'bg-green-50'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isOut ? (
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                        ) : isLow ? (
                          <AlertTriangle className="w-4 h-4 text-yellow-500" />
                        ) : (
                          <Check className="w-4 h-4 text-green-500" />
                        )}
                        <span className={`text-sm font-medium ${
                          isOut ? 'text-red-700' : isLow ? 'text-yellow-700' : 'text-green-700'
                        }`}>
                          {isOut ? 'Cannot Fulfill' : isLow ? 'Low Availability' : 'In Stock'}
                        </span>
                      </div>
                      <span className={`text-lg font-bold ${
                        isOut ? 'text-red-700' : isLow ? 'text-yellow-700' : 'text-green-700'
                      }`}>
                        {formatNumber(available)}
                      </span>
                    </div>
                    {limiting && available < 100 && (
                      <p className="text-xs text-gray-600 mt-1">
                        Limited by: <span className="font-mono">{limiting}</span>
                      </p>
                    )}
                  </div>
                  
                  {/* Price */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <span className="text-sm text-gray-500">Bundle Price</span>
                    <span className="text-lg font-bold text-gray-900">
                      {formatCurrency(bundle.price)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        {/* How Bundles Work */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>How Bundle Deduction Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm">
                  1
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Customer Orders Bundle</h4>
                  <p className="text-sm text-gray-500 mt-1">
                    When a bundle is sold on Shopify, we receive the order with the bundle SKU.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm">
                  2
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Components Auto-Deducted</h4>
                  <p className="text-sm text-gray-500 mt-1">
                    Each component's inventory is automatically reduced based on the bundle mapping.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm">
                  3
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Real-time Availability</h4>
                  <p className="text-sm text-gray-500 mt-1">
                    Bundle availability is calculated from component inventory, preventing overselling.
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
