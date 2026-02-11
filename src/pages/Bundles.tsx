import React, { useState, useEffect, useMemo } from 'react';
import { 
  Layers, Plus, AlertTriangle, Check, Edit2, Trash2, 
  ChevronDown, ChevronRight, Save, X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input, SearchInput } from '../components/ui/Input';
import { Header } from '../components/layout/Header';
import { ProductThumbnail } from './Products';
import { inventoryApi } from '../services/api';
import { bundleRegistry, getProductName, PRODUCT_NAMES } from '../services/bundleRegistry';
import { productRegistry } from '../services/productRegistry';
import { formatCurrency, formatNumber } from '../lib/utils';
import type { Bundle, BundleComponent, InventoryItem } from '../types';

interface BundleFormData {
  sku: string;
  name: string;
  componentSkus: string[];
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
    onSave({ sku, name, componentSkus });
  };

  // Calculate COGS from components
  const calculatedCogs = useMemo(() => {
    return componentSkus.reduce((sum, compSku) => {
      const product = productRegistry.getBySku(compSku);
      return sum + (product?.cogs || 0);
    }, 0);
  }, [componentSkus]);
  
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
              <label className="block text-sm font-medium text-slate-700 mb-1">Bundle SKU</label>
              <Input
                value={sku}
                onChange={(e) => setSku(e.target.value.toUpperCase())}
                placeholder="CUSTOM-BUNDLE-001"
                disabled={isEditing}
                className="font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Bundle Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Custom Bundle"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Calculated COGS</label>
              <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm font-medium text-slate-700">
                {formatCurrency(calculatedCogs)}
              </div>
            </div>
          </div>
          
          {/* Components */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Components ({componentSkus.length})
            </label>
            
            {/* Add Component */}
            <div className="flex gap-2 mb-3">
              <div className="flex-1">
                <Input
                  value={newComponentSku}
                  onChange={(e) => setNewComponentSku(e.target.value.toUpperCase())}
                  placeholder="Enter SKU to add..."
                  list="available-skus"
                  className="font-mono"
                />
                <datalist id="available-skus">
                  {availableSkus.map(s => (
                    <option key={s} value={s}>{getProductName(s)}</option>
                  ))}
                </datalist>
              </div>
              <Button type="button" variant="outline" onClick={handleAddComponent}>
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>
            
            {/* Component List */}
            {componentSkus.length > 0 ? (
              <div className="space-y-2 p-3 bg-slate-50 rounded-lg border">
                {componentSkus.map((compSku) => {
                  const product = productRegistry.getBySku(compSku);
                  return (
                    <div key={compSku} className="flex items-center gap-3 p-2 bg-white rounded-lg border">
                      <ProductThumbnail sku={compSku} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{getProductName(compSku)}</p>
                        <p className="text-xs text-slate-500 font-mono">{compSku}</p>
                      </div>
                      <span className="text-sm text-slate-600">
                        COGS: {formatCurrency(product?.cogs || 0)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveComponent(compSku)}
                        className="p-1 hover:bg-red-50 rounded text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic p-4 bg-slate-50 rounded-lg border border-dashed text-center">
                No components added yet. Add component SKUs above.
              </p>
            )}
          </div>
          
          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={!sku || !name || componentSkus.length === 0}>
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
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    try {
      const [inventoryData] = await Promise.all([
        inventoryApi.getAll(),
      ]);
      
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

  function getBundleCogs(bundle: Bundle): number {
    return bundle.components.reduce((sum, comp) => {
      const product = productRegistry.getBySku(comp.sku);
      return sum + (product?.cogs || 0) * comp.quantity;
    }, 0);
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
        components,
      });
    } else {
      bundleRegistry.create({
        sku: data.sku,
        name: data.name,
        price: 0, // Price syncs from Shopify
        components,
        isActive: true,
      });
    }
    
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

  const availableSkus = useMemo(() => {
    return Object.keys(PRODUCT_NAMES);
  }, []);

  const filteredBundles = useMemo(() => {
    return bundles.filter(b => {
      // Filter by type
      if (filter === 'duo' && !b.sku.includes('DUO')) return false;
      if (filter === 'family' && !b.sku.includes('FAMILY')) return false;
      if (filter === 'custom' && !bundleRegistry.isCustomBundle(b.sku)) return false;
      
      // Filter by search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!b.sku.toLowerCase().includes(q) && !b.name.toLowerCase().includes(q)) {
          return false;
        }
      }
      
      return true;
    });
  }, [bundles, filter, searchQuery]);

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
              <p className="text-xs text-slate-500 font-medium uppercase">Duo Bundles</p>
              <p className="text-2xl font-bold">{stats.duoCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-slate-500 font-medium uppercase">Family Bundles</p>
              <p className="text-2xl font-bold">{stats.familyCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-slate-500 font-medium uppercase">Custom</p>
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
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-[200px]">
            <SearchInput 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search bundles..."
            />
          </div>
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
        
        {/* Bundle Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-700 w-8"></th>
                  <th className="px-4 py-3 text-left font-medium text-slate-700">Bundle</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-700">Components</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-700">COGS</th>
                  <th className="px-4 py-3 text-center font-medium text-slate-700">Availability</th>
                  <th className="px-4 py-3 text-center font-medium text-slate-700">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredBundles.map((bundle) => {
                  const { available, limiting } = getBundleAvailability(bundle);
                  const isLow = available < 50 && available > 0;
                  const isOut = available === 0;
                  const isExpanded = expandedBundles.has(bundle.id);
                  const isCustom = bundleRegistry.isCustomBundle(bundle.sku);
                  const cogs = getBundleCogs(bundle);
                  
                  return (
                    <React.Fragment key={bundle.id}>
                      <tr className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <button 
                            onClick={() => toggleExpanded(bundle.id)}
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
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                              <Layers className="w-4 h-4 text-amber-600" />
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">{bundle.name}</p>
                              <p className="text-xs text-slate-500 font-mono">{bundle.sku}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-slate-600">
                            {bundle.components.length} items: {bundle.components.map(c => c.sku).join(' + ')}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {formatCurrency(cogs)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`font-semibold ${
                            isOut ? 'text-red-600' : isLow ? 'text-yellow-600' : 'text-green-600'
                          }`}>
                            {formatNumber(available)}
                          </span>
                          {limiting && available < 100 && (
                            <p className="text-xs text-slate-500">
                              Limited: {limiting}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={isOut ? 'danger' : isLow ? 'warning' : 'success'}>
                            {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                          </Badge>
                          {isCustom && (
                            <Badge variant="outline" className="ml-1">Custom</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
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
                        </td>
                      </tr>
                      {/* Expanded component rows */}
                      {isExpanded && bundle.components.map((component, idx) => {
                        const stock = getComponentStock(component.sku);
                        const isLimitingComponent = component.sku === limiting;
                        const product = productRegistry.getBySku(component.sku);
                        
                        return (
                          <tr key={`${bundle.id}-${component.sku}`} className="bg-slate-50/50">
                            <td className="px-4 py-2"></td>
                            <td className="px-4 py-2 pl-12">
                              <div className="flex items-center gap-3">
                                <span className="text-slate-400 text-xs">
                                  {idx === bundle.components.length - 1 ? '└' : '├'}
                                </span>
                                <ProductThumbnail sku={component.sku} size="sm" />
                                <div>
                                  <p className="text-sm text-slate-700">{component.name}</p>
                                  <p className="text-xs text-slate-500 font-mono">{component.sku}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-2 text-slate-500 text-sm">
                              ×{component.quantity} per bundle
                            </td>
                            <td className="px-4 py-2 text-right text-sm text-slate-600">
                              {formatCurrency(product?.cogs || 0)}
                            </td>
                            <td className="px-4 py-2 text-center">
                              <span className={`text-sm ${isLimitingComponent && stock < 50 ? 'text-amber-600 font-medium' : 'text-slate-600'}`}>
                                {formatNumber(stock)} in stock
                              </span>
                            </td>
                            <td className="px-4 py-2 text-center">
                              {isLimitingComponent && stock < 50 && (
                                <Badge variant="warning">Limiting</Badge>
                              )}
                            </td>
                            <td></td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
        
        {filteredBundles.length === 0 && !isLoading && (
          <Card className="text-center py-12 mt-4">
            <CardContent>
              <Layers className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No bundles found</p>
              {filter !== 'all' && (
                <Button variant="link" onClick={() => setFilter('all')}>
                  Show all bundles
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
