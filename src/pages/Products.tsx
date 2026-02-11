import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Package, Plus, Upload, Download, Edit2, Trash2, 
  Image as ImageIcon, X, Check, AlertCircle, FileText, ChevronDown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input, SearchInput } from '../components/ui/Input';
import { Header } from '../components/layout/Header';
import { productRegistry, parseCSV, type ProductMasterData, type ProductCSVRow } from '../services/productRegistry';
import { formatCurrency, formatNumber, cn } from '../lib/utils';

// Product form component
interface ProductFormProps {
  product?: ProductMasterData;
  onSave: (data: Partial<ProductMasterData> & { sku: string }) => void;
  onCancel: () => void;
}

function ProductForm({ product, onSave, onCancel }: ProductFormProps) {
  const [formData, setFormData] = useState({
    sku: product?.sku || '',
    name: product?.name || '',
    category: product?.category || 'plushie',
    cogs: product?.cogs?.toString() || '',
    weight: product?.weight?.toString() || '',
    length: product?.dimensions?.length?.toString() || '',
    width: product?.dimensions?.width?.toString() || '',
    height: product?.dimensions?.height?.toString() || '',
    retailPrice: product?.retailPrice?.toString() || '',
    notes: product?.notes || '',
  });
  const [imagePreview, setImagePreview] = useState<string | null>(
    product ? productRegistry.getImageUrl(product.sku) : null
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let imageBase64: string | undefined;
    let imageMimeType: string | undefined;
    
    if (imageFile) {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(imageFile);
      });
      imageBase64 = base64;
      imageMimeType = imageFile.type;
    }
    
    onSave({
      sku: formData.sku.trim().toUpperCase(),
      name: formData.name.trim(),
      category: formData.category as ProductMasterData['category'],
      cogs: parseFloat(formData.cogs) || 0,
      weight: parseFloat(formData.weight) || 0,
      dimensions: {
        length: parseFloat(formData.length) || 0,
        width: parseFloat(formData.width) || 0,
        height: parseFloat(formData.height) || 0,
      },
      retailPrice: formData.retailPrice ? parseFloat(formData.retailPrice) : undefined,
      notes: formData.notes.trim() || undefined,
      ...(imageBase64 && { imageBase64, imageMimeType }),
    });
  };
  
  const isEditing = !!product;
  
  return (
    <Card className="border-2 border-amber-300 bg-amber-50/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5 text-amber-600" />
          {isEditing ? 'Edit Product' : 'Add New Product'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Image Upload */}
            <div className="md:row-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Image
              </label>
              <div 
                className={cn(
                  "w-full aspect-square rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer overflow-hidden",
                  imagePreview ? "border-amber-300 bg-white" : "border-gray-300 bg-gray-50 hover:bg-gray-100"
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-4">
                    <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-xs text-gray-500">Click to upload</p>
                  </div>
                )}
              </div>
              <input 
                type="file" 
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
            
            {/* SKU & Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
              <Input
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="OG-M-001"
                disabled={isEditing}
                className="font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Orange Capybara 10 inch"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as ProductMasterData['category'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="plushie">Plushie</option>
                <option value="jumbo">Jumbo</option>
                <option value="charm">Charm</option>
                <option value="clothing">Clothing</option>
                <option value="accessory">Accessory</option>
                <option value="bundle">Bundle</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            {/* COGS & Pricing */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">COGS ($)</label>
              <Input
                type="number"
                step="0.01"
                value={formData.cogs}
                onChange={(e) => setFormData({ ...formData, cogs: e.target.value })}
                placeholder="8.25"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Retail Price ($)</label>
              <Input
                type="number"
                step="0.01"
                value={formData.retailPrice}
                onChange={(e) => setFormData({ ...formData, retailPrice: e.target.value })}
                placeholder="16.99"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weight (g)</label>
              <Input
                type="number"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                placeholder="180"
              />
            </div>
          </div>
          
          {/* Dimensions */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Length (cm)</label>
              <Input
                type="number"
                step="0.1"
                value={formData.length}
                onChange={(e) => setFormData({ ...formData, length: e.target.value })}
                placeholder="25"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Width (cm)</label>
              <Input
                type="number"
                step="0.1"
                value={formData.width}
                onChange={(e) => setFormData({ ...formData, width: e.target.value })}
                placeholder="20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
              <Input
                type="number"
                step="0.1"
                value={formData.height}
                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                placeholder="15"
              />
            </div>
          </div>
          
          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Optional notes..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          
          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={!formData.sku || !formData.name}>
              <Check className="w-4 h-4 mr-2" />
              {isEditing ? 'Update Product' : 'Add Product'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// Bulk Import Modal
interface BulkImportModalProps {
  type: 'csv' | 'images';
  onClose: () => void;
  onComplete: () => void;
}

function BulkImportModal({ type, onClose, onComplete }: BulkImportModalProps) {
  const [step, setStep] = useState<'upload' | 'preview' | 'complete'>('upload');
  const [csvRows, setCsvRows] = useState<ProductCSVRow[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imageMatches, setImageMatches] = useState<{ filename: string; sku: string }[]>([]);
  const [unmatchedImages, setUnmatchedImages] = useState<string[]>([]);
  const [importResult, setImportResult] = useState<{ imported: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const rows = parseCSV(text);
      setCsvRows(rows);
      setStep('preview');
    };
    reader.readAsText(file);
  };
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    setImageFiles(files);
    const { matched, unmatched } = await productRegistry.importImages(files);
    setImageMatches(matched);
    setUnmatchedImages(unmatched);
    setStep('preview');
  };
  
  const handleCSVImport = () => {
    const result = productRegistry.importFromCSV(csvRows);
    setImportResult(result);
    setStep('complete');
  };
  
  const handleImageImport = async () => {
    const count = await productRegistry.applyImages(imageFiles, imageMatches);
    setImportResult({ imported: count, errors: [] });
    setStep('complete');
  };
  
  const handleComplete = () => {
    onComplete();
    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {type === 'csv' ? (
              <><FileText className="w-5 h-5 text-amber-600" /> Import Products from CSV</>
            ) : (
              <><ImageIcon className="w-5 h-5 text-amber-600" /> Bulk Import Images</>
            )}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto">
          {step === 'upload' && (
            <div className="text-center py-8">
              <input 
                type="file" 
                ref={fileInputRef}
                accept={type === 'csv' ? '.csv' : 'image/*'}
                multiple={type === 'images'}
                onChange={type === 'csv' ? handleCSVUpload : handleImageUpload}
                className="hidden"
              />
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-amber-400 cursor-pointer transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-700">
                  {type === 'csv' ? 'Upload CSV File' : 'Upload Product Images'}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {type === 'csv' 
                    ? 'Columns: sku, name, category, cogs, weight, length, width, height'
                    : 'Name files by SKU (e.g., OG-M-009.jpg) for auto-matching'
                  }
                </p>
              </div>
              
              {type === 'csv' && (
                <div className="mt-6 text-left">
                  <p className="text-sm font-medium text-gray-700 mb-2">Example CSV format:</p>
                  <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`sku,name,category,cogs,weight,length,width,height
OG-M-001,Orange Capybara 10",plushie,8.25,180,25,20,15
OG-KEY-001,Orange Bag Charm,charm,4.50,35,8,6,4`}
                  </pre>
                </div>
              )}
            </div>
          )}
          
          {step === 'preview' && type === 'csv' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-600">
                  Found <span className="font-bold text-amber-600">{csvRows.length}</span> products to import
                </p>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">SKU</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">Name</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">Category</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-700">COGS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {csvRows.slice(0, 10).map((row, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 font-mono text-xs">{row.sku}</td>
                        <td className="px-3 py-2">{row.name}</td>
                        <td className="px-3 py-2">{row.category || '-'}</td>
                        <td className="px-3 py-2 text-right">{row.cogs || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {csvRows.length > 10 && (
                  <p className="text-center text-sm text-gray-500 py-2 bg-gray-50">
                    ... and {csvRows.length - 10} more
                  </p>
                )}
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setStep('upload')}>
                  Back
                </Button>
                <Button onClick={handleCSVImport}>
                  <Check className="w-4 h-4 mr-2" />
                  Import {csvRows.length} Products
                </Button>
              </div>
            </div>
          )}
          
          {step === 'preview' && type === 'images' && (
            <div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
                    <Check className="w-4 h-4 text-green-500" />
                    Matched ({imageMatches.length})
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {imageMatches.map(({ filename, sku }) => (
                      <div key={filename} className="flex items-center gap-2 p-2 bg-green-50 rounded text-sm">
                        <ImageIcon className="w-4 h-4 text-green-600" />
                        <div className="truncate">
                          <p className="font-mono text-xs truncate">{filename}</p>
                          <p className="text-green-600">→ {sku}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {unmatchedImages.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-yellow-500" />
                      Unmatched ({unmatchedImages.length})
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {unmatchedImages.map((filename) => (
                        <div key={filename} className="flex items-center gap-2 p-2 bg-yellow-50 rounded text-sm">
                          <ImageIcon className="w-4 h-4 text-yellow-600" />
                          <p className="font-mono text-xs truncate">{filename}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setStep('upload')}>
                  Back
                </Button>
                <Button onClick={handleImageImport} disabled={imageMatches.length === 0}>
                  <Check className="w-4 h-4 mr-2" />
                  Apply {imageMatches.length} Images
                </Button>
              </div>
            </div>
          )}
          
          {step === 'complete' && importResult && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Import Complete
              </h3>
              <p className="text-gray-600 mb-4">
                Successfully imported <span className="font-bold text-amber-600">{importResult.imported}</span> {type === 'csv' ? 'products' : 'images'}
              </p>
              {importResult.errors.length > 0 && (
                <div className="text-left bg-red-50 p-3 rounded-lg mb-4">
                  <p className="text-sm font-medium text-red-700 mb-1">Errors:</p>
                  <ul className="text-sm text-red-600 list-disc list-inside">
                    {importResult.errors.slice(0, 5).map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                    {importResult.errors.length > 5 && (
                      <li>... and {importResult.errors.length - 5} more</li>
                    )}
                  </ul>
                </div>
              )}
              <Button onClick={handleComplete}>
                Done
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Product thumbnail component
function ProductThumbnail({ sku, size = 'md' }: { sku: string; size?: 'sm' | 'md' | 'lg' }) {
  const imageUrl = productRegistry.getImageUrl(sku);
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };
  
  return (
    <div className={cn(
      sizes[size],
      "rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0"
    )}>
      {imageUrl ? (
        <img src={imageUrl} alt={sku} className="w-full h-full object-cover" />
      ) : (
        <Package className="w-1/2 h-1/2 text-gray-400" />
      )}
    </div>
  );
}

export { ProductThumbnail };

// Main Products page
export function Products() {
  const [products, setProducts] = useState<ProductMasterData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductMasterData | null>(null);
  const [bulkImportType, setBulkImportType] = useState<'csv' | 'images' | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  function loadData() {
    setIsLoading(true);
    try {
      const data = productRegistry.getAll();
      setProducts(data);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSaveProduct(data: Partial<ProductMasterData> & { sku: string }) {
    productRegistry.upsert(data);
    loadData();
    setShowForm(false);
    setEditingProduct(null);
  }

  function handleDeleteProduct(sku: string) {
    if (confirm(`Delete product ${sku}?`)) {
      productRegistry.delete(sku);
      loadData();
    }
  }

  function handleExportCSV() {
    const csv = productRegistry.exportCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = !searchQuery || 
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, categoryFilter]);

  // Stats
  const stats = useMemo(() => {
    const total = products.length;
    const withImages = products.filter(p => p.imageBase64).length;
    const categories = products.reduce((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return { total, withImages, categories };
  }, [products]);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header 
        title="Product Master Data" 
        subtitle="Manage SKU details, images, COGS, and dimensions"
        onRefresh={loadData}
        isLoading={isLoading}
      />
      
      <div className="flex-1 overflow-y-auto p-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card className="bg-amber-50">
            <CardContent className="p-4">
              <p className="text-xs text-amber-600 font-medium uppercase">Total Products</p>
              <p className="text-2xl font-bold text-amber-700">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-gray-500 font-medium uppercase">With Images</p>
              <p className="text-2xl font-bold">{stats.withImages}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-gray-500 font-medium uppercase">Plushies</p>
              <p className="text-2xl font-bold">{stats.categories.plushie || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-gray-500 font-medium uppercase">Charms</p>
              <p className="text-2xl font-bold">{stats.categories.charm || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-gray-500 font-medium uppercase">Jumbo</p>
              <p className="text-2xl font-bold">{stats.categories.jumbo || 0}</p>
            </CardContent>
          </Card>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-[200px]">
            <SearchInput 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by SKU or name..."
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">All Categories</option>
            <option value="plushie">Plushie</option>
            <option value="jumbo">Jumbo</option>
            <option value="charm">Charm</option>
            <option value="clothing">Clothing</option>
            <option value="accessory">Accessory</option>
            <option value="bundle">Bundle</option>
            <option value="other">Other</option>
          </select>
          <div className="flex gap-2">
            <div className="relative group">
              <Button variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                Import
                <ChevronDown className="w-4 h-4 ml-1" />
              </Button>
              <div className="absolute right-0 mt-1 w-48 bg-white border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                <button
                  onClick={() => setBulkImportType('csv')}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Import from CSV
                </button>
                <button
                  onClick={() => setBulkImportType('images')}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <ImageIcon className="w-4 h-4" />
                  Bulk Import Images
                </button>
              </div>
            </div>
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => { setShowForm(true); setEditingProduct(null); }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </div>
        </div>

        {/* Form */}
        {(showForm || editingProduct) && (
          <div className="mb-6">
            <ProductForm
              product={editingProduct || undefined}
              onSave={handleSaveProduct}
              onCancel={() => { setShowForm(false); setEditingProduct(null); }}
            />
          </div>
        )}

        {/* Products Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Product</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Category</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-700">COGS</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-700">Retail</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-700">Weight</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700">Dimensions</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredProducts.map((product) => (
                  <tr key={product.sku} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <ProductThumbnail sku={product.sku} />
                        <div>
                          <p className="font-medium text-gray-900">{product.name}</p>
                          <p className="text-xs text-gray-500 font-mono">{product.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={
                        product.category === 'plushie' ? 'info' :
                        product.category === 'charm' ? 'success' :
                        product.category === 'jumbo' ? 'warning' :
                        'default'
                      }>
                        {product.category}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatCurrency(product.cogs)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {product.retailPrice ? formatCurrency(product.retailPrice) : '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {product.weight > 0 ? `${formatNumber(product.weight)}g` : '-'}
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-gray-500">
                      {product.dimensions.length > 0 
                        ? `${product.dimensions.length}×${product.dimensions.width}×${product.dimensions.height}`
                        : '-'
                      }
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => { setEditingProduct(product); setShowForm(false); }}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteProduct(product.sku)}
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
            {filteredProducts.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No products found</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Bulk Import Modal */}
      {bulkImportType && (
        <BulkImportModal
          type={bulkImportType}
          onClose={() => setBulkImportType(null)}
          onComplete={loadData}
        />
      )}
    </div>
  );
}
