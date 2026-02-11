import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit2, Trash2, Upload, Download, Package, ChevronDown, ChevronRight, History, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input, SearchInput } from '../components/ui/Input';
import { Header } from '../components/layout/Header';
import { supplierRegistry, SupplierData, SUPPLIER_CATEGORIES } from '../services/supplierRegistry';
import { poRegistry } from '../services/poRegistry';
import { productRegistry, PRODUCT_CATEGORIES } from '../services/productRegistry';
import { formatNumber } from '../lib/utils';

// Mars Sheet supplier data for import
const MARS_SUPPLIERS = [
  { code: 'CPY_A01', name: 'Youdingzhi Textile', category: 'Plush Toys' },
  { code: 'CPY_A02', name: 'Weihong Toys', category: 'Plush Toys' },
  { code: 'CPY_A03', name: 'Minjin International', category: 'Plush Toys' },
  { code: 'CPY_B01', name: 'Tong Qin Qin Textile', category: 'Apparels' },
  { code: 'CPY_B02', name: '石家庄优跃纺织品有', category: 'Apparels' },
  { code: 'CPY_Y01', name: '台州市路桥国久二龙包装有限公司', category: 'Accessories' },
  { code: 'CPY_Y02', name: '温州凯优印刷有限公司', category: 'Accessories' },
  { code: 'CPY_Y03', name: 'Tong Qin Qin Textile', category: 'Accessories' },
  { code: 'CPY_Y04', name: '顺意布艺', category: 'Accessories' },
  { code: 'CPY_P02', name: '温州义铭工艺品有限公司', category: 'Packaging' },
  { code: 'CPY_P03', name: '东台市振合包装材料有限公司', category: 'Packaging' },
  { code: 'CPY_P04', name: '国原包装(东莞)有限公司', category: 'Packaging' },
  { code: 'CPY_P05', name: '广州曼联包装', category: 'Packaging' },
  { code: 'CPY_P06', name: '泉州市冠宇机械有限公司', category: 'Packaging' },
  { code: 'CPY_Z01', name: '深圳市金瑞创新辅料有限公司', category: 'Auxiliary Materials' },
  { code: 'CPY_Z02', name: '义乌市往腾科技有限公司', category: 'Auxiliary Materials' },
];

interface SupplierFormProps {
  supplier?: SupplierData;
  onSave: (data: Omit<SupplierData, 'id'>) => void;
  onCancel: () => void;
}

