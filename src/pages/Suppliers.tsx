import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Upload, Download, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input, SearchInput } from '../components/ui/Input';
import { Header } from '../components/layout/Header';
import { supplierRegistry, SupplierData } from '../services/supplierRegistry';

// Mars Sheet supplier data for import
const MARS_SUPPLIERS = [
  { code: 'CPY_A01', name: 'Youdingzhi Textile', category: 'Plush Toys' },
  { code: 'CPY_A02', name: 'Weihong Toys', category: 'Plush Toys' },
  { code: 'CPY_A03', name: 'Minjin International', category: 'Plush Toys' },
  { code: 'CPY_B01', name: 'Tong Qin Qin Textile', category: 'Apparels' },
  { code: 'CPY_B02', name: '石家庄优跃纺织品有', category: 'Apparels' },
  { code: 'CPY_Y01', name: '台州市路桥国久二龙包装有限公司', category: 'Accessory' },
  { code: 'CPY_Y02', name: '温州凯优印刷有限公司', category: 'Accessory' },
  { code: 'CPY_Y03', name: 'Tong Qin Qin Textile', category: 'Accessory' },
  { code: 'CPY_Y04', name: '顺意布艺', category: 'Accessory' },
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

function SupplierForm({ supplier, onSave, onCancel }: SupplierFormProps) {
  const [code, setCode] = useState(supplier?.code || '');
  const [name, setName] = useState(supplier?.name || '');
  const [category, setCategory] = useState(supplier?.category || '');
  const [email, setEmail] = useState(supplier?.email || '');
  const [phone, setPhone] = useState(supplier?.phone || '');
  const [leadTimeDays, setLeadTimeDays] = useState(supplier?.leadTimeDays?.toString() || '');
  const [notes, setNotes] = useState(supplier?.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      code,
      name,
      category,
      email: email || undefined,
      phone: phone || undefined,
      leadTimeDays: leadTimeDays ? parseInt(leadTimeDays) : undefined,
      notes: notes || undefined,
    });
  };

  return (
    <Card className="border-2 border-amber-300 bg-amber-50/30 mb-6">
      <CardHeader>
        <CardTitle>{supplier ? 'Edit Supplier' : 'Add New Supplier'}</CardTitle>
      </CardHeader>
      <CardContent>
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
              <Input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Plush Toys, Apparels, etc."
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Lead Time (days)</label>
              <Input
                type="number"
                value={leadTimeDays}
                onChange={(e) => setLeadTimeDays(e.target.value)}
                placeholder="14"
              />
            </div>
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
  );
}

export function Suppliers() {
  const [suppliers, setSuppliers] = useState<SupplierData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<SupplierData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredSuppliers = suppliers.filter(s => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return s.code.toLowerCase().includes(q) || 
           s.name.toLowerCase().includes(q) ||
           s.category.toLowerCase().includes(q);
  });

  // Group by category
  const categories = [...new Set(suppliers.map(s => s.category).filter(Boolean))];

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header 
        title="Suppliers" 
        subtitle={`${suppliers.length} suppliers`}
        onRefresh={loadSuppliers}
        isLoading={isLoading}
      />
      
      <div className="flex-1 overflow-y-auto p-6">
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
          <Button onClick={() => { setShowForm(true); setEditingSupplier(null); }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Supplier
          </Button>
        </div>

        {/* Form */}
        {(showForm || editingSupplier) && (
          <SupplierForm
            supplier={editingSupplier || undefined}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditingSupplier(null); }}
          />
        )}

        {/* Supplier Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-700">Code</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-700">Supplier Name</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-700">Category</th>
                  <th className="px-4 py-3 text-center font-medium text-slate-700">Lead Time</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-700">Contact</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredSuppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-slate-50">
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
                      {supplier.leadTimeDays ? `${supplier.leadTimeDays} days` : '-'}
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-sm">
                      {supplier.email || supplier.phone || '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setEditingSupplier(supplier); setShowForm(false); }}
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
                ))}
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
