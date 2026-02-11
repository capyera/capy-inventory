import { useState, useEffect, useMemo } from 'react';
import { Download, ArrowUpDown, Eye, Warehouse } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { SearchInput } from '../components/ui/Input';
import { Header } from '../components/layout/Header';
import { inventoryApi } from '../services/api';
import { productRegistry, PRODUCT_CATEGORIES } from '../services/productRegistry';
import { formatNumber, getStockStatus, cn } from '../lib/utils';
import type { InventoryItem } from '../types';

type SortField = 'sku' | 'productName' | 'currentQty' | 'totalQty' | 'velocity' | 'daysOfStock';
type SortDirection = 'asc' | 'desc';
type FilterStatus = 'all' | 'critical' | 'low' | 'good' | 'overstock';
type VelocityTimeframe = '3d' | '7d' | '14d' | '30d';

interface InventoryProps {
  initialWarehouse?: string;
}

export function Inventory({ initialWarehouse }: InventoryProps) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('currentQty');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterSubcategory, setFilterSubcategory] = useState<string>('all');
  const [filterWarehouse, setFilterWarehouse] = useState<string>(initialWarehouse || 'all');
  const [showInactive, setShowInactive] = useState(false);
  const [velocityTimeframe, setVelocityTimeframe] = useState<VelocityTimeframe>('30d');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  
  // Helper to get velocity and days of stock based on selected timeframe
  const getVelocityForItem = (item: InventoryItem): number => {
    switch (velocityTimeframe) {
      case '3d': return item.velocity3d || 0;
      case '7d': return item.velocity7d || item.velocity14d || 0;
      case '14d': return item.velocity14d || 0;
      case '30d': return item.velocity30d || 0;
      default: return item.velocity30d || 0;
    }
  };
  
  const getDaysOfStockForItem = (item: InventoryItem): number => {
    const velocity = getVelocityForItem(item);
    const totalQty = item.currentQty + item.inboundQty;
    if (velocity <= 0) return 999;
    return Math.floor(totalQty / velocity);
  };

  useEffect(() => {
    loadInventory();
  }, []);

  async function loadInventory() {
    setIsLoading(true);
    try {
      const data = await inventoryApi.getAll();
      
      // Merge with product master data from productRegistry
      const mergedData = data.map(item => {
        const product = productRegistry.getBySku(item.sku);
        if (product) {
          return {
            ...item,
            productName: product.name || item.productName,
            category: product.category || item.category,
            subcategory: product.subcategory,
            isActive: product.isActive !== false,
          };
        }
        return { ...item, isActive: true };
      });
      
      setInventory(mergedData);
    } catch (error) {
      console.error('Failed to load inventory:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const filteredInventory = useMemo(() => {
    let items = [...inventory];
    
    // Active filter (default: hide inactive)
    if (!showInactive) {
      items = items.filter(item => (item as any).isActive !== false);
    }
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(item => 
        item.sku.toLowerCase().includes(query) ||
        item.productName.toLowerCase().includes(query)
      );
    }
    
    // Status filter
    if (filterStatus !== 'all') {
      items = items.filter(item => {
        const velocity = getVelocityForItem(item);
        const totalQty = item.currentQty + item.inboundQty;
        const status = getStockStatus(totalQty, velocity);
        if (filterStatus === 'critical') return status.status === 'critical';
        if (filterStatus === 'low') return status.status === 'low' || status.status === 'watch';
        if (filterStatus === 'good') return status.status === 'good';
        if (filterStatus === 'overstock') return status.status === 'overstock';
        return true;
      });
    }
    
    // Category filter
    if (filterCategory !== 'all') {
      items = items.filter(item => item.category === filterCategory);
    }
    
    // Subcategory filter
    if (filterSubcategory !== 'all') {
      items = items.filter(item => (item as any).subcategory === filterSubcategory);
    }
    
    // Sort
    items.sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;
      
      // Handle computed fields
      if (sortField === 'totalQty') {
        aVal = a.currentQty + a.inboundQty;
        bVal = b.currentQty + b.inboundQty;
      } else if (sortField === 'velocity') {
        aVal = getVelocityForItem(a);
        bVal = getVelocityForItem(b);
      } else if (sortField === 'daysOfStock') {
        aVal = getDaysOfStockForItem(a);
        bVal = getDaysOfStockForItem(b);
      } else {
        aVal = a[sortField] as string | number;
        bVal = b[sortField] as string | number;
      }
      
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal as string).toLowerCase();
      }
      
      if (sortDirection === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });
    
    return items;
  }, [inventory, searchQuery, sortField, sortDirection, filterStatus, filterCategory, filterSubcategory, velocityTimeframe, showInactive]);

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }

  // Use all known categories from product registry, plus any from inventory
  const categories = [...new Set([
    ...Object.keys(PRODUCT_CATEGORIES),
    ...inventory.map(i => i.category).filter(Boolean)
  ])];
  
  // Get subcategories for current category filter
  const subcategories = useMemo(() => {
    if (filterCategory === 'all') {
      const allSubs: string[] = [];
      Object.values(PRODUCT_CATEGORIES).forEach(cat => {
        if (cat.subcategories) allSubs.push(...cat.subcategories);
      });
      inventory.forEach(i => {
        if ((i as any).subcategory) allSubs.push((i as any).subcategory);
      });
      return [...new Set(allSubs)];
    }
    const categoryData = PRODUCT_CATEGORIES[filterCategory as keyof typeof PRODUCT_CATEGORIES];
    const categorySubs = categoryData?.subcategories || [];
    const inventorySubs = inventory
      .filter(i => i.category === filterCategory)
      .map(i => (i as any).subcategory)
      .filter(Boolean);
    return [...new Set([...categorySubs, ...inventorySubs])];
  }, [filterCategory, inventory]);
  
  // Count only active products for status pills
  const activeInventory = useMemo(() => 
    showInactive ? inventory : inventory.filter(i => (i as any).isActive !== false),
    [inventory, showInactive]
  );
  
  const inactiveCount = inventory.filter(i => (i as any).isActive === false).length;
  
  const statusCounts = useMemo(() => {
    return {
      critical: activeInventory.filter(i => {
        const v = getVelocityForItem(i);
        const total = i.currentQty + i.inboundQty;
        return getStockStatus(total, v).status === 'critical';
      }).length,
      low: activeInventory.filter(i => {
        const v = getVelocityForItem(i);
        const total = i.currentQty + i.inboundQty;
        return ['low', 'watch'].includes(getStockStatus(total, v).status);
      }).length,
      good: activeInventory.filter(i => {
        const v = getVelocityForItem(i);
        const total = i.currentQty + i.inboundQty;
        return getStockStatus(total, v).status === 'good';
      }).length,
      overstock: activeInventory.filter(i => {
        const v = getVelocityForItem(i);
        const total = i.currentQty + i.inboundQty;
        return getStockStatus(total, v).status === 'overstock';
      }).length,
    };
  }, [activeInventory, velocityTimeframe]);

  // Warehouses (for future - currently just one)
  const warehouses = [
    { id: 'speedfulfill-cn', name: 'SpeedFulfill China' },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header 
        title="Inventory" 
        subtitle={`${inventory.length} SKUs tracked`}
        onRefresh={loadInventory}
        isLoading={isLoading}
      />
      
      <div className="flex-1 overflow-y-auto p-4">
        {/* Quick Stats - Compact */}
        <div className="flex gap-2 mb-4 overflow-x-auto">
          <StatusPill 
            label="All" 
            count={inventory.length} 
            isActive={filterStatus === 'all'}
            onClick={() => setFilterStatus('all')}
          />
          <StatusPill 
            label="Critical" 
            count={statusCounts.critical} 
            color="red"
            isActive={filterStatus === 'critical'}
            onClick={() => setFilterStatus('critical')}
          />
          <StatusPill 
            label="Low Stock" 
            count={statusCounts.low} 
            color="yellow"
            isActive={filterStatus === 'low'}
            onClick={() => setFilterStatus('low')}
          />
          <StatusPill 
            label="Good" 
            count={statusCounts.good} 
            color="green"
            isActive={filterStatus === 'good'}
            onClick={() => setFilterStatus('good')}
          />
          <StatusPill 
            label="Overstock" 
            count={statusCounts.overstock} 
            color="blue"
            isActive={filterStatus === 'overstock'}
            onClick={() => setFilterStatus('overstock')}
          />
        </div>
        
        {/* Filters - Compact */}
        <div className="flex flex-wrap gap-2 mb-4 items-center">
          <div className="flex-1 min-w-[180px] max-w-sm">
            <SearchInput 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search SKU or product..."
              className="h-8 text-xs"
            />
          </div>
          
          <select
            value={filterWarehouse}
            onChange={(e) => setFilterWarehouse(e.target.value)}
            className="h-8 px-2 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="all">All Warehouses</option>
            {warehouses.map(wh => (
              <option key={wh.id} value={wh.id}>{wh.name}</option>
            ))}
          </select>
          
          <select
            value={filterCategory}
            onChange={(e) => {
              setFilterCategory(e.target.value);
              setFilterSubcategory('all');
            }}
            className="h-8 px-2 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          
          {subcategories.length > 0 && (
            <select
              value={filterSubcategory}
              onChange={(e) => setFilterSubcategory(e.target.value)}
              className="h-8 px-2 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="all">All Subcategories</option>
              {subcategories.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          )}
          
          <select
            value={velocityTimeframe}
            onChange={(e) => setVelocityTimeframe(e.target.value as VelocityTimeframe)}
            className="h-8 px-2 border border-amber-300 bg-amber-50 rounded text-xs font-medium text-amber-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="3d">3d Velocity</option>
            <option value="7d">7d Velocity</option>
            <option value="14d">14d Velocity</option>
            <option value="30d">30d Velocity</option>
          </select>
          
          {inactiveCount > 0 && (
            <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
              />
              Show Inactive ({inactiveCount})
            </label>
          )}
          
          <Button variant="outline" size="sm" className="h-8 text-xs">
            <Download className="w-3 h-3 mr-1" />
            Export
          </Button>
        </div>
        
        {/* Inventory Table - Compact */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b sticky top-0">
                <tr>
                  <th className="px-2 py-2 text-left font-medium text-slate-600">
                    <SortButton field="productName" label="Product" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                  </th>
                  <th className="px-2 py-2 text-left font-medium text-slate-600">
                    <SortButton field="sku" label="SKU" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                  </th>
                  <th className="px-2 py-2 text-left font-medium text-slate-600">Category</th>
                  <th className="px-2 py-2 text-left font-medium text-slate-600">Subcategory</th>
                  <th className="px-2 py-2 text-center font-medium text-slate-600">
                    <SortButton field="currentQty" label="Current" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                  </th>
                  <th className="px-2 py-2 text-center font-medium text-slate-600">Inbound</th>
                  <th className="px-2 py-2 text-center font-medium text-slate-600">
                    <SortButton field="totalQty" label="Total" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                  </th>
                  <th className="px-2 py-2 text-center font-medium text-slate-600">
                    <SortButton field="velocity" label={`Vel (${velocityTimeframe})`} sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                  </th>
                  <th className="px-2 py-2 text-center font-medium text-slate-600">
                    <SortButton field="daysOfStock" label="DOS" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                  </th>
                  <th className="px-2 py-2 text-center font-medium text-slate-600">Status</th>
                  <th className="px-2 py-2 w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInventory.map((item) => {
                  const velocity = getVelocityForItem(item);
                  const totalQty = item.currentQty + item.inboundQty;
                  const daysOfStock = getDaysOfStockForItem(item);
                  const status = getStockStatus(totalQty, velocity);
                  const subcategory = (item as any).subcategory;
                  return (
                    <tr 
                      key={item.sku}
                      className={cn(
                        "hover:bg-slate-50",
                        status.status === 'critical' && 'bg-red-50/50',
                        status.status === 'low' && 'bg-orange-50/30'
                      )}
                    >
                      <td className="px-2 py-1.5">
                        <span className="font-medium text-slate-800 truncate block max-w-[160px]" title={item.productName}>
                          {item.productName}
                        </span>
                      </td>
                      <td className="px-2 py-1.5">
                        <span className="font-mono text-slate-500">{item.sku}</span>
                      </td>
                      <td className="px-2 py-1.5">
                        <span className="text-slate-600">{item.category}</span>
                      </td>
                      <td className="px-2 py-1.5">
                        <span className="text-slate-500">{subcategory || '-'}</span>
                      </td>
                      <td className="px-2 py-1.5 text-center font-medium text-slate-700">
                        {formatNumber(item.currentQty)}
                      </td>
                      <td className="px-2 py-1.5 text-center text-slate-400">
                        {item.inboundQty > 0 ? `+${formatNumber(item.inboundQty)}` : '-'}
                      </td>
                      <td className="px-2 py-1.5 text-center font-bold text-slate-800">
                        {formatNumber(totalQty)}
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <span className="text-amber-600 font-medium">{velocity.toFixed(1)}</span>
                        <span className="text-slate-400">/d</span>
                      </td>
                      <td className="px-2 py-1.5 text-center font-medium">
                        {daysOfStock === 999 ? '∞' : daysOfStock}
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <StatusBadge status={status.status} label={status.label} />
                      </td>
                      <td className="px-2 py-1.5">
                        <button 
                          onClick={() => setSelectedItem(item)}
                          className="p-1 text-slate-400 hover:text-slate-600 rounded"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {filteredInventory.length === 0 && !isLoading && (
            <div className="text-center py-8 text-slate-500 text-sm">
              No inventory items found
            </div>
          )}
        </Card>
        
        {/* Item Detail Modal */}
        {selectedItem && (
          <ItemDetailModal 
            item={selectedItem} 
            velocityTimeframe={velocityTimeframe}
            getVelocityForItem={getVelocityForItem}
            getDaysOfStockForItem={getDaysOfStockForItem}
            onClose={() => setSelectedItem(null)} 
          />
        )}
      </div>
    </div>
  );
}

// Compact Status Pill
interface StatusPillProps {
  label: string;
  count: number;
  color?: 'red' | 'yellow' | 'green' | 'blue';
  isActive: boolean;
  onClick: () => void;
}

function StatusPill({ label, count, color, isActive, onClick }: StatusPillProps) {
  const colorStyles = {
    red: 'border-red-200 bg-red-50 text-red-700',
    yellow: 'border-yellow-200 bg-yellow-50 text-yellow-700',
    green: 'border-green-200 bg-green-50 text-green-700',
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
  };
  
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium transition-all whitespace-nowrap",
        isActive 
          ? color ? colorStyles[color] : 'border-amber-400 bg-amber-50 text-amber-700'
          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
      )}
    >
      {label}
      <span className={cn(
        "px-1 py-0.5 rounded-full text-[10px]",
        isActive 
          ? color ? 'bg-white/50' : 'bg-amber-200/50'
          : 'bg-slate-100'
      )}>
        {count}
      </span>
    </button>
  );
}

