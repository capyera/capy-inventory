import { useState } from 'react';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle, 
  Calendar,
  DollarSign,
  Clock,
  Package,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Header } from '../components/layout/Header';
import { formatNumber, formatCurrency, cn } from '../lib/utils';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  Area, BarChart, Bar, Cell, ComposedChart, Line
} from 'recharts';

interface DemandPlanItem {
  sku: string;
  productName: string;
  currentStock: number;
  velocity7d: number;
  velocity30d: number;
  
  // Per-warehouse breakdown
  marsStock: number;
  fbaStock: number;
  ttsStock: number;
  
  // Forecast
  forecast30d: number;
  forecast60d: number;
  forecast90d: number;
  
  // Analysis
  daysOfStock: number;
  gap30d: number;
  gap60d: number;
  gap90d: number;
  
  // Recommendations
  stockoutDate: Date | null;
  lostRevenue: number;
  reorderQty: number;
  reorderDate: Date;
  urgency: 'critical' | 'urgent' | 'soon' | 'ok';
  
  // Seasonal
  seasonalFactor: number;
  trendDirection: 'up' | 'down' | 'stable';
}

// Seasonal indices (Nov = peak)
const seasonalIndices = [
  { month: 'Jan', index: 0.85 },
  { month: 'Feb', index: 0.95 }, // Valentine's
  { month: 'Mar', index: 0.80 },
  { month: 'Apr', index: 0.75 },
  { month: 'May', index: 0.78 },
  { month: 'Jun', index: 0.82 },
  { month: 'Jul', index: 0.88 },
  { month: 'Aug', index: 0.90 },
  { month: 'Sep', index: 0.95 },
  { month: 'Oct', index: 1.10 },
  { month: 'Nov', index: 1.45 }, // Peak - Black Friday
  { month: 'Dec', index: 1.35 }, // Holiday
];

// Mock demand planning data
const demandPlanData: DemandPlanItem[] = [
  { 
    sku: 'OG-M-009', productName: 'Cherry Capybara 10"', 
    currentStock: 1855, velocity7d: 58, velocity30d: 55,
    marsStock: 1250, fbaStock: 420, ttsStock: 185,
    forecast30d: 1650, forecast60d: 3300, forecast90d: 4950,
    daysOfStock: 34, gap30d: 205, gap60d: -1445, gap90d: -3095,
    stockoutDate: new Date(Date.now() + 34 * 24 * 60 * 60 * 1000),
    lostRevenue: 0, reorderQty: 2000, reorderDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    urgency: 'soon', seasonalFactor: 0.95, trendDirection: 'up'
  },
  { 
    sku: 'OG-M-002', productName: 'Strawberry Capybara 10"', 
    currentStock: 1290, velocity7d: 48, velocity30d: 45,
    marsStock: 890, fbaStock: 280, ttsStock: 120,
    forecast30d: 1350, forecast60d: 2700, forecast90d: 4050,
    daysOfStock: 29, gap30d: -60, gap60d: -1410, gap90d: -2760,
    stockoutDate: new Date(Date.now() + 29 * 24 * 60 * 60 * 1000),
    lostRevenue: 970, reorderQty: 1500, reorderDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    urgency: 'urgent', seasonalFactor: 0.95, trendDirection: 'stable'
  },
  { 
    sku: 'OG-M-007', productName: 'Matcha Capybara 10"', 
    currentStock: 720, velocity7d: 35, velocity30d: 33,
    marsStock: 540, fbaStock: 85, ttsStock: 95,
    forecast30d: 990, forecast60d: 1980, forecast90d: 2970,
    daysOfStock: 22, gap30d: -270, gap60d: -1260, gap90d: -2250,
    stockoutDate: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000),
    lostRevenue: 4370, reorderQty: 1200, reorderDate: new Date(),
    urgency: 'urgent', seasonalFactor: 0.95, trendDirection: 'stable'
  },
  { 
    sku: 'OG-M-008', productName: 'Blueberry Capybara 10"', 
    currentStock: 575, velocity7d: 32, velocity30d: 29,
    marsStock: 380, fbaStock: 45, ttsStock: 0,
    forecast30d: 870, forecast60d: 1740, forecast90d: 2610,
    daysOfStock: 20, gap30d: -295, gap60d: -1165, gap90d: -2035,
    stockoutDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    lostRevenue: 4775, reorderQty: 1000, reorderDate: new Date(),
    urgency: 'critical', seasonalFactor: 0.95, trendDirection: 'up'
  },
  { 
    sku: 'OG-M-005', productName: 'Violet Capybara 10"', 
    currentStock: 75, velocity7d: 13, velocity30d: 12,
    marsStock: 75, fbaStock: 0, ttsStock: 0,
    forecast30d: 360, forecast60d: 720, forecast90d: 1080,
    daysOfStock: 6, gap30d: -285, gap60d: -645, gap90d: -1005,
    stockoutDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
    lostRevenue: 4615, reorderQty: 800, reorderDate: new Date(),
    urgency: 'critical', seasonalFactor: 0.95, trendDirection: 'stable'
  },
  { 
    sku: 'OG-M-006', productName: 'Lily Capybara 10"', 
    currentStock: 45, velocity7d: 11, velocity30d: 10,
    marsStock: 45, fbaStock: 0, ttsStock: 0,
    forecast30d: 300, forecast60d: 600, forecast90d: 900,
    daysOfStock: 4, gap30d: -255, gap60d: -555, gap90d: -855,
    stockoutDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    lostRevenue: 4130, reorderQty: 600, reorderDate: new Date(),
    urgency: 'critical', seasonalFactor: 0.95, trendDirection: 'down'
  },
  { 
    sku: 'LE-M-006', productName: 'Secret Crush Valentine', 
    currentStock: 340, velocity7d: 45, velocity30d: 45,
    marsStock: 340, fbaStock: 0, ttsStock: 0,
    forecast30d: 1350, forecast60d: 1350, forecast90d: 1350, // Limited edition - Feb only
    daysOfStock: 8, gap30d: -1010, gap60d: -1010, gap90d: -1010,
    stockoutDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
    lostRevenue: 16360, reorderQty: 500, reorderDate: new Date(),
    urgency: 'critical', seasonalFactor: 1.5, trendDirection: 'up'
  },
];