function SupplierFormModal({ supplier, onSave, onCancel }: SupplierFormProps) {
  const [code, setCode] = useState(supplier?.code || '');
  const [name, setName] = useState(supplier?.name || '');
  const [category, setCategory] = useState(supplier?.category || '');
  const [email, setEmail] = useState(supplier?.email || '');
  const [phone, setPhone] = useState(supplier?.phone || '');
  const [address, setAddress] = useState(supplier?.address || '');
  const [selectedSkus, setSelectedSkus] = useState<string[]>(supplier?.skus || []);
  const [notes, setNotes] = useState(supplier?.notes || '');
  const [skuSearch, setSkuSearch] = useState('');
  const [skuCategoryFilter, setSkuCategoryFilter] = useState<string>('all');
  const [skuSubcategoryFilter, setSkuSubcategoryFilter] = useState<string>('all');

  // Get all products for SKU selection
  const allProducts = productRegistry.getAll();
  
  // Get subcategories for selected category
  const productSubcategories = useMemo(() => {
    if (skuCategoryFilter === 'all') return [];
    const catData = PRODUCT_CATEGORIES[skuCategoryFilter as keyof typeof PRODUCT_CATEGORIES];
    return catData?.subcategories || [];
  }, [skuCategoryFilter]);

  // Filter products by category, subcategory, and search
  const filteredProducts = useMemo(() => {
    let products = allProducts;
    
    // Filter by category
    if (skuCategoryFilter !== 'all') {
      products = products.filter(p => p.category === skuCategoryFilter);
    }
    
    // Filter by subcategory
    if (skuSubcategoryFilter !== 'all') {
      products = products.filter(p => p.subcategory === skuSubcategoryFilter);
    }
    
    // Filter by search
    if (skuSearch) {
      const q = skuSearch.toLowerCase();
      products = products.filter(p => 
        p.sku.toLowerCase().includes(q) || p.name.toLowerCase().includes(q)
      );
    }
    
    return products;
  }, [allProducts, skuCategoryFilter, skuSubcategoryFilter, skuSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      code,
      name,
      category,
      email: email || undefined,
      phone: phone || undefined,
      address: address || undefined,
      skus: selectedSkus.length > 0 ? selectedSkus : undefined,
      notes: notes || undefined,
    });
  };

  const toggleSku = (sku: string) => {
    setSelectedSkus(prev => 
      prev.includes(sku) ? prev.filter(s => s !== sku) : [...prev, sku]
    );
  };

  const selectAllFiltered = () => {
    const newSkus = filteredProducts.map(p => p.sku);
    setSelectedSkus(prev => [...new Set([...prev, ...newSkus])]);
  };

  const clearAllSelected = () => {
    setSelectedSkus([]);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between border-b flex-shrink-0">
          <CardTitle>{supplier ? 'Edit Supplier' : 'Add New Supplier'}</CardTitle>
          <button onClick={onCancel} className="p-1 hover:bg-slate-100 rounded">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </CardHeader>
        <CardContent className="overflow-y-auto flex-1 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Supplier Code *</label>
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="CPY_A01"
                  required
                  disabled={!!supplier}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Supplier Name *</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Supplier Name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                >
                  <option value="">Select category...</option>
                  {SUPPLIER_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@supplier.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+86 123 456 7890"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Full supplier address..."
              />
            </div>

            {/* SKU Assignment with Category Filter */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-700">
                  Assigned SKUs ({selectedSkus.length})
                </label>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={selectAllFiltered}>
                    Select All Shown
                  </Button>
                  {selectedSkus.length > 0 && (
                    <Button type="button" variant="outline" size="sm" onClick={clearAllSelected}>
                      Clear All
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Selected SKUs */}
              {selectedSkus.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3 p-2 bg-amber-50 rounded-lg border border-amber-200 max-h-24 overflow-y-auto">
                  {selectedSkus.map(sku => (
                    <Badge 
                      key={sku} 
                      variant="default"
                      className="cursor-pointer hover:bg-red-100 hover:text-red-700"
                      onClick={() => toggleSku(sku)}
                    >
                      {sku} ×
                    </Badge>
                  ))}
                </div>
              )}

              {/* Filters */}
              <div className="flex gap-2 mb-2">
                <select
                  value={skuCategoryFilter}
                  onChange={(e) => {
                    setSkuCategoryFilter(e.target.value);
                    setSkuSubcategoryFilter('all');
                  }}
                  className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                >
                  <option value="all">All Categories</option>
                  {Object.entries(PRODUCT_CATEGORIES).map(([key, cat]) => (
                    <option key={key} value={key}>{cat.label}</option>
                  ))}
                </select>
                
                {productSubcategories.length > 0 && (
                  <select
                    value={skuSubcategoryFilter}
                    onChange={(e) => setSkuSubcategoryFilter(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  >
                    <option value="all">All Subcategories</option>
                    {productSubcategories.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                )}
                
                <Input
                  value={skuSearch}
                  onChange={(e) => setSkuSearch(e.target.value)}
                  placeholder="Search SKU or name..."
                  className="flex-1"
                />
              </div>

              {/* SKU List */}
              <div className="border border-slate-200 rounded-lg bg-white max-h-48 overflow-y-auto">
                {filteredProducts.length > 0 ? (
                  <div className="divide-y">
                    {filteredProducts.map(p => {
                      const isSelected = selectedSkus.includes(p.sku);
                      return (
                        <button
                          key={p.sku}
                          type="button"
                          onClick={() => toggleSku(p.sku)}
                          className={`w-full text-left px-3 py-2 text-sm flex justify-between items-center hover:bg-slate-50 ${
                            isSelected ? 'bg-amber-50' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input 
                              type="checkbox" 
                              checked={isSelected}
                              onChange={() => {}}
                              className="rounded text-amber-600"
                            />
                            <span className="font-mono text-slate-600">{p.sku}</span>
                          </div>
                          <span className="text-slate-500 truncate ml-2">{p.name}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 p-4 text-center">
                    No products found. Add products first.
                  </p>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Showing {filteredProducts.length} products
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
              <Button type="submit" disabled={!code || !name}>
                {supplier ? 'Update Supplier' : 'Add Supplier'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export function Suppliers() {
  const [suppliers, setSuppliers] = useState<SupplierData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<SupplierData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSuppliers, setExpandedSuppliers] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadSuppliers();
  }, []);

  function loadSuppliers() {
    setIsLoading(true);
    const data = supplierRegistry.getAll();
    setSuppliers(data);
    setIsLoading(false);
  }

  function handleSave(data: Omit<SupplierData, 'id'>) {
    if (editingSupplier) {
      supplierRegistry.update(editingSupplier.id, data);
    } else {
      supplierRegistry.create(data);
    }
    loadSuppliers();
    setShowForm(false);
    setEditingSupplier(null);
  }

  function handleDelete(id: string) {
    if (confirm('Delete this supplier?')) {
      supplierRegistry.delete(id);
      loadSuppliers();
    }
  }

  function handleDeleteAll() {
    if (confirm('Delete ALL suppliers? This cannot be undone.')) {
      supplierRegistry.deleteAll();
      loadSuppliers();
    }
  }

  function handleImportMars() {
    const count = supplierRegistry.bulkImport(MARS_SUPPLIERS);
    alert(`Imported ${count} new suppliers from Mars sheet. ${MARS_SUPPLIERS.length - count} were updated.`);
    loadSuppliers();
  }

  function handleExport() {
    const json = supplierRegistry.exportJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'capy-suppliers.json';
    a.click();
  }

  function toggleExpanded(id: string) {
    setExpandedSuppliers(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Get PO history for a supplier
  function getSupplierPOHistory(supplierCode: string) {
    const allPOs = poRegistry.getAll();
    return allPOs.filter(po => po.supplierCode === supplierCode);
  }

  // Get PO summary for supplier
  function getSupplierPOSummary(supplierCode: string) {
    const pos = getSupplierPOHistory(supplierCode);
    const poNumbers = [...new Set(pos.map(p => p.poNumber))];
    return poNumbers.map(poNum => {
      const lines = pos.filter(p => p.poNumber === poNum);
      const totalOrdered = lines.reduce((sum, l) => sum + l.qtyOrdered, 0);
      const totalReceived = lines.reduce((sum, l) => sum + l.qtyReceived, 0);
      return {
        poNumber: poNum,
        skuCount: lines.length,
        totalOrdered,
        totalReceived,
        status: totalReceived >= totalOrdered ? 'Complete' : totalReceived > 0 ? 'Partial' : 'Pending',
      };
    });
  }

  const filteredSuppliers = suppliers.filter(s => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return s.code.toLowerCase().includes(q) || 
           s.name.toLowerCase().includes(q) ||
           s.category.toLowerCase().includes(q);
  });

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header 
        title="Suppliers" 
        subtitle={`${suppliers.length} suppliers`}
        onRefresh={loadSuppliers}
        isLoading={isLoading}
      />
      
      <div className="flex-1 overflow-y-auto p-6">
        {/* Modal Form */}
        {(showForm || editingSupplier) && (
          <SupplierFormModal
            supplier={editingSupplier || undefined}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditingSupplier(null); }}
          />
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-[200px] max-w-md">
            <SearchInput
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search suppliers..."
            />
          </div>
          <Button variant="outline" onClick={handleImportMars}>
            <Upload className="w-4 h-4 mr-2" />
            Import from Mars
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          {suppliers.length > 0 && (
            <Button variant="outline" onClick={handleDeleteAll} className="text-red-600 hover:bg-red-50">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete All
            </Button>
          )}
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Supplier
          </Button>
        </div>

        {/* Supplier Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-700 w-8"></th>
                  <th className="px-4 py-3 text-left font-medium text-slate-700">Code</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-700">Supplier Name</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-700">Category</th>
                  <th className="px-4 py-3 text-center font-medium text-slate-700">SKUs</th>
                  <th className="px-4 py-3 text-center font-medium text-slate-700">PO History</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-700">Contact</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredSuppliers.map((supplier) => {
                  const isExpanded = expandedSuppliers.has(supplier.id);
                  const poHistory = getSupplierPOSummary(supplier.code);
                  
                  return (
                    <React.Fragment key={supplier.id}>
                      <tr className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <button 
                            onClick={() => toggleExpanded(supplier.id)}
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
                          <span className="font-mono text-sm font-medium text-amber-700">{supplier.code}</span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900">{supplier.name}</p>
                        </td>
                        <td className="px-4 py-3">
                          {supplier.category && <Badge variant="outline">{supplier.category}</Badge>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {supplier.skus?.length || 0}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <History className="w-4 h-4 text-slate-400" />
                            <span>{poHistory.length} POs</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600 text-sm">
                          {supplier.email || supplier.phone || '-'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingSupplier(supplier)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(supplier.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                      
                      {/* Expanded: Address, SKUs, PO History */}
                      {isExpanded && (
                        <tr className="bg-slate-50/50">
                          <td></td>
                          <td colSpan={7} className="px-4 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Details */}
                              <div className="space-y-3">
                                {supplier.address && (
                                  <div>
                                    <p className="text-xs font-medium text-slate-500 uppercase mb-1">Address</p>
                                    <p className="text-sm text-slate-700">{supplier.address}</p>
                                  </div>
                                )}
                                {supplier.notes && (
                                  <div>
                                    <p className="text-xs font-medium text-slate-500 uppercase mb-1">Notes</p>
                                    <p className="text-sm text-slate-700">{supplier.notes}</p>
                                  </div>
                                )}
                                {supplier.skus && supplier.skus.length > 0 && (
                                  <div>
                                    <p className="text-xs font-medium text-slate-500 uppercase mb-1">
                                      Assigned SKUs ({supplier.skus.length})
                                    </p>
                                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                                      {supplier.skus.map(sku => (
                                        <Badge key={sku} variant="outline" className="text-xs">{sku}</Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              {/* PO History */}
                              <div>
                                <p className="text-xs font-medium text-slate-500 uppercase mb-2">PO History</p>
                                {poHistory.length > 0 ? (
                                  <div className="space-y-2 max-h-32 overflow-y-auto">
                                    {poHistory.map(po => (
                                      <div key={po.poNumber} className="flex items-center justify-between p-2 bg-white rounded border text-sm">
                                        <div>
                                          <span className="font-mono font-medium text-amber-700">{po.poNumber}</span>
                                          <span className="text-slate-500 ml-2">({po.skuCount} SKUs)</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                          <span className="text-slate-600">
                                            {formatNumber(po.totalReceived)} / {formatNumber(po.totalOrdered)}
                                          </span>
                                          <Badge variant={
                                            po.status === 'Complete' ? 'success' :
                                            po.status === 'Partial' ? 'info' : 'warning'
                                          } className="text-xs">
                                            {po.status}
                                          </Badge>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-slate-500 italic">No PO history</p>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {filteredSuppliers.length === 0 && !isLoading && (
          <Card className="text-center py-12 mt-4">
            <CardContent>
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 mb-4">No suppliers found</p>
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