// Sort Button
interface SortButtonProps {
  field: SortField;
  label: string;
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
}

function SortButton({ field, label, sortField, sortDirection, onSort }: SortButtonProps) {
  const isActive = sortField === field;
  return (
    <button 
      onClick={() => onSort(field)}
      className="flex items-center gap-0.5 hover:text-slate-900"
    >
      {label}
      <ArrowUpDown className={cn(
        "w-3 h-3",
        isActive ? "text-amber-600" : "text-slate-300"
      )} />
    </button>
  );
}

// Compact Status Badge
function StatusBadge({ status, label }: { status: string; label: string }) {
  const styles = {
    critical: 'bg-red-100 text-red-700',
    low: 'bg-orange-100 text-orange-700',
    watch: 'bg-yellow-100 text-yellow-700',
    good: 'bg-green-100 text-green-700',
    overstock: 'bg-blue-100 text-blue-700',
  };
  
  return (
    <span className={cn(
      "inline-block px-1.5 py-0.5 rounded text-[10px] font-medium",
      styles[status as keyof typeof styles] || 'bg-slate-100 text-slate-600'
    )}>
      {label}
    </span>
  );
}

// Item Detail Modal
interface ItemDetailModalProps {
  item: InventoryItem;
  velocityTimeframe: VelocityTimeframe;
  getVelocityForItem: (item: InventoryItem) => number;
  getDaysOfStockForItem: (item: InventoryItem) => number;
  onClose: () => void;
}

