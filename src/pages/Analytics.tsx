import { useState } from 'react';
import { 
  DollarSign,
  Package,
  BarChart3,
  Activity,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Header } from '../components/layout/Header';
import { formatCurrency, formatNumber, cn } from '../lib/utils';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Legend, LineChart, Line
} from 'recharts';

// Mock analytics data
const revenueData = [
  { month: 'Sep', revenue: 297500, target: 280000, orders: 7109 },
  { month: 'Oct', revenue: 257268, target: 280000, orders: 5938 },
  { month: 'Nov', revenue: 626828, target: 600000, orders: 14386 },
  { month: 'Dec', revenue: 363687, target: 350000, orders: 7344 },
  { month: 'Jan', revenue: 564314, target: 530000, orders: 12890 },
  { month: 'Feb', revenue: 420000, target: 530000, orders: 9800 },
];

const categoryData = [
  { name: '10" Plushies', value: 58, revenue: 3200000, color: '#8B4513' },
  { name: 'Bag Charms', value: 24, revenue: 1320000, color: '#D2691E' },
  { name: 'Jumbo Plushies', value: 8, revenue: 440000, color: '#CD853F' },
  { name: 'Bundles', value: 7, revenue: 385000, color: '#DEB887' },
  { name: 'Other', value: 3, revenue: 165000, color: '#F5DEB3' },
];

const skuPerformance = [
  { sku: 'OG-M-009', name: 'Cherry Capybara', units: 12500, revenue: 202375, growth: 18 },
  { sku: 'OG-M-002', name: 'Strawberry Capybara', units: 9800, revenue: 158662, growth: 12 },
  { sku: 'OG-M-007', name: 'Matcha Capybara', units: 7200, revenue: 116568, growth: 25 },
  { sku: 'OG-KEY-009', name: 'Cherry Bag Charm', units: 8900, revenue: 120417, growth: 22 },
  { sku: 'OG-KEY-007', name: 'Matcha Bag Charm', units: 7500, revenue: 101475, growth: 28 },
  { sku: 'OG-M-008', name: 'Blueberry Capybara', units: 6100, revenue: 98759, growth: 8 },
  { sku: 'OG-M-001', name: 'Orange Capybara', units: 5800, revenue: 93902, growth: -3 },
  { sku: 'LE-M-006', name: 'Secret Crush Valentine', units: 4200, revenue: 76650, growth: 45 },
];

const inventoryHealth = [
  { range: 'Out of Stock', count: 2, color: '#ef4444' },
  { range: '< 7 days', count: 4, color: '#f97316' },
  { range: '7-14 days', count: 6, color: '#eab308' },
  { range: '14-30 days', count: 12, color: '#22c55e' },
  { range: '30+ days', count: 18, color: '#3b82f6' },
];

const velocityTrend = [
  { week: 'W1', cherry: 280, strawberry: 245, matcha: 175 },
  { week: 'W2', cherry: 295, strawberry: 250, matcha: 190 },
  { week: 'W3', cherry: 310, strawberry: 248, matcha: 210 },
  { week: 'W4', cherry: 320, strawberry: 260, matcha: 225 },
  { week: 'W5', cherry: 305, strawberry: 255, matcha: 240 },
  { week: 'W6', cherry: 340, strawberry: 270, matcha: 260 },
];

const turnoverData = [
  { category: 'Plushies', turnover: 8.2, benchmark: 6.0 },
  { category: 'Charms', turnover: 10.5, benchmark: 8.0 },
  { category: 'Bundles', turnover: 6.8, benchmark: 5.0 },
  { category: 'Limited Ed.', turnover: 15.2, benchmark: 12.0 },
];