// Forecast trend data (daily for 30 days)
const forecastTrendData = Array.from({ length: 30 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() + i);
  const baseVelocity = 180;
  const variation = Math.sin(i / 7 * Math.PI) * 20;
  const trend = i * 0.5;
  return {
    date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    forecast: Math.round(baseVelocity + variation + trend),
    inventory: Math.max(0, 5500 - (i * 180)),
  };
});

// Warehouse inventory position
const warehousePositionData = [
  { warehouse: 'Mars', current: 3225, forecast30: 2800, gap: 425 },
  { warehouse: 'FBA US', current: 830, forecast30: 1200, gap: -370 },
  { warehouse: 'TikTok MY', current: 400, forecast30: 650, gap: -250 },
];

export function DemandPlanning() {
  const [isLoading, setIsLoading] = useState(false);
  const [timeframe, setTimeframe] = useState<30 | 60 | 90>(30);

  const criticalItems = demandPlanData.filter(i => i.urgency === 'critical');
  const urgentItems = demandPlanData.filter(i => i.urgency === 'urgent');
  const totalLostRevenue = demandPlanData.reduce((s, i) => s + i.lostRevenue, 0);
  const avgDaysOfStock = demandPlanData.reduce((s, i) => s + i.daysOfStock, 0) / demandPlanData.length;

  async function handleRefresh() {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setIsLoading(false);
  }

  const getGapForTimeframe = (item: DemandPlanItem) => {
    switch (timeframe) {
      case 30: return item.gap30d;
      case 60: return item.gap60d;
      case 90: return item.gap90d;
    }
  };

  const getForecastForTimeframe = (item: DemandPlanItem) => {
    switch (timeframe) {
      case 30: return item.forecast30d;
      case 60: return item.forecast60d;
      case 90: return item.forecast90d;
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header 
        title="Demand Planning" 
        subtitle="Velocity-based forecasting and stockout prevention"
        onRefresh={handleRefresh}
        isLoading={isLoading}
      />
      
      <div className="flex-1 overflow-y-auto p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-50 text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">{criticalItems.length}</p>
                  <p className="text-sm text-gray-500">Critical Stockout Risk</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-50 text-orange-600">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-600">{urgentItems.length}</p>
                  <p className="text-sm text-gray-500">Need Reorder This Week</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-600">{formatCurrency(totalLostRevenue)}</p>
                  <p className="text-sm text-gray-500">Est. Lost Revenue Risk</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">{avgDaysOfStock.toFixed(0)}d</p>
                  <p className="text-sm text-gray-500">Avg. Days of Stock</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Decision Support */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-amber-500" />
              Decision Support: Can We Hit Our Forecast?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Overall Status */}
              <div className={cn(
                "p-4 rounded-lg border-2",
                criticalItems.length > 0 
                  ? "border-red-200 bg-red-50" 
                  : "border-green-200 bg-green-50"
              )}>
                <div className="flex items-center gap-3 mb-3">
                  {criticalItems.length > 0 ? (
                    <XCircle className="w-8 h-8 text-red-600" />
                  ) : (
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  )}
                  <div>
                    <h4 className={cn(
                      "text-lg font-bold",
                      criticalItems.length > 0 ? "text-red-700" : "text-green-700"
                    )}>
                      {criticalItems.length > 0 
                        ? `${criticalItems.length} SKUs at Stockout Risk`
                        : "On Track to Meet Forecast"
                      }
                    </h4>
                    <p className={cn(
                      "text-sm",
                      criticalItems.length > 0 ? "text-red-600" : "text-green-600"
                    )}>
                      Based on current velocity and inventory levels
                    </p>
                  </div>
                </div>
                
                {criticalItems.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {criticalItems.slice(0, 3).map(item => (
                      <div key={item.sku} className="flex items-center justify-between text-sm">
                        <span className="font-medium">{item.productName}</span>
                        <span className="text-red-600">Stockout in {item.daysOfStock}d</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Recommendations */}
              <div className="p-4 rounded-lg border bg-white">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  Immediate Actions Required
                </h4>
                <ul className="space-y-2 text-sm">
                  {criticalItems.map(item => (
                    <li key={item.sku} className="flex items-start gap-2">
                      <span className="text-red-500 mt-0.5 font-bold">!</span>
                      <span>
                        <strong>{item.sku}</strong>: Order {formatNumber(item.reorderQty)} units now
                        <span className="text-gray-500"> (stockout in {item.daysOfStock} days)</span>
                      </span>
                    </li>
                  ))}
                  {urgentItems.map(item => (
                    <li key={item.sku} className="flex items-start gap-2">
                      <span className="text-orange-500 mt-0.5">•</span>
                      <span>
                        <strong>{item.sku}</strong>: Order {formatNumber(item.reorderQty)} units this week
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Forecast Trend Chart */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>30-Day Inventory vs. Demand Forecast</CardTitle>
              <Badge variant="warning">Crossover in 29d</Badge>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={forecastTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="inventory" 
                      name="Inventory Level"
                      fill="#22c55e" 
                      fillOpacity={0.3}
                      stroke="#22c55e" 
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="forecast" 
                      name="Daily Demand"
                      stroke="#8B4513" 
                      strokeWidth={2}
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Seasonal Pattern */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-gray-400" />
                Seasonal Pattern
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={seasonalIndices}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 1.6]} tick={{ fontSize: 10 }} />
                    <Tooltip 
                      formatter={(value) => [(Number(value) * 100).toFixed(0) + '%', 'Seasonal Index']}
                    />
                    <Bar dataKey="index" radius={[4, 4, 0, 0]}>
                      {seasonalIndices.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.index > 1 ? '#8B4513' : '#D2691E'} 
                          opacity={index === 1 ? 1 : 0.7} // Highlight Feb (current)
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 p-3 bg-amber-50 rounded-lg">
                <p className="text-sm text-amber-700">
                  <strong>Peak Season Alert:</strong> November is your highest-demand month (45% above average). Start stocking up in September.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Warehouse Position */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Days of Inventory by Warehouse</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {warehousePositionData.map(wh => (
                <div 
                  key={wh.warehouse}
                  className={cn(
                    "p-4 rounded-lg border",
                    wh.gap < 0 ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"
                  )}
                >
                  <h4 className="font-medium text-gray-900">{wh.warehouse}</h4>
                  <div className="mt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Current Stock</span>
                      <span className="font-medium">{formatNumber(wh.current)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">30d Forecast</span>
                      <span className="font-medium">{formatNumber(wh.forecast30)}</span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t">
                      <span className="text-gray-500">Gap</span>
                      <span className={cn(
                        "font-bold",
                        wh.gap < 0 ? "text-red-600" : "text-green-600"
                      )}>
                        {wh.gap > 0 ? '+' : ''}{formatNumber(wh.gap)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* SKU Demand Planning Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-gray-400" />
              SKU Demand Analysis
            </CardTitle>
            <div className="flex gap-2">
              {[30, 60, 90].map((tf) => (
                <Button
                  key={tf}
                  variant={timeframe === tf ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setTimeframe(tf as 30 | 60 | 90)}
                >
                  {tf}d
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Velocity</TableHead>
                  <TableHead className="text-right">{timeframe}d Forecast</TableHead>
                  <TableHead className="text-right">Gap</TableHead>
                  <TableHead className="text-right">Days Left</TableHead>
                  <TableHead>Trend</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {demandPlanData.sort((a, b) => a.daysOfStock - b.daysOfStock).map((item) => {
                  const gap = getGapForTimeframe(item);
                  const forecast = getForecastForTimeframe(item);
                  return (
                    <TableRow 
                      key={item.sku}
                      className={cn(
                        item.urgency === 'critical' && 'bg-red-50/50',
                        item.urgency === 'urgent' && 'bg-orange-50/50'
                      )}
                    >
                      <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                      <TableCell className="max-w-[150px] truncate">{item.productName}</TableCell>
                      <TableCell className="text-right font-medium">{formatNumber(item.currentStock)}</TableCell>
                      <TableCell className="text-right">
                        <span className="font-medium">{item.velocity7d.toFixed(1)}</span>
                        <span className="text-gray-500 text-xs">/day</span>
                      </TableCell>
                      <TableCell className="text-right">{formatNumber(forecast)}</TableCell>
                      <TableCell className={cn(
                        "text-right font-medium",
                        gap < 0 ? "text-red-600" : "text-green-600"
                      )}>
                        {gap > 0 ? '+' : ''}{formatNumber(gap)}
                      </TableCell>
                      <TableCell className={cn(
                        "text-right font-bold",
                        item.daysOfStock <= 7 ? "text-red-600" : 
                        item.daysOfStock <= 14 ? "text-orange-600" : 
                        item.daysOfStock <= 21 ? "text-yellow-600" : "text-green-600"
                      )}>
                        {item.daysOfStock}d
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {item.trendDirection === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
                          {item.trendDirection === 'down' && <TrendingDown className="w-4 h-4 text-red-500" />}
                          {item.trendDirection === 'stable' && <ArrowRight className="w-4 h-4 text-gray-400" />}
                          <span className="text-xs text-gray-500">
                            {item.seasonalFactor !== 1 && `${(item.seasonalFactor * 100).toFixed(0)}%`}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.urgency === 'critical' && (
                          <Badge variant="danger">
                            Order Now: {formatNumber(item.reorderQty)}
                          </Badge>
                        )}
                        {item.urgency === 'urgent' && (
                          <Badge variant="warning">
                            Order: {formatNumber(item.reorderQty)}
                          </Badge>
                        )}
                        {item.urgency === 'soon' && (
                          <Badge variant="info">
                            Soon: {formatNumber(item.reorderQty)}
                          </Badge>
                        )}
                        {item.urgency === 'ok' && (
                          <Badge variant="success">On Track</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Supplier Lead Time Note */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-900 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Supplier Lead Times Factored In
          </h4>
          <p className="text-sm text-blue-700 mt-1">
            Reorder dates account for <strong>21-day lead time</strong> from Mars Factory. 
            FBA transfers require an additional <strong>5-7 days</strong> for inbound processing.
          </p>
        </div>
      </div>
    </div>
  );
}
