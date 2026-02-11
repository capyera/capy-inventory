import { useState, useEffect } from 'react';
import { 
  Package, 
  AlertTriangle, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  ShoppingCart,
  Target,
  Calendar,
  Zap,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Header } from '../components/layout/Header';
import { AIInsightCards } from '../components/AIInsightCards';
import { dashboardApi, inventoryApi } from '../services/api';
import { formatCurrency, formatNumber, getStockStatus } from '../lib/utils';
import { getQuickStats } from '../services/aiInsights';
import type { DashboardStats, InventoryItem, AlertItem } from '../types';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#8B4513', '#D2691E', '#CD853F', '#DEB887', '#F5DEB3'];

const salesData = [
  { date: 'Feb 4', units: 1250, revenue: 48000 },
  { date: 'Feb 5', units: 1180, revenue: 45000 },
  { date: 'Feb 6', units: 1420, revenue: 54000 },
  { date: 'Feb 7', units: 1850, revenue: 72000 },
  { date: 'Feb 8', units: 2100, revenue: 81000 },
  { date: 'Feb 9', units: 1950, revenue: 75000 },
  { date: 'Feb 10', units: 1680, revenue: 64000 },
];

interface DashboardProps {
  onNavigate?: (tab: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const quickStats = getQuickStats();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    try {
      const [statsData, inventoryData, alertsData] = await Promise.all([
        dashboardApi.getStats(),
        inventoryApi.getAll(),
        dashboardApi.getAlerts(),
      ]);
      setStats(statsData);
      setInventory(inventoryData);
      setAlerts(alertsData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const lowStockItems = inventory
    .filter(item => item.currentQty > 0 && item.currentQty < 100)
    .sort((a, b) => a.currentQty - b.currentQty)
    .slice(0, 5);

  const topVelocityItems = [...inventory]
    .sort((a, b) => b.velocity30d - a.velocity30d)
    .slice(0, 5);

  const categoryBreakdown = [
    { name: 'Plushies', value: inventory.filter(i => i.category === 'plushie').reduce((s, i) => s + i.currentQty, 0) },
    { name: 'Charms', value: inventory.filter(i => i.category === 'charm').reduce((s, i) => s + i.currentQty, 0) },
    { name: 'Bundles', value: inventory.filter(i => i.category === 'bundle').reduce((s, i) => s + i.currentQty, 0) },
    { name: 'Other', value: inventory.filter(i => !['plushie', 'charm', 'bundle'].includes(i.category)).reduce((s, i) => s + i.currentQty, 0) },
  ].filter(c => c.value > 0);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header 
        title="Dashboard" 
        subtitle={`Last synced: ${new Date().toLocaleTimeString()}`}
        onRefresh={loadData}
        isLoading={isLoading}
      />
      
      <div className="flex-1 overflow-y-auto p-6">
        {/* Quick Actions Bar */}
        <div className="flex flex-wrap items-center gap-3 mb-6 p-4 bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 rounded-xl border border-amber-100">
          <div className="flex items-center gap-2 text-amber-800">
            <Zap className="w-5 h-5" />
            <span className="font-medium">Quick Actions</span>
          </div>
          <div className="flex-1 flex flex-wrap gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="bg-white hover:bg-amber-50"
              onClick={() => onNavigate?.('revenue-planner')}
            >
              <Target className="w-4 h-4 mr-1" />
              Revenue Planner
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="bg-white hover:bg-amber-50"
              onClick={() => onNavigate?.('ops-calendar')}
            >
              <Calendar className="w-4 h-4 mr-1" />
              Ops Calendar
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="bg-white hover:bg-amber-50"
              onClick={() => onNavigate?.('purchase-orders')}
            >
              <Package className="w-4 h-4 mr-1" />
              Create PO
            </Button>
          </div>
          {quickStats.criticalCount > 0 && (
            <Badge variant="danger" className="animate-pulse">
              {quickStats.criticalCount} Critical
            </Badge>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Total SKUs"
            value={stats?.totalSKUs || 0}
            icon={<Package className="w-5 h-5" />}
            trend={{ value: 5, isUp: true }}
            color="blue"
          />
          <StatCard
            title="Total Units"
            value={formatNumber(stats?.totalUnits || 0)}
            icon={<ShoppingCart className="w-5 h-5" />}
            trend={{ value: 12, isUp: true }}
            color="green"
          />
          <StatCard
            title="Inventory Value"
            value={formatCurrency(stats?.totalValue || 0)}
            icon={<DollarSign className="w-5 h-5" />}
            color="amber"
          />
          <StatCard
            title="Low Stock Alerts"
            value={stats?.lowStockCount || 0}
            icon={<AlertTriangle className="w-5 h-5" />}
            color={stats?.lowStockCount && stats.lowStockCount > 0 ? "red" : "green"}
            subtitle={`${stats?.outOfStockCount || 0} out of stock`}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Sales Chart */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Units Sold (Last 7 Days)</CardTitle>
              <Badge variant="success">+18% vs last week</Badge>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesData}>
                    <defs>
                      <linearGradient id="colorUnits" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B4513" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8B4513" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="units" 
                      stroke="#8B4513" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorUnits)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Category Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Inventory by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryBreakdown.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-3 justify-center mt-2">
                {categoryBreakdown.map((cat, i) => (
                  <div key={cat.name} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    />
                    <span className="text-sm text-gray-600">{cat.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Low Stock Items */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Low Stock Items</CardTitle>
              <Badge variant="warning">{lowStockItems.length} items</Badge>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStockItems.map((item) => {
                    const status = getStockStatus(item.currentQty, item.velocity30d);
                    return (
                      <TableRow key={item.sku}>
                        <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                        <TableCell className="max-w-[150px] truncate">{item.productName}</TableCell>
                        <TableCell className="text-right font-medium">{item.currentQty}</TableCell>
                        <TableCell>
                          <Badge variant={status.status === 'critical' ? 'danger' : 'warning'}>
                            {status.daysOfStock}d stock
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Top Velocity Items */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Top Selling Products</CardTitle>
              <Badge variant="info">By velocity</Badge>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Velocity</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topVelocityItems.map((item) => (
                    <TableRow key={item.sku}>
                      <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                      <TableCell className="max-w-[150px] truncate">{item.productName}</TableCell>
                      <TableCell className="text-right">
                        <span className="font-medium text-amber-700">{item.velocity30d.toFixed(1)}</span>
                        <span className="text-gray-500 text-xs">/day</span>
                      </TableCell>
                      <TableCell className="text-right">{formatNumber(item.currentQty)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* AI Insights Section */}
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              AI Insights
            </CardTitle>
            <div className="flex items-center gap-2">
              {quickStats.criticalCount > 0 && (
                <Badge variant="danger">{quickStats.criticalCount} critical</Badge>
              )}
              {quickStats.highPriorityCount > 0 && (
                <Badge variant="warning">{quickStats.highPriorityCount} high priority</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <AIInsightCards limit={4} showHeader={false} />
          </CardContent>
        </Card>

        {/* Alerts Section */}
        {alerts.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Alerts</CardTitle>
              <span className="text-sm text-gray-500">{alerts.length} active</span>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts.slice(0, 5).map((alert) => (
                  <div 
                    key={alert.id} 
                    className={`flex items-start gap-3 p-3 rounded-lg ${
                      alert.severity === 'critical' ? 'bg-red-50' : 'bg-yellow-50'
                    }`}
                  >
                    <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${
                      alert.severity === 'critical' ? 'text-red-500' : 'text-yellow-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {new Date(alert.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant={alert.severity === 'critical' ? 'danger' : 'warning'}>
                      {alert.type.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: number; isUp: boolean };
  color: 'blue' | 'green' | 'amber' | 'red';
  subtitle?: string;
}

function StatCard({ title, value, icon, trend, color, subtitle }: StatCardProps) {
  const colorStyles = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
  };

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div className={`p-2 rounded-lg ${colorStyles[color]}`}>
            {icon}
          </div>
          {trend && (
            <div className={`flex items-center text-sm font-medium ${
              trend.isUp ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend.isUp ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              {trend.value}%
            </div>
          )}
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{title}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
