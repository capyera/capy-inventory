import { useState, useEffect, useMemo } from 'react';
import { Filter, Download, ArrowUpDown, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { SearchInput } from '../components/ui/Input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Header } from '../components/layout/Header';
import { ProductThumbnail } from './Products';
import { inventoryApi } from '../services/api';
import { productRegistry, PRODUCT_CATEGORIES } from '../services/productRegistry';
import { formatNumber, getStockStatus, cn } from '../lib/utils';
import type { InventoryItem } from '../types';

type SortField = 'sku' | 'productName' | 'currentQty' | 'velocity30d' | 'par30d';
type SortDirection = 'asc' | 'desc';
type FilterStatus = 'all' | 'critical' | 'low' | 'good' | 'overstock';

export function Inventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('currentQty');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterSubcategory, setFilterSubcategory] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

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
          };
        }
        return item;
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
        const status = getStockStatus(item.currentQty, item.velocity30d);
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
      let aVal: string | number = a[sortField] as string | number;
      let bVal: string | number = b[sortField] as string | number;
      
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
  }, [inventory, searchQuery, sortField, sortDirection, filterStatus, filterCategory, filterSubcategory]);

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
      // Show all subcategories from all categories
      const allSubs: string[] = [];
      Object.values(PRODUCT_CATEGORIES).forEach(subs => allSubs.push(...subs));
      inventory.forEach(i => {
        if ((i as any).subcategory) allSubs.push((i as any).subcategory);
      });
      return [...new Set(allSubs)];
    }
    // Show subcategories for selected category
    const categorySubs = PRODUCT_CATEGORIES[filterCategory as keyof typeof PRODUCT_CATEGORIES] || [];
    const inventorySubs = inventory
      .filter(i => i.category === filterCategory)
      .map(i => (i as any).subcategory)
      .filter(Boolean);
    return [...new Set([...categorySubs, ...inventorySubs])];
  }, [filterCategory, inventory]);
  
  const statusCounts = {
    critical: inventory.filter(i => getStockStatus(i.currentQty, i.velocity30d).status === 'critical').length,
    low: inventory.filter(i => ['low', 'watch'].includes(getStockStatus(i.currentQty, i.velocity30d).status)).length,
    good: inventory.filter(i => getStockStatus(i.currentQty, i.velocity30d).status === 'good').length,
    overstock: inventory.filter(i => getStockStatus(i.currentQty, i.velocity30d).status === 'overstock').length,
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header 
        title="Inventory" 
        subtitle={`${inventory.length} SKUs tracked`}
        onRefresh={loadInventory}
        isLoading={isLoading}
      />
      
      <div className="flex-1 overflow-y-auto p-6">
        {/* Quick Stats */}
        <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
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
        
        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-[200px] max-w-md">
                <SearchInput 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by SKU or product name..."
                />
              </div>
              
              <select
                value={filterCategory}
                onChange={(e) => {
                  setFilterCategory(e.target.value);
                  setFilterSubcategory('all'); // Reset subcategory when category changes
                }}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="all">All Subcategories</option>
                  {subcategories.map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              )}
              
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Inventory Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <SortableHeader 
                      label="Product" 
                      field="productName" 
                      currentField={sortField} 
                      direction={sortDirection}
                      onSort={handleSort}
                    />
                  </TableHead>
                  <TableHead>
                    <SortableHeader 
                      label="SKU" 
                      field="sku" 
                      currentField={sortField} 
                      direction={sortDirection}
                      onSort={handleSort}
                    />
                  </TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-center">
                    <SortableHeader 
                      label="Current Qty" 
                      field="currentQty" 
                      currentField={sortField} 
                      direction={sortDirection}
                      onSort={handleSort}
                    />
                  </TableHead>
                  <TableHead className="text-center">Inbound</TableHead>
                  <TableHead className="text-center">
                    <SortableHeader 
                      label="Velocity" 
                      field="velocity30d" 
                      currentField={sortField} 
                      direction={sortDirection}
                      onSort={handleSort}
                    />
                  </TableHead>
                  <TableHead className="text-center">
                    <SortableHeader 
                      label="Days of Stock" 
                      field="par30d" 
                      currentField={sortField} 
                      direction={sortDirection}
                      onSort={handleSort}
                    />
                  </TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.map((item) => {
                  const status = getStockStatus(item.currentQty, item.velocity30d);
                  const subcategory = (item as any).subcategory;
                  return (
                    <TableRow 
                      key={item.sku}
                      className={cn(
                        status.status === 'critical' && 'bg-red-50/50',
                        status.status === 'low' && 'bg-orange-50/50'
                      )}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <ProductThumbnail sku={item.sku} size="sm" />
                          <p className="font-medium text-slate-900 truncate max-w-[180px]">{item.productName}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm text-slate-600">{item.sku}</span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <Badge>{item.category}</Badge>
                          {subcategory && (
                            <p className="text-xs text-slate-500 mt-1">{subcategory}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {formatNumber(item.currentQty)}
                      </TableCell>
                      <TableCell className="text-center text-slate-500">
                        {item.inboundQty > 0 ? `+${formatNumber(item.inboundQty)}` : '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-medium text-amber-700">{item.velocity30d.toFixed(1)}</span>
                        <span className="text-slate-400 text-xs">/day</span>
                      </TableCell>
                      <TableCell className="text-center">
                        {status.daysOfStock === 999 ? '∞' : status.daysOfStock}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant={
                            status.status === 'critical' ? 'danger' :
                            status.status === 'low' ? 'warning' :
                            status.status === 'watch' ? 'warning' :
                            status.status === 'overstock' ? 'info' :
                            'success'
                          }
                        >
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <button 
                          onClick={() => setSelectedItem(item)}
                          className="p-1 text-gray-400 hover:text-gray-600 rounded"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        {/* Item Detail Modal */}
        {selectedItem && (
          <ItemDetailModal 
            item={selectedItem} 
            onClose={() => setSelectedItem(null)} 
          />
        )}
      </div>
    </div>
  );
}

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
        "flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all whitespace-nowrap",
        isActive 
          ? color ? colorStyles[color] : 'border-amber-400 bg-amber-50 text-amber-700'
          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
      )}
    >
      {label}
      <span className={cn(
        "px-1.5 py-0.5 rounded-full text-xs",
        isActive 
          ? color ? 'bg-white/50' : 'bg-amber-200/50'
          : 'bg-gray-100'
      )}>
        {count}
      </span>
    </button>
  );
}