function ItemDetailModal({ item, velocityTimeframe, getVelocityForItem, getDaysOfStockForItem, onClose }: ItemDetailModalProps) {
  const velocity = getVelocityForItem(item);
  const totalQty = item.currentQty + item.inboundQty;
  const daysOfStock = getDaysOfStockForItem(item);
  const status = getStockStatus(totalQty, velocity);
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <Card className="w-full max-w-lg m-4" onClick={(e) => e?.stopPropagation()}>
        <CardHeader className="flex flex-row items-start justify-between pb-2">
          <div>
            <CardTitle className="text-base">{item.productName}</CardTitle>
            <p className="text-xs text-slate-500 font-mono">{item.sku}</p>
          </div>
          <StatusBadge status={status.status} label={status.label} />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-slate-50 p-3 rounded-lg">
              <p className="text-xs text-slate-500">Current Stock</p>
              <p className="text-xl font-bold">{formatNumber(item.currentQty)}</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg">
              <p className="text-xs text-slate-500">Total (+ Inbound)</p>
              <p className="text-xl font-bold">{formatNumber(totalQty)}</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg">
              <p className="text-xs text-slate-500">Velocity ({velocityTimeframe})</p>
              <p className="text-xl font-bold">{velocity.toFixed(1)}<span className="text-sm text-slate-500">/day</span></p>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg">
              <p className="text-xs text-slate-500">Days of Stock</p>
              <p className="text-xl font-bold">{daysOfStock === 999 ? '∞' : daysOfStock}</p>
            </div>
          </div>
          
          <div className="mt-4 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Inbound</span>
              <span className="font-medium">{item.inboundQty > 0 ? `+${formatNumber(item.inboundQty)}` : '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Reorder Point</span>
              <span className="font-medium">{formatNumber(item.reorderPoint)} units</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Category</span>
              <span className="font-medium">{item.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Subcategory</span>
              <span className="font-medium">{(item as any).subcategory || '—'}</span>
            </div>
          </div>
          
          <div className="mt-4 flex gap-2">
            <Button variant="primary" size="sm" className="flex-1">
              Create PO
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