export function Analytics() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [isLoading, setIsLoading] = useState(false);

  // Calculate totals
  const totalRevenue = revenueData.reduce((s, d) => s + d.revenue, 0);
  const totalTarget = revenueData.reduce((s, d) => s + d.target, 0);
  const totalOrders = revenueData.reduce((s, d) => s + d.orders, 0);
  const avgOrderValue = totalRevenue / totalOrders;
  
  // Current month vs last month
  const currentMonth = revenueData[revenueData.length - 1];
  const lastMonth = revenueData[revenueData.length - 2];
  const revenueGrowth = ((currentMonth.revenue - lastMonth.revenue) / lastMonth.revenue) * 100;
  const orderGrowth = ((currentMonth.orders - lastMonth.orders) / lastMonth.orders) * 100;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header 
        title="Analytics" 
        subtitle="Performance metrics and insights"
        onRefresh={() => setIsLoading(true)}
        isLoading={isLoading}
      />
      
      <div className="flex-1 overflow-y-auto p-6">
        {/* Time Range Selector */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            {(['7d', '30d', '90d', '1y'] as const).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setTimeRange(range)}
              >
                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : '1 Year'}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="w-4 h-4" />
            Last updated: {new Date().toLocaleString()}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-green-100">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div className={cn(
                  "flex items-center text-sm font-medium",
                  revenueGrowth >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {revenueGrowth >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  {Math.abs(revenueGrowth).toFixed(1)}%
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-3">{formatCurrency(currentMonth.revenue)}</p>
              <p className="text-sm text-gray-500">Revenue This Month</p>
              <div className="mt-2 h-1 bg-green-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (currentMonth.revenue / currentMonth.target) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {Math.round((currentMonth.revenue / currentMonth.target) * 100)}% of {formatCurrency(currentMonth.target)} target
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <div className={cn(
                  "flex items-center text-sm font-medium",
                  orderGrowth >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {orderGrowth >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  {Math.abs(orderGrowth).toFixed(1)}%
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-3">{formatNumber(currentMonth.orders)}</p>
              <p className="text-sm text-gray-500">Orders This Month</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <CardContent className="pt-4">
              <div className="p-2 rounded-lg bg-purple-100 w-fit">
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-3">{formatCurrency(avgOrderValue)}</p>
              <p className="text-sm text-gray-500">Avg Order Value</p>
              <p className="text-xs text-green-600 mt-1">↑ $2.40 from last month</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
            <CardContent className="pt-4">
              <div className="p-2 rounded-lg bg-amber-100 w-fit">
                <Activity className="w-5 h-5 text-amber-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-3">2.38x</p>
              <p className="text-sm text-gray-500">Overall ROAS</p>
              <p className="text-xs text-gray-400 mt-1">Target: 2.5x</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Revenue vs Target Chart */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Revenue vs Target</CardTitle>
              <Badge variant="success">
                {Math.round((totalRevenue / totalTarget) * 100)}% of target
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                    <Tooltip 
                      formatter={(value) => [formatCurrency(Number(value)), '']}
                      contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#22c55e" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorRevenue)" 
                      name="Revenue"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="target" 
                      stroke="#9ca3af" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                      name="Target"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Category Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      dataKey="value"
                      label={({ value }) => `${value}%`}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, _name, entry) => [
                        `${value}% (${formatCurrency(entry.payload.revenue)})`,
                        entry.payload.name
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {categoryData.slice(0, 4).map((cat) => (
                  <div key={cat.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: cat.color }}></div>
                      <span>{cat.name}</span>
                    </div>
                    <span className="font-medium">{cat.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Top SKUs */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Top Performing SKUs</CardTitle>
              <Badge variant="info">By Revenue</Badge>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {skuPerformance.slice(0, 6).map((item, index) => (
                  <div key={item.sku} className="px-4 py-3 flex items-center gap-4 hover:bg-gray-50">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                      index === 0 ? "bg-amber-100 text-amber-700" :
                      index === 1 ? "bg-gray-200 text-gray-700" :
                      index === 2 ? "bg-orange-100 text-orange-700" :
                      "bg-gray-100 text-gray-600"
                    )}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{item.name}</p>
                      <p className="text-xs text-gray-500 font-mono">{item.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatCurrency(item.revenue)}</p>
                      <p className={cn(
                        "text-xs font-medium",
                        item.growth >= 0 ? "text-green-600" : "text-red-600"
                      )}>
                        {item.growth >= 0 ? '+' : ''}{item.growth}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Inventory Health */}
          <Card>
            <CardHeader>
              <CardTitle>Inventory Health Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={inventoryHealth} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis dataKey="range" type="category" tick={{ fontSize: 12 }} width={80} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {inventoryHealth.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-gray-500">Total SKUs: {inventoryHealth.reduce((s, d) => s + d.count, 0)}</span>
                <span className="text-red-600 font-medium">
                  {inventoryHealth[0].count + inventoryHealth[1].count} need attention
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Velocity Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Weekly Velocity Trends (Top 3 SKUs)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={velocityTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="cherry" stroke="#dc2626" strokeWidth={2} name="Cherry" />
                    <Line type="monotone" dataKey="strawberry" stroke="#ec4899" strokeWidth={2} name="Strawberry" />
                    <Line type="monotone" dataKey="matcha" stroke="#22c55e" strokeWidth={2} name="Matcha" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Inventory Turnover */}
          <Card>
            <CardHeader>
              <CardTitle>Inventory Turnover Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={turnoverData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="turnover" fill="#8B4513" name="Actual" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="benchmark" fill="#DEB887" name="Benchmark" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-sm text-gray-500 mt-4 text-center">
                Higher turnover = faster-moving inventory. All categories exceeding benchmarks! 🎉
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
