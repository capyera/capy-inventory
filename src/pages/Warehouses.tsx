import { useState, useEffect, useMemo } from 'react';
import { 
  Warehouse as WarehouseIcon, 
  MapPin, 
  CheckCircle2,
  Package,
  Plus,
  Edit2,
  Trash2,
  Globe
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Header } from '../components/layout/Header';
import { formatNumber } from '../lib/utils';
import { inventoryApi } from '../services/api';
import type { InventoryItem } from '../types';

interface Warehouse {
  id: string;
  name: string;
  location: string;
  country: string;
  type: 'fulfillment' | 'marketplace' | 'backup';
  isActive: boolean;
  isPrimary: boolean;
}

// Current warehouse - SpeedFulfill China
const DEFAULT_WAREHOUSES: Warehouse[] = [
  {
    id: 'speedfulfill-cn',
    name: 'SpeedFulfill Warehouse',
    location: 'Shenzhen',
    country: 'China',
    type: 'fulfillment',
    isActive: true,
    isPrimary: true,
  },
];

const STORAGE_KEY = 'capy-warehouses';

function loadWarehouses(): Warehouse[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load warehouses:', e);
  }
  return DEFAULT_WAREHOUSES;
}

function saveWarehouses(warehouses: Warehouse[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(warehouses));
}

interface WarehouseFormProps {
  warehouse?: Warehouse;
  onSave: (data: Omit<Warehouse, 'id'>) => void;
  onCancel: () => void;
}

