import { useState, useEffect } from 'react';
import { Plus, Mail, Phone, Clock, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Header } from '../components/layout/Header';
import { suppliersApi } from '../services/api';
import type { Supplier } from '../types';

export function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSuppliers();
  }, []);

  async function loadSuppliers() {
    setIsLoading(true);
    try {
      const data = await suppliersApi.getAll();
      setSuppliers(data);
    } catch (error) {
      console.error('Failed to load suppliers:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header 
        title="Suppliers" 
        subtitle="Manage supplier relationships and lead times"
        onRefresh={loadSuppliers}
        isLoading={isLoading}
      />
      
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-600">
            {suppliers.length} suppliers configured
          </p>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Supplier
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {suppliers.map((supplier) => (
            <Card key={supplier.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-lg">
                    {supplier.code.slice(0, 2)}
                  </div>
                  <div>
                    <CardTitle className="text-base">{supplier.name}</CardTitle>
                    <p className="text-xs text-gray-500 font-mono">{supplier.code}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Contact Info */}
                <div className="space-y-2 mb-4">
                  {supplier.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <a href={`mailto:${supplier.email}`} className="hover:text-amber-600">
                        {supplier.email}
                      </a>
                    </div>
                  )}
                  {supplier.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{supplier.phone}</span>
                    </div>
                  )}
                </div>
                
                {/* Lead Time & MOQ */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                      <Clock className="w-3 h-3" />
                      Lead Time
                    </div>
                    <p className="text-lg font-bold">{supplier.leadTimeDays} days</p>
                  </div>
                  {supplier.minOrderQty && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                        <Package className="w-3 h-3" />
                        MOQ
                      </div>
                      <p className="text-lg font-bold">{supplier.minOrderQty}</p>
                    </div>
                  )}
                </div>
                
                {/* Products */}
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-2">Products Supplied</p>
                  <div className="flex flex-wrap gap-1">
                    {supplier.products.map((product, i) => (
                      <Badge key={i} variant="default">{product}</Badge>
                    ))}
                  </div>
                </div>
                
                {/* Notes */}
                {supplier.notes && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-gray-500">{supplier.notes}</p>
                  </div>
                )}
                
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    View Orders
                  </Button>
                  <Button variant="primary" size="sm" className="flex-1">
                    Create PO
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {/* Add New Card */}
          <Card 
            className="border-dashed border-2 hover:border-amber-400 hover:bg-amber-50/50 transition-colors cursor-pointer"
            onClick={() => {}}
          >
            <CardContent className="flex flex-col items-center justify-center h-full min-h-[300px] text-gray-400">
              <Plus className="w-12 h-12 mb-3" />
              <p className="font-medium">Add New Supplier</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
