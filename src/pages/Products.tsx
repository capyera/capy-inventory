import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Package, Plus, Upload, Download, Edit2, Trash2, 
  Image as ImageIcon, X, Check, AlertCircle, FileText, ChevronDown,
  Cloud, CloudUpload, CloudDownload, RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input, SearchInput } from '../components/ui/Input';
import { Header } from '../components/layout/Header';
import { productRegistry, parseCSV, PRODUCT_CATEGORIES, type ProductMasterData, type ProductCSVRow, type ProductCategory } from '../services/productRegistry';
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
    category: (product?.category || 'plushies') as ProductCategory,
    subcategory: product?.subcategory || '',
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
      category: formData.category,
      subcategory: formData.subcategory || undefined,
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
                onChange={(e) => setFormData({ ...formData, category: e.target.value as ProductCategory, subcategory: '' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {Object.entries(PRODUCT_CATEGORIES).map(([key, cat]) => (
                  <option key={key} value={key}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subcategory</label>
              <select
                value={formData.subcategory}
                onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">Select subcategory...</option>
                {PRODUCT_CATEGORIES[formData.category]?.subcategories.map((sub) => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
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
                    ? 'Columns: sku, name, category, subcategory, cogs, weight, length, width, height'
                    : 'Name files by SKU (e.g., OG-M-009.jpg) for auto-matching'
                  }
                </p>
              </div>
              
              {type === 'csv' && (
                <div className="mt-6 text-left">
                  <p className="text-sm font-medium text-gray-700 mb-2">Example CSV format:</p>
                  <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`sku,name,category,subcategory,cogs,weight,length,width,height
OG-M-001,Orange Capybara 10",plushies,10" Plushie,8.25,180,25,20,15
OG-KEY-001,Orange Bag Charm,plushies,Bag Charm,4.50,35,8,6,4
HOOD-K-001,Kids Orange Hoodie,clothing,Kids Hoodie,12.00,300,0,0,0`}
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

// Spreadsheet-style Bulk Edit Page
interface BulkEditPageProps {
  selectedSkus: string[];
  products: ProductMasterData[];
  onSave: (updates: Map<string, Partial<ProductMasterData>>) => void;
  onCancel: () => void;
}

interface EditableRow {
  sku: string;
  name: string;
  category: ProductCategory;
  subcategory: string;
  isActive: boolean;
  cogs: string;
  retailPrice: string;
  weight: string;
}

function BulkEditPage({ selectedSkus, products, onSave, onCancel }: BulkEditPageProps) {
  // Initialize editable rows from selected products
  const [rows, setRows] = useState<EditableRow[]>(() => {
    return selectedSkus.map(sku => {
      const p = products.find(prod => prod.sku === sku);
      return {
        sku,
        name: p?.name || '',
        category: p?.category || 'plushies',
        subcategory: p?.subcategory || '',
        isActive: p?.isActive !== false,
        cogs: p?.cogs?.toString() || '',
        retailPrice: p?.retailPrice?.toString() || '',
        weight: p?.weight?.toString() || '',
      };
    });
  });
  
  const updateRow = (sku: string, field: keyof EditableRow, value: any) => {
    setRows(prev => prev.map(row => 
      row.sku === sku ? { ...row, [field]: value } : row
    ));
  };
  
  const handleSave = () => {
    const updates = new Map<string, Partial<ProductMasterData>>();
    
    rows.forEach(row => {
      const original = products.find(p => p.sku === row.sku);
      const changes: Partial<ProductMasterData> = {};
      
      if (row.name !== original?.name) changes.name = row.name;
      if (row.category !== original?.category) changes.category = row.category;
      if (row.subcategory !== (original?.subcategory || '')) changes.subcategory = row.subcategory || undefined;
      if (row.isActive !== (original?.isActive !== false)) changes.isActive = row.isActive;
      if (row.cogs !== (original?.cogs?.toString() || '')) changes.cogs = parseFloat(row.cogs) || 0;
      if (row.retailPrice !== (original?.retailPrice?.toString() || '')) {
        changes.retailPrice = row.retailPrice ? parseFloat(row.retailPrice) : undefined;
      }
      if (row.weight !== (original?.weight?.toString() || '')) changes.weight = parseFloat(row.weight) || 0;
      
      if (Object.keys(changes).length > 0) {
        updates.set(row.sku, changes);
      }
    });
    
    onSave(updates);
  };
  
  // Get subcategories for a category
  const getSubcategories = (category: ProductCategory) => {
    return PRODUCT_CATEGORIES[category]?.subcategories || [];
  };
  
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onCancel} className="text-slate-500 hover:text-slate-700">
            ← Back
          </button>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Editing {rows.length} products</h1>
            <p className="text-sm text-slate-500">Edit each product individually, then save all changes</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleSave}>
            <Check className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>
      
      {/* Spreadsheet Table */}
      <div className="flex-1 overflow-auto p-4">
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 border-b sticky top-0">
                <tr>
                  <th className="px-3 py-3 text-left font-medium text-slate-700 min-w-[200px]">Product</th>
                  <th className="px-3 py-3 text-left font-medium text-slate-700 min-w-[120px]">Status</th>
                  <th className="px-3 py-3 text-left font-medium text-slate-700 min-w-[140px]">Category</th>
                  <th className="px-3 py-3 text-left font-medium text-slate-700 min-w-[140px]">Subcategory</th>
                  <th className="px-3 py-3 text-center font-medium text-slate-700 min-w-[100px]">COGS</th>
                  <th className="px-3 py-3 text-center font-medium text-slate-700 min-w-[100px]">Retail</th>
                  <th className="px-3 py-3 text-center font-medium text-slate-700 min-w-[100px]">Weight (g)</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((row) => (
                  <tr key={row.sku} className="hover:bg-slate-50">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <ProductThumbnail sku={row.sku} size="sm" />
                        <div className="min-w-0">
                          <input
                            type="text"
                            value={row.name}
                            onChange={(e) => updateRow(row.sku, 'name', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-transparent hover:border-slate-300 focus:border-amber-500 focus:outline-none rounded"
                          />
                          <p className="text-xs text-slate-400 font-mono px-2">{row.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={row.isActive ? 'active' : 'inactive'}
                        onChange={(e) => updateRow(row.sku, 'isActive', e.target.value === 'active')}
                        className={cn(
                          "w-full px-2 py-1.5 text-xs font-medium rounded border-0 focus:ring-2 focus:ring-amber-500",
                          row.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                        )}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={row.category}
                        onChange={(e) => {
                          updateRow(row.sku, 'category', e.target.value as ProductCategory);
                          updateRow(row.sku, 'subcategory', '');
                        }}
                        className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded focus:border-amber-500 focus:outline-none"
                      >
                        {Object.entries(PRODUCT_CATEGORIES).map(([key, cat]) => (
                          <option key={key} value={key}>{cat.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={row.subcategory}
                        onChange={(e) => updateRow(row.sku, 'subcategory', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded focus:border-amber-500 focus:outline-none"
                      >
                        <option value="">—</option>
                        {getSubcategories(row.category).map(sub => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={row.cogs}
                        onChange={(e) => updateRow(row.sku, 'cogs', e.target.value)}
                        placeholder="0.00"
                        className="w-full px-2 py-1.5 text-sm text-center border border-slate-200 rounded focus:border-amber-500 focus:outline-none"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={row.retailPrice}
                        onChange={(e) => updateRow(row.sku, 'retailPrice', e.target.value)}
                        placeholder="—"
                        className="w-full px-2 py-1.5 text-sm text-center border border-slate-200 rounded focus:border-amber-500 focus:outline-none"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        value={row.weight}
                        onChange={(e) => updateRow(row.sku, 'weight', e.target.value)}
                        placeholder="0"
                        className="w-full px-2 py-1.5 text-sm text-center border border-slate-200 rounded focus:border-amber-500 focus:outline-none"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

// Main Products page
export function Products() {
  const [products, setProducts] = useState<ProductMasterData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('active');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductMasterData | null>(null);
  const [bulkImportType, setBulkImportType] = useState<'csv' | 'images' | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ lastSync?: string; status: string; error?: string } | null>(null);
  
  // Multi-select state
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [showBulkEdit, setShowBulkEdit] = useState(false);

  function handleToggleActive(sku: string) {
    const product = products.find(p => p.sku === sku);
    if (product) {
      productRegistry.upsert({ sku, isActive: !product.isActive });
      loadData();
    }
  }
  
  // Selection handlers
  function toggleSelect(sku: string) {
    setSelectedProducts(prev => {
      const next = new Set(prev);
      if (next.has(sku)) next.delete(sku);
      else next.add(sku);
      return next;
    });
  }
  
  function selectAll() {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredProducts.map(p => p.sku)));
    }
  }
  
  function clearSelection() {
    setSelectedProducts(new Set());
  }
  
  function handleBulkEdit(updates: Map<string, Partial<ProductMasterData>>) {
    updates.forEach((changes, sku) => {
      productRegistry.upsert({ sku, ...changes });
    });
    loadData();
    setShowBulkEdit(false);
    setSelectedProducts(new Set());
  }
  
  function handleBulkDelete() {
    if (!confirm(`Delete ${selectedProducts.size} products? This cannot be undone.`)) return;
    selectedProducts.forEach(sku => {
      productRegistry.delete(sku);
    });
    loadData();
    setSelectedProducts(new Set());
  }

  useEffect(() => {
    loadData();
    setSyncStatus(productRegistry.getSyncStatus());
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

  function handleExportJSON() {
    const json = productRegistry.exportJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleSyncToCloud() {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const result = await productRegistry.syncToCloud();
      if (result.error) {
        alert(`Sync failed: ${result.error}`);
      } else {
        alert(`✓ Synced ${result.synced} products to cloud!`);
      }
      setSyncStatus(productRegistry.getSyncStatus());
    } catch (error) {
      alert(`Sync error: ${error}`);
    } finally {
      setIsSyncing(false);
    }
  }

  async function handleLoadFromCloud() {
    if (isSyncing) return;
    if (!confirm('This will replace your local data with cloud data. Continue?')) return;
    setIsSyncing(true);
    try {
      const result = await productRegistry.loadFromCloud();
      if (result.error) {
        alert(`Load failed: ${result.error}`);
      } else if (result.loaded === 0) {
        alert('No products found in cloud. Sync your data first!');
      } else {
        alert(`✓ Loaded ${result.loaded} products from cloud!`);
        loadData();
      }
    } catch (error) {
      alert(`Load error: ${error}`);
    } finally {
      setIsSyncing(false);
    }
  }

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = !searchQuery || 
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
      const matchesActive = activeFilter === 'all' || 
        (activeFilter === 'active' && p.isActive !== false) || 
        (activeFilter === 'inactive' && p.isActive === false);
      return matchesSearch && matchesCategory && matchesActive;
    });
  }, [products, searchQuery, categoryFilter, activeFilter]);

  // Stats
  const stats = useMemo(() => {
    const total = products.length;
    const active = products.filter(p => p.isActive !== false).length;
    const inactive = products.filter(p => p.isActive === false).length;
    const withImages = products.filter(p => p.imageBase64).length;
    const categories = products.reduce((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return { total, active, inactive, withImages, categories };
  }, [products]);

  // Show bulk edit page when active
  if (showBulkEdit) {
    return (
      <BulkEditPage
        selectedSkus={Array.from(selectedProducts)}
        products={products}
        onSave={handleBulkEdit}
        onCancel={() => setShowBulkEdit(false)}
      />
    );
  }

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
              <p className="text-2xl font-bold">{stats.categories.plushies || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-gray-500 font-medium uppercase">Clothing</p>
              <p className="text-2xl font-bold">{stats.categories.clothing || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-gray-500 font-medium uppercase">Accessories</p>
              <p className="text-2xl font-bold">{stats.categories.accessories || 0}</p>
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
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value as 'all' | 'active' | 'inactive')}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="active">Active Only ({stats.active})</option>
            <option value="inactive">Inactive Only ({stats.inactive})</option>
            <option value="all">All Products ({stats.total})</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">All Categories</option>
            {Object.entries(PRODUCT_CATEGORIES).map(([key, cat]) => (
              <option key={key} value={key}>{cat.label}</option>
            ))}
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
            {/* Export dropdown */}
            <div className="relative group">
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
                <ChevronDown className="w-4 h-4 ml-1" />
              </Button>
              <div className="absolute right-0 mt-1 w-48 bg-white border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                <button
                  onClick={handleExportCSV}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Export as CSV
                </button>
                <button
                  onClick={handleExportJSON}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export as JSON (Backup)
                </button>
              </div>
            </div>
            {/* Cloud sync dropdown */}
            <div className="relative group">
              <Button variant="outline" className={isSyncing ? 'opacity-50' : ''}>
                <Cloud className="w-4 h-4 mr-2" />
                Cloud
                {isSyncing && <RefreshCw className="w-3 h-3 ml-1 animate-spin" />}
                <ChevronDown className="w-4 h-4 ml-1" />
              </Button>
              <div className="absolute right-0 mt-1 w-56 bg-white border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                <button
                  onClick={handleSyncToCloud}
                  disabled={isSyncing}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
                >
                  <CloudUpload className="w-4 h-4 text-green-600" />
                  Sync to Cloud
                </button>
                <button
                  onClick={handleLoadFromCloud}
                  disabled={isSyncing}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
                >
                  <CloudDownload className="w-4 h-4 text-blue-600" />
                  Load from Cloud
                </button>
                {syncStatus?.lastSync && (
                  <div className="px-4 py-2 text-xs text-gray-500 border-t">
                    Last sync: {new Date(syncStatus.lastSync).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
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

        {/* Bulk Edit Toolbar */}
        {selectedProducts.size > 0 && (
          <Card className="mb-4 border-amber-300 bg-amber-50">
            <CardContent className="py-3 px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-amber-800">
                    {selectedProducts.size} product{selectedProducts.size > 1 ? 's' : ''} selected
                  </span>
                  <button
                    onClick={clearSelection}
                    className="text-sm text-amber-600 hover:text-amber-800 underline"
                  >
                    Clear selection
                  </button>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowBulkEdit(true)}>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Bulk Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleBulkDelete} className="text-red-600 hover:bg-red-50">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Selected
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Products Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-3 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={selectedProducts.size === filteredProducts.length && filteredProducts.length > 0}
                      onChange={selectAll}
                      className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Product</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Category</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700">Status</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700">COGS</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700">Retail</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700">Weight</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700">Dimensions</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredProducts.map((product) => {
                  const isActive = product.isActive !== false;
                  const isSelected = selectedProducts.has(product.sku);
                  return (
                    <tr key={product.sku} className={cn(
                      "hover:bg-gray-50",
                      !isActive && "opacity-50 bg-gray-50",
                      isSelected && "bg-amber-50"
                    )}>
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(product.sku)}
                          className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                        />
                      </td>
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
                        <div className="flex flex-col gap-1">
                          <Badge variant={
                            product.category === 'plushies' ? 'info' :
                            product.category === 'clothing' ? 'success' :
                            product.category === 'accessories' ? 'warning' :
                            product.category === 'bundles' ? 'default' :
                            'default'
                          }>
                            {PRODUCT_CATEGORIES[product.category]?.label || product.category}
                          </Badge>
                          {product.subcategory && (
                            <span className="text-xs text-gray-500">{product.subcategory}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleToggleActive(product.sku)}
                          className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium transition-colors",
                            isActive 
                              ? "bg-green-100 text-green-700 hover:bg-green-200" 
                              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                          )}
                        >
                          {isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center font-medium">
                        {formatCurrency(product.cogs)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {product.retailPrice ? formatCurrency(product.retailPrice) : '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {product.weight > 0 ? `${formatNumber(product.weight)}g` : '-'}
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-gray-500">
                        {product.dimensions.length > 0 
                          ? `${product.dimensions.length}×${product.dimensions.width}×${product.dimensions.height}`
                          : '-'
                        }
                      </td>
                      <td className="px-4 py-3 text-center">
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
                  );
                })}
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