function WarehouseForm({ warehouse, onSave, onCancel }: WarehouseFormProps) {
  const [name, setName] = useState(warehouse?.name || '');
  const [location, setLocation] = useState(warehouse?.location || '');
  const [country, setCountry] = useState(warehouse?.country || '');
  const [type, setType] = useState<Warehouse['type']>(warehouse?.type || 'fulfillment');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      location,
      country,
      type,
      isActive: true,
      isPrimary: false,
    });
  };
  
  return (
    <Card className="border-2 border-amber-300 bg-amber-50/30 mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <WarehouseIcon className="w-5 h-5 text-amber-600" />
          {warehouse ? 'Edit Warehouse' : 'Add New Warehouse'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Warehouse Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="SpeedFulfill Warehouse"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">City/Location</label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Shenzhen"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Country</label>
              <Input
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="China"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as Warehouse['type'])}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              >
                <option value="fulfillment">Fulfillment Center</option>
                <option value="marketplace">Marketplace Warehouse</option>
                <option value="backup">Backup / Reserve</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name || !location || !country}>
              {warehouse ? 'Update Warehouse' : 'Add Warehouse'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function Warehouses() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    try {
      const [inventoryData] = await Promise.all([
        inventoryApi.getAll(),
      ]);
      setInventory(inventoryData);
      setWarehouses(loadWarehouses());
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSaveWarehouse(data: Omit<Warehouse, 'id'>) {
    if (editingWarehouse) {
      // Update
      const updated = warehouses.map(w => 
        w.id === editingWarehouse.id ? { ...w, ...data } : w
      );
      setWarehouses(updated);
      saveWarehouses(updated);
    } else {
      // Create
      const newWarehouse: Warehouse = {
        ...data,
        id: `wh-${Date.now()}`,
      };
      const updated = [...warehouses, newWarehouse];
      setWarehouses(updated);
      saveWarehouses(updated);
    }
    setShowForm(false);
    setEditingWarehouse(null);
  }

  function handleDeleteWarehouse(id: string) {
    const wh = warehouses.find(w => w.id === id);
    if (wh?.isPrimary) {
      alert('Cannot delete the primary warehouse.');
      return;
    }
    if (confirm('Delete this warehouse?')) {
      const updated = warehouses.filter(w => w.id !== id);
      setWarehouses(updated);
      saveWarehouses(updated);
    }
  }

  // Stats - all inventory in primary warehouse
  const stats = useMemo(() => {
    const totalUnits = inventory.reduce((sum, item) => sum + item.currentQty, 0);
    const totalSkus = inventory.length;
    const lowStock = inventory.filter(i => i.currentQty > 0 && i.currentQty < 50).length;
    const outOfStock = inventory.filter(i => i.currentQty === 0).length;
    
    return { totalUnits, totalSkus, lowStock, outOfStock };
  }, [inventory]);

  const primaryWarehouse = warehouses.find(w => w.isPrimary);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header 
        title="Warehouses" 
        subtitle="Manage inventory locations"
        onRefresh={loadData}
        isLoading={isLoading}
      />
      
      <div className="flex-1 overflow-y-auto p-6">
        {/* Primary Warehouse Card */}
        {primaryWarehouse && (
          <Card className="mb-6 border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-amber-100 flex items-center justify-center">
                    <WarehouseIcon className="w-7 h-7 text-amber-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-semibold text-slate-900">{primaryWarehouse.name}</h2>
                      <Badge variant="warning">Primary</Badge>
                      <Badge variant="success">Active</Badge>
                    </div>
                    <div className="flex items-center gap-1 text-slate-600 mt-1">
                      <MapPin className="w-4 h-4" />
                      <span>{primaryWarehouse.location}, {primaryWarehouse.country}</span>
                    </div>
                    <p className="text-sm text-slate-500 mt-2">
                      All current inventory is stored at this location
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-sm font-medium">Connected</span>
                </div>
              </div>
              
              {/* Inventory Summary */}
              <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-amber-200">
                <div className="text-center">
                  <p className="text-3xl font-bold text-amber-700">{formatNumber(stats.totalUnits)}</p>
                  <p className="text-sm text-slate-600">Total Units</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-slate-700">{stats.totalSkus}</p>
                  <p className="text-sm text-slate-600">SKUs</p>
                </div>
                <div className="text-center">
                  <p className={`text-3xl font-bold ${stats.lowStock > 0 ? 'text-yellow-600' : 'text-slate-400'}`}>
                    {stats.lowStock}
                  </p>
                  <p className="text-sm text-slate-600">Low Stock</p>
                </div>
                <div className="text-center">
                  <p className={`text-3xl font-bold ${stats.outOfStock > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                    {stats.outOfStock}
                  </p>
                  <p className="text-sm text-slate-600">Out of Stock</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add Warehouse Button */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-slate-900">All Warehouses</h3>
          <Button onClick={() => { setShowForm(true); setEditingWarehouse(null); }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Warehouse
          </Button>
        </div>

        {/* Warehouse Form */}
        {(showForm || editingWarehouse) && (
          <WarehouseForm
            warehouse={editingWarehouse || undefined}
            onSave={handleSaveWarehouse}
            onCancel={() => { setShowForm(false); setEditingWarehouse(null); }}
          />
        )}

        {/* Warehouse List/Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-700">Warehouse</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-700">Location</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-700">Type</th>
                  <th className="px-4 py-3 text-center font-medium text-slate-700">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-700">Units</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {warehouses.map((wh) => (
                  <tr key={wh.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                          <WarehouseIcon className="w-4 h-4 text-slate-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{wh.name}</p>
                          {wh.isPrimary && (
                            <Badge variant="warning" className="mt-0.5">Primary</Badge>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-slate-600">
                        <Globe className="w-4 h-4" />
                        <span>{wh.location}, {wh.country}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-slate-600 capitalize">{wh.type.replace('_', ' ')}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={wh.isActive ? 'success' : 'default'}>
                        {wh.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {wh.isPrimary ? formatNumber(stats.totalUnits) : '0'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setEditingWarehouse(wh); setShowForm(false); }}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        {!wh.isPrimary && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteWarehouse(wh.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Info Card */}
        <Card className="mt-6">
          <CardContent className="p-6">
            <h3 className="font-semibold text-slate-900 mb-3">📦 Multi-Warehouse Support</h3>
            <p className="text-sm text-slate-600">
              Currently all inventory is tracked at your primary fulfillment center ({primaryWarehouse?.name}). 
              As you expand to additional locations (Amazon FBA, TikTok Shop warehouses, etc.), 
              add them here to track inventory across multiple locations.
            </p>
            <div className="mt-4 p-3 bg-slate-50 rounded-lg text-sm text-slate-600">
              <strong>Coming soon:</strong> Inventory transfers between warehouses, 
              multi-location stock levels, and automatic restock recommendations.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
