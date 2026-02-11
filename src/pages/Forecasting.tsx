import { useState, useEffect } from 'react';
import { AlertTriangle, Check, X, Target, Calendar, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Header } from '../components/layout/Header';
import { forecastApi } from '../services/api';
import { formatNumber, cn } from '../lib/utils';
import type { ForecastSKU } from '../types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const monthlyForecast = [
  { month: 'Feb', target: 8052, onHand: 7200, inbound: 2000, gap: -1148 },
  { month: 'Mar', target: 7382, onHand: 6500, inbound: 1500, gap: -618 },
  { month: 'Apr', target: 7190, onHand: 5800, inbound: 3000, gap: 1610 },
  { month: 'May', target: 7595, onHand: 6200, inbound: 2500, gap: 1105 },
  { month: 'Jun', target: 9438, onHand: 5500, inbound: 4500, gap: 562 },
];

export function Forecasting() {
  const [skuForecast, setSKUForecast] = useState<ForecastSKU[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadForecast();
  }, []);

  async function loadForecast() {
    setIsLoading(true);
    try {
      const data = await forecastApi.getForecastVsInventory();
      setSKUForecast(data);
    } catch (error) {
      console.error('Failed to load forecast:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const canFulfillCount = skuForecast.filter(s => s.canFulfill).length;
  const atRiskCount = skuForecast.filter(s => !s.canFulfill).length;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header 
        title="Forecasting" 
        subtitle="Forecast vs. inventory analysis and decision support"
        onRefresh={loadForecast}
        isLoading={isLoading}
      />
      
      <div className="flex-1 overflow-y-auto p-6">
        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-50 text-green-600">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{canFulfillCount}</p>
                  <p className="text-sm text-gray-500">SKUs can fulfill forecast</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-50 text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{atRiskCount}</p>
                  <p className="text-sm text-gray-500">SKUs at risk</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {skuForecast.length > 0 ? ((canFulfillCount / skuForecast.length) * 100).toFixed(0) : 0}%
                  </p>
                  <p className="text-sm text-gray-500">Forecast fulfillment rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Forecast Chart */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-400" />
              Monthly Unit Forecast vs. Supply
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyForecast}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip 
                    formatter={(value, name) => [formatNumber(Number(value)), String(name)]}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="target" name="Forecast Target" fill="#8B4513" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="onHand" name="On Hand" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="inbound" name="Inbound" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            {/* Gap Summary */}
            <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
              {monthlyForecast.map((m) => (
                <div 
                  key={m.month}
                  className={cn(
                    "flex-shrink-0 p-3 rounded-lg text-center min-w-[100px]",
                    m.gap >= 0 ? "bg-green-50" : "bg-red-50"
                  )}
                >
                  <p className="text-xs text-gray-500">{m.month} Gap</p>
                  <p className={cn(
                    "text-lg font-bold",
                    m.gap >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {m.gap >= 0 ? '+' : ''}{formatNumber(m.gap)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Decision Support Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>🧠 Decision Support: Can We Hit Our Forecast?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={cn(
                "p-4 rounded-lg border-2",
                atRiskCount === 0 
                  ? "border-green-200 bg-green-50" 
                  : "border-red-200 bg-red-50"
              )}>
                <div className="flex items-center gap-3 mb-3">
                  {atRiskCount === 0 ? (
                    <Check className="w-8 h-8 text-green-600" />
                  ) : (
                    <X className="w-8 h-8 text-red-600" />
                  )}
                  <div>
                    <h4 className={cn(
                      "text-lg font-bold",
                      atRiskCount === 0 ? "text-green-700" : "text-red-700"
                    )}>
                      {atRiskCount === 0 
                        ? "Yes! All SKUs can fulfill forecast"
                        : `${atRiskCount} SKUs cannot fulfill forecast`
                      }
                    </h4>
                    <p className={cn(
                      "text-sm",
                      atRiskCount === 0 ? "text-green-600" : "text-red-600"
                    )}>
                      Based on current inventory + inbound
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 rounded-lg border bg-white">
                <h4 className="font-medium text-gray-900 mb-2">Recommended Actions</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  {atRiskCount > 0 && (
                    <>
                      <li className="flex items-start gap-2">
                        <span className="text-amber-500 mt-0.5">•</span>
                        Create POs for {atRiskCount} at-risk SKUs immediately
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-amber-500 mt-0.5">•</span>
                        Consider expedited shipping for critical items
                      </li>
                    </>
                  )}
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">•</span>
                    Review forecast accuracy weekly
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    Monitor velocity trends for adjustments
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SKU Forecast Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-gray-400" />
              SKU-Level Forecast Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Forecast (30d)</TableHead>
                  <TableHead className="text-right">Current Inv</TableHead>
                  <TableHead className="text-right">Inbound</TableHead>
                  <TableHead className="text-right">Gap</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {skuForecast.map((item) => (
                  <TableRow 
                    key={item.sku}
                    className={cn(!item.canFulfill && 'bg-red-50/50')}
                  >
                    <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                    <TableCell className="max-w-[150px] truncate">{item.name}</TableCell>
                    <TableCell className="text-right">{formatNumber(item.forecastUnits)}</TableCell>
                    <TableCell className="text-right">{formatNumber(item.currentInventory)}</TableCell>
                    <TableCell className="text-right">
                      {item.inboundUnits > 0 ? `+${formatNumber(item.inboundUnits)}` : '-'}
                    </TableCell>
                    <TableCell className={cn(
                      "text-right font-medium",
                      item.gap > 0 ? "text-red-600" : "text-green-600"
                    )}>
                      {item.gap > 0 ? `-${formatNumber(item.gap)}` : `+${formatNumber(Math.abs(item.gap))}`}
                    </TableCell>
                    <TableCell>
                      {item.canFulfill ? (
                        <Badge variant="success">
                          <Check className="w-3 h-3 mr-1" />
                          Can Fulfill
                        </Badge>
                      ) : (
                        <Badge variant="danger">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          At Risk
                        </Badge>
                      )}
                    </TableCell>
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
