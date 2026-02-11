import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Percent } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Header } from '../components/layout/Header';
import { cogsApi } from '../services/api';
import { formatCurrency, formatNumber, formatPercent } from '../lib/utils';
import type { COGSRecord } from '../types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

export function COGS() {
  const [cogsData, setCOGSData] = useState<COGSRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    try {
      const data = await cogsApi.getAll();
      setCOGSData(data);
    } catch (error) {
      console.error('Failed to load COGS data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const totals = cogsData.reduce((acc, item) => ({
    revenue: acc.revenue + item.totalRevenue,
    cost: acc.cost + item.totalCost,
    profit: acc.profit + item.totalProfit,
    units: acc.units + item.totalUnitsSold,
  }), { revenue: 0, cost: 0, profit: 0, units: 0 });

  const avgMargin = totals.revenue > 0 ? (totals.profit / totals.revenue) : 0;

  const chartData = cogsData.slice(0, 10).map(item => ({
    name: item.sku.split('-').pop(),
    margin: item.marginPercent * 100,
    profit: item.totalProfit,
  }));

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header 
        title="COGS & Margins" 
        subtitle="Track cost of goods sold and profitability by SKU"
        onRefresh={loadData}
        isLoading={isLoading}
      />
      
      <div className="flex-1 overflow-y-auto p-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-green-50 text-green-600">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-3">{formatCurrency(totals.revenue)}</p>
              <p className="text-sm text-gray-500">Total Revenue (30d)</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-red-50 text-red-600">
                  <TrendingDown className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-3">{formatCurrency(totals.cost)}</p>
              <p className="text-sm text-gray-500">Total COGS (30d)</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-3">{formatCurrency(totals.profit)}</p>
              <p className="text-sm text-gray-500">Gross Profit (30d)</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                  <Percent className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-3">{formatPercent(avgMargin)}</p>
              <p className="text-sm text-gray-500">Avg Gross Margin</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Margin by SKU Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Margin % by SKU</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fontSize: 12 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={60} />
                    <Tooltip 
                      formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Margin']}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="margin" radius={[0, 4, 4, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.margin > 50 ? '#22c55e' : entry.margin > 40 ? '#eab308' : '#ef4444'} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Profit by SKU Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Profit by SKU</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v.toLocaleString()}`} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={60} />
                    <Tooltip 
                      formatter={(value) => [formatCurrency(Number(value)), 'Profit']}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="profit" fill="#8B4513" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* COGS Table */}
        <Card>
          <CardHeader>
            <CardTitle>SKU Profitability (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Unit Cost</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Margin %</TableHead>
                  <TableHead className="text-right">Units Sold</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">COGS</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cogsData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                    <TableCell className="max-w-[150px] truncate">{item.productName}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.unitCost)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={item.marginPercent > 0.5 ? 'success' : item.marginPercent > 0.4 ? 'warning' : 'danger'}>
                        {formatPercent(item.marginPercent)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatNumber(item.totalUnitsSold)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.totalRevenue)}</TableCell>
                    <TableCell className="text-right text-red-600">{formatCurrency(item.totalCost)}</TableCell>
                    <TableCell className="text-right font-medium text-green-600">{formatCurrency(item.totalProfit)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