interface SortableHeaderProps {
  label: string;
  field: SortField;
  currentField: SortField;
  direction: SortDirection;
  onSort: (field: SortField) => void;
}

function SortableHeader({ label, field, currentField, onSort }: SortableHeaderProps) {
  const isActive = currentField === field;
  
  return (
    <button 
      onClick={() => onSort(field)}
      className="flex items-center gap-1 hover:text-gray-900"
    >
      {label}
      <ArrowUpDown className={cn(
        "w-3 h-3",
        isActive ? "text-amber-600" : "text-gray-400"
      )} />
    </button>
  );
}

interface ItemDetailModalProps {
  item: InventoryItem;
  onClose: () => void;
}

function ItemDetailModal({ item, onClose }: ItemDetailModalProps) {
  const status = getStockStatus(item.currentQty, item.velocity30d);
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <Card className="w-full max-w-lg m-4" onClick={(e) => e?.stopPropagation()}>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle>{item.productName}</CardTitle>
            <p className="text-sm text-gray-500 font-mono">{item.sku}</p>
          </div>
          <Badge 
            variant={
              status.status === 'critical' ? 'danger' :
              status.status === 'low' ? 'warning' :
              'success'
            }
          >
            {status.label}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Current Stock</p>
              <p className="text-2xl font-bold">{formatNumber(item.currentQty)}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Days of Stock</p>
              <p className="text-2xl font-bold">{status.daysOfStock === 999 ? '∞' : status.daysOfStock}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Velocity (30d)</p>
              <p className="text-2xl font-bold">{item.velocity30d.toFixed(1)}<span className="text-sm text-gray-500">/day</span></p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Inbound</p>
              <p className="text-2xl font-bold">{item.inboundQty > 0 ? `+${formatNumber(item.inboundQty)}` : '—'}</p>
            </div>
          </div>
          
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Reorder Point</span>
              <span className="font-medium">{formatNumber(item.reorderPoint)} units</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Suggested Reorder Qty</span>
              <span className="font-medium">{formatNumber(item.reorderQty)} units</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Category</span>
              <Badge>{item.category}</Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Last Updated</span>
              <span className="font-medium">{item.lastUpdated.toLocaleDateString()}</span>
            </div>
          </div>
          
          <div className="mt-6 flex gap-3">
            <Button variant="primary" className="flex-1">
              Create PO
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
