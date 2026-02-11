import { useState, useEffect, useMemo } from 'react';
import { 
  Layers, Plus, Package, AlertTriangle, Check, Edit2, Trash2, 
  ChevronDown, ChevronRight, Save, X, ArrowRight, GitBranch
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Header } from '../components/layout/Header';
import { inventoryApi } from '../services/api';
import { bundleRegistry, getProductName, PRODUCT_NAMES } from '../services/bundleRegistry';
import { formatCurrency, formatNumber } from '../lib/utils';
import type { Bundle, BundleComponent, InventoryItem } from '../types';

interface BundleFormData {
  sku: string;
  name: string;
  price: number;
  componentSkus: string[];
}

interface ComponentTreeProps {
  components: BundleComponent[];
  inventory: InventoryItem[];
  limitingSku: string;
}

function ComponentTree({ components, inventory, limitingSku }: ComponentTreeProps) {
  const getStock = (sku: string) => {
    const item = inventory.find(i => i.sku === sku);
    return item?.currentQty || 0;
  };

  return (
    <div className="space-y-1">
      {components.map((component, idx) => {
        const stock = getStock(component.sku);
        const isLimiting = component.sku === limitingSku;
        const isLow = stock < 50;
        
        return (
          <div 
            key={component.sku}
            className={`flex items-center gap-2 p-2 rounded-md transition-colors ${
              isLimiting && isLow ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50'
            }`}
          >
            <div className="flex items-center text-gray-400">
              {idx === components.length - 1 ? '└' : '├'}
              <ArrowRight className="w-3 h-3 ml-1" />
            </div>
            <Package className={`w-4 h-4 ${isLimiting ? 'text-amber-500' : 'text-gray-400'}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{component.name}</p>
              <p className="text-xs text-gray-500 font-mono">{component.sku}</p>
            </div>
            <div className="text-right">
              <span className="text-sm font-medium">×{component.quantity}</span>
              <p className={`text-xs ${isLow ? 'text-amber-600 font-medium' : 'text-gray-500'}`}>
                {formatNumber(stock)} in stock
              </p>
            </div>
            {isLimiting && isLow && (
              <AlertTriangle className="w-4 h-4 text-amber-500 ml-1" />
            )}
          </div>
        );
      })}
    </div>
  );
}

interface BundleFormProps {
  bundle?: Bundle;
  onSave: (data: BundleFormData) => void;
  onCancel: () => void;
  availableSkus: string[];
}

function BundleForm({ bundle, onSave, onCancel, availableSkus }: BundleFormProps) {
  const [sku, setSku] = useState(bundle?.sku || '');
  const [name, setName] = useState(bundle?.name || '');
  const [price, setPrice] = useState(bundle?.price?.toString() || '29.99');
  const [componentSkus, setComponentSkus] = useState<string[]>(
    bundle?.components.map(c => c.sku) || []
  );
  const [newComponentSku, setNewComponentSku] = useState('');
  
  const isEditing = !!bundle;
  
  const handleAddComponent = () => {
    const trimmedSku = newComponentSku.trim().toUpperCase();
    if (trimmedSku && !componentSkus.includes(trimmedSku)) {
      setComponentSkus([...componentSkus, trimmedSku]);
      setNewComponentSku('');
    }
  };
  
  const handleRemoveComponent = (skuToRemove: string) => {
    setComponentSkus(componentSkus.filter(s => s !== skuToRemove));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      sku: sku.trim().toUpperCase(),
      name: name.trim(),
      price: parseFloat(price) || 29.99,
      componentSkus,
    });
  };
  
  // Filter suggestions based on input
  const suggestions = useMemo(() => {
    if (!newComponentSku) return [];
    const search = newComponentSku.toUpperCase();
    return availableSkus
      .filter(s => s.includes(search) && !componentSkus.includes(s))
      .slice(0, 5);
  }, [newComponentSku, availableSkus, componentSkus]);
  
  return (
    <Card className="border-2 border-amber-300 bg-amber-50/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-amber-600" />
          {isEditing ? 'Edit Bundle' : 'Create New Bundle'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bundle SKU
              </label>
              <Input
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="LE-DUO-001"
                disabled={isEditing}
                className="font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bundle Name
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Valentine Duo Bundle"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price ($)
              </label>
              <Input
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="29.99"
              />
            </div>
          </div>
          
          {/* Component SKUs */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Component SKUs
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {componentSkus.map((cSku) => (
                <div 
                  key={cSku}
                  className="flex items-center gap-1 px-2 py-1 bg-white border rounded-md text-sm"
                >
                  <span className="font-mono">{cSku}</span>
                  <span className="text-gray-400 text-xs">
                    ({getProductName(cSku) === cSku ? 'Unknown' : getProductName(cSku).split(' ')[0]})
                  </span>
                  <button 
                    type="button"
                    onClick={() => handleRemoveComponent(cSku)}
                    className="ml-1 text-gray-400 hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 relative">
              <Input
                value={newComponentSku}
                onChange={(e) => setNewComponentSku(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddComponent())}
                placeholder="Add component SKU (e.g., OG-M-009)"
                className="font-mono flex-1"
              />
              <Button type="button" variant="outline" onClick={handleAddComponent}>
                <Plus className="w-4 h-4" />
              </Button>
              {suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-12 mt-1 bg-white border rounded-md shadow-lg z-10">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setComponentSkus([...componentSkus, s]);
                        setNewComponentSku('');
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm font-mono flex justify-between"
                    >
                      <span>{s}</span>
                      <span className="text-gray-400">{getProductName(s)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Preview */}
          {componentSkus.length > 0 && (
            <div className="p-3 bg-white rounded-md border">
              <p className="text-xs font-medium text-gray-500 uppercase mb-2">Preview</p>
              <div className="flex items-center gap-2 text-sm">
                <GitBranch className="w-4 h-4 text-amber-500" />
                <span className="font-medium">{name || 'Unnamed Bundle'}</span>
                <span className="text-gray-400">=</span>
                {componentSkus.map((s, i) => (
                  <span key={s}>
                    <span className="font-mono text-gray-600">{s}</span>
                    {i < componentSkus.length - 1 && <span className="text-gray-400"> + </span>}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!sku || !name || componentSkus.length === 0}
            >
              <Save className="w-4 h-4 mr-2" />
              {isEditing ? 'Update Bundle' : 'Create Bundle'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function Bundles() {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBundle, setEditingBundle] = useState<Bundle | null>(null);
  const [expandedBundles, setExpandedBundles] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'duo' | 'family' | 'custom'>('all');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    try {
      const [inventoryData] = await Promise.all([
        inventoryApi.getAll(),
      ]);
      
      // Get bundles from registry
      const bundlesData = bundleRegistry.getAll();
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

  function handleSaveBundle(data: BundleFormData) {
    const components: BundleComponent[] = data.componentSkus.map(sku => ({
      sku,
      name: getProductName(sku),
      quantity: 1,
    }));
    
    if (editingBundle) {
      bundleRegistry.update(editingBundle.sku, {
        name: data.name,
        price: data.price,
        components,
      });
    } else {
      bundleRegistry.create({
        sku: data.sku,
        name: data.name,
        price: data.price,
        components,
        isActive: true,
      });
    }
    
    // Reload bundles
    setBundles(bundleRegistry.getAll());
    setShowForm(false);
    setEditingBundle(null);
  }

  function handleDeleteBundle(bundleSku: string) {
    if (!bundleRegistry.isCustomBundle(bundleSku)) {
      alert('Cannot delete default bundles. These are core Capy-Era products.');
      return;
    }
    
    if (confirm(`Delete bundle ${bundleSku}?`)) {
      bundleRegistry.delete(bundleSku);
      setBundles(bundleRegistry.getAll());
    }
  }

  function toggleExpanded(id: string) {
    setExpandedBundles(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  // Get available SKUs for autocomplete
  const availableSkus = useMemo(() => {
    return Object.keys(PRODUCT_NAMES);
  }, []);

  // Filter bundles
  const filteredBundles = useMemo(() => {
    return bundles.filter(b => {
      if (filter === 'all') return true;
      if (filter === 'duo') return b.sku.includes('DUO');
      if (filter === 'family') return b.sku.includes('FAMILY');
      if (filter === 'custom') return bundleRegistry.isCustomBundle(b.sku);
      return true;
    });
  }, [bundles, filter]);

  // Stats
  const stats = useMemo(() => {
    const total = bundles.length;
    const duoCount = bundles.filter(b => b.sku.includes('DUO')).length;
    const familyCount = bundles.filter(b => b.sku.includes('FAMILY')).length;
    const customCount = bundles.filter(b => bundleRegistry.isCustomBundle(b.sku)).length;
    
    let lowAvailability = 0;
    let outOfStock = 0;
    
    for (const bundle of bundles) {
      const { available } = getBundleAvailability(bundle);
      if (available === 0) outOfStock++;
      else if (available < 50) lowAvailability++;
    }
    
    return { total, duoCount, familyCount, customCount, lowAvailability, outOfStock };
  }, [bundles, inventory]);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header 
        title="Bundle Management" 
        subtitle="Manage product bundles with auto-breakdown for orders"
        onRefresh={loadData}
        isLoading={isLoading}
      />
      
      <div className="flex-1 overflow-y-auto p-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <Card className="bg-amber-50">
            <CardContent className="p-4">
              <p className="text-xs text-amber-600 font-medium uppercase">Total Bundles</p>
              <p className="text-2xl font-bold text-amber-700">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-gray-500 font-medium uppercase">Duo Bundles</p>
              <p className="text-2xl font-bold">{stats.duoCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-gray-500 font-medium uppercase">Family Bundles</p>
              <p className="text-2xl font-bold">{stats.familyCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-gray-500 font-medium uppercase">Custom</p>
              <p className="text-2xl font-bold">{stats.customCount}</p>
            </CardContent>
          </Card>
          <Card className={stats.lowAvailability > 0 ? 'bg-yellow-50' : ''}>
            <CardContent className="p-4">
              <p className="text-xs text-yellow-600 font-medium uppercase">Low Avail.</p>
              <p className="text-2xl font-bold text-yellow-700">{stats.lowAvailability}</p>
            </CardContent>
          </Card>
          <Card className={stats.outOfStock > 0 ? 'bg-red-50' : ''}>
            <CardContent className="p-4">
              <p className="text-xs text-red-600 font-medium uppercase">Cannot Fulfill</p>
              <p className="text-2xl font-bold text-red-700">{stats.outOfStock}</p>
            </CardContent>
          </Card>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button
              variant={filter === 'duo' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('duo')}
            >
              Duo
            </Button>
            <Button
              variant={filter === 'family' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('family')}
            >
              Family
            </Button>
            <Button
              variant={filter === 'custom' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('custom')}
            >
              Custom
            </Button>
          </div>
          <Button onClick={() => { setShowForm(true); setEditingBundle(null); }}>
            <Plus className="w-4 h-4 mr-2" />
            Create Bundle
          </Button>
        </div>
        
        {/* Bundle Form */}
        {(showForm || editingBundle) && (
          <div className="mb-6">
            <BundleForm
              bundle={editingBundle || undefined}
              onSave={handleSaveBundle}
              onCancel={() => { setShowForm(false); setEditingBundle(null); }}
              availableSkus={availableSkus}
            />
          </div>
        )}
        
        {/* Bundle Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredBundles.map((bundle) => {
            const { available, limiting } = getBundleAvailability(bundle);
            const isLow = available < 50;
            const isOut = available === 0;
            const isExpanded = expandedBundles.has(bundle.id);
            const isCustom = bundleRegistry.isCustomBundle(bundle.sku);
            
            return (
              <Card key={bundle.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button 
                      onClick={() => toggleExpanded(bundle.id)}
                      className="mt-1 p-1 hover:bg-gray-100 rounded"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <Layers className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base truncate">{bundle.name}</CardTitle>
                      <p className="text-xs text-gray-500 font-mono">{bundle.sku}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {isCustom && (
                      <Badge variant="outline" className="text-xs">Custom</Badge>
                    )}
                    <Badge variant={bundle.isActive ? 'success' : 'default'}>
                      {bundle.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Component Summary or Tree */}
                  {isExpanded ? (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-gray-500 uppercase mb-2">
                        Components ({bundle.components.length})
                      </p>
                      <ComponentTree 
                        components={bundle.components} 
                        inventory={inventory}
                        limitingSku={limiting}
                      />
                    </div>
                  ) : (
                    <div className="mb-4">
                      <p className="text-xs text-gray-500">
                        <span className="font-medium">{bundle.components.length}</span> components: {' '}
                        {bundle.components.map(c => c.sku).join(' + ')}
                      </p>
                    </div>
                  )}
                  
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
                  
                  {/* Price & Actions */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <span className="text-lg font-bold text-gray-900">
                      {formatCurrency(bundle.price)}
                    </span>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => { setEditingBundle(bundle); setShowForm(false); }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      {isCustom && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteBundle(bundle.sku)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        {filteredBundles.length === 0 && !isLoading && (
          <Card className="text-center py-12">
            <CardContent>
              <Layers className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No bundles found</p>
              {filter !== 'all' && (
                <Button variant="link" onClick={() => setFilter('all')}>
                  Show all bundles
                </Button>
              )}
            </CardContent>
          </Card>
        )}
        
        {/* How Bundles Work */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>How Bundle Auto-Breakdown Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm flex-shrink-0">
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
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm flex-shrink-0">
                  2
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Bundle → Components</h4>
                  <p className="text-sm text-gray-500 mt-1">
                    System explodes bundle SKU into component SKUs using the registry mappings.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm flex-shrink-0">
                  3
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Component Deduction</h4>
                  <p className="text-sm text-gray-500 mt-1">
                    Each component's inventory is deducted based on the bundle mapping.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm flex-shrink-0">
                  4
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Velocity at Component Level</h4>
                  <p className="text-sm text-gray-500 mt-1">
                    Velocity calculations aggregate both direct and bundle sales for accurate demand.
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
