import { useState, useMemo } from 'react';
import { 
  Target, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2,
  DollarSign,
  Package,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Download,
  Sparkles,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Header } from '../components/layout/Header';
import { formatCurrency, formatNumber, cn } from '../lib/utils';
import { 
  calculateMonthlyPlan, 
  generateYearlyPlan, 
  generatePORecommendations
} from '../services/revenueForecasting';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function RevenueTargetPlanner() {
  const [revenueTarget, setRevenueTarget] = useState<number>(530000);
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-02');
  const [view, setView] = useState<'monthly' | 'yearly'>('monthly');
  const [isLoading, setIsLoading] = useState(false);
  const [showPOModal, setShowPOModal] = useState(false);
  
  // Calculate plan
  const monthlyPlan = useMemo(() => {
    const [year] = selectedMonth.split('-').map(Number);
    return calculateMonthlyPlan(revenueTarget, selectedMonth, year);
  }, [revenueTarget, selectedMonth]);
  
  const yearlyPlan = useMemo(() => {
    return generateYearlyPlan('2026-02');
  }, []);
  
  const poRecommendations = useMemo(() => {
    return generatePORecommendations(monthlyPlan);
  }, [monthlyPlan]);
  
  // Chart data
  const yearlyChartData = yearlyPlan.months.map(m => ({
    month: MONTH_NAMES[parseInt(m.month.split('-')[1]) - 1],
    target: m.revenueTarget / 1000,
    achievable: m.summary.estimatedRevenue / 1000,
    gap: (m.revenueTarget - m.summary.estimatedRevenue) / 1000,
  }));
  
  const tierBreakdown = [
    { name: 'Tier A', value: monthlyPlan.skuForecasts.filter(s => s.tier === 'A').reduce((sum, s) => sum + s.forecastUnits, 0), fill: '#8B4513' },
    { name: 'Tier B', value: monthlyPlan.skuForecasts.filter(s => s.tier === 'B').reduce((sum, s) => sum + s.forecastUnits, 0), fill: '#D2691E' },
    { name: 'Tier C', value: monthlyPlan.skuForecasts.filter(s => s.tier === 'C').reduce((sum, s) => sum + s.forecastUnits, 0), fill: '#DEB887' },
  ];
  
  const urgencyColors = {
    critical: 'bg-red-100 text-red-700 border-red-200',
    warning: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    good: 'bg-green-100 text-green-700 border-green-200',
    excess: 'bg-blue-100 text-blue-700 border-blue-200',
  };
  
  const handlePreviousMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    setSelectedMonth(`${prevYear}-${String(prevMonth).padStart(2, '0')}`);
  };
  
  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    setSelectedMonth(`${nextYear}-${String(nextMonth).padStart(2, '0')}`);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header 
        title="Revenue Target Planner" 
        subtitle="Capy-Era's top-down forecasting methodology"
        onRefresh={() => setIsLoading(true)}
        isLoading={isLoading}
      />
      
      <div className="flex-1 overflow-y-auto p-6">
        {/* Top Controls */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex-1 min-w-[300px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Revenue Target</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="number"
                value={revenueTarget}
                onChange={(e) => setRevenueTarget(Number(e.target.value))}
                className="pl-10 text-lg font-semibold"
                min={0}
                step={10000}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant={view === 'monthly' ? 'primary' : 'outline'}
              onClick={() => setView('monthly')}
              size="sm"
            >
              Monthly
            </Button>
            <Button 
              variant={view === 'yearly' ? 'primary' : 'outline'}
              onClick={() => setView('yearly')}
              size="sm"
            >
              12-Month View
            </Button>
          </div>
          
          {view === 'monthly' && (
            <div className="flex items-center gap-2 bg-white rounded-lg border px-2">
              <Button variant="ghost" size="sm" onClick={handlePreviousMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="font-medium px-2 min-w-[100px] text-center">
                {MONTH_NAMES[parseInt(selectedMonth.split('-')[1]) - 1]} {selectedMonth.split('-')[0]}
              </span>
              <Button variant="ghost" size="sm" onClick={handleNextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <Card className={cn(
            "border-2",
            monthlyPlan.summary.canHitTarget ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
          )}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                {monthlyPlan.summary.canHitTarget ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                )}
                <span className="text-sm font-medium text-gray-600">Target Status</span>
              </div>
              <p className={cn(
                "text-2xl font-bold",
                monthlyPlan.summary.canHitTarget ? "text-green-700" : "text-red-700"
              )}>
                {monthlyPlan.summary.canHitTarget ? 'On Track' : 'At Risk'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {Math.round(monthlyPlan.summary.fillRate * 100)}% fill rate
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-amber-600" />
                <span className="text-sm font-medium text-gray-600">Revenue Target</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(revenueTarget)}</p>
              <p className="text-sm text-gray-500 mt-1">
                Product: {formatCurrency(monthlyPlan.productRevenue)}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-gray-600">Achievable</span>
              </div>
              <p className="text-2xl font-bold text-green-700">
                {formatCurrency(monthlyPlan.summary.estimatedRevenue)}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Gap: {formatCurrency(Math.max(0, revenueTarget - monthlyPlan.summary.estimatedRevenue))}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-600">Units Needed</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(monthlyPlan.summary.totalUnits)}</p>
              <p className="text-sm text-gray-500 mt-1">
                Plushies: {formatNumber(monthlyPlan.summary.plushieUnits)} | Charms: {formatNumber(monthlyPlan.summary.charmUnits)}
              </p>
            </CardContent>
          </Card>
          
          <Card className={monthlyPlan.summary.criticalSkus > 0 ? "border-red-200" : ""}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className={cn(
                  "w-5 h-5",
                  monthlyPlan.summary.criticalSkus > 0 ? "text-red-600" : "text-gray-400"
                )} />
                <span className="text-sm font-medium text-gray-600">Critical SKUs</span>
              </div>
              <p className={cn(
                "text-2xl font-bold",
                monthlyPlan.summary.criticalSkus > 0 ? "text-red-700" : "text-green-700"
              )}>
                {monthlyPlan.summary.criticalSkus}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Need immediate attention
              </p>
            </CardContent>
          </Card>
        </div>

        {view === 'yearly' ? (
          <>
            {/* 12-Month Revenue Chart */}
            <Card className="mb-6">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-gray-400" />
                  12-Month Supply Plan
                </CardTitle>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-amber-500"></div>
                    <span>Target</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-green-500"></div>
                    <span>Achievable</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={yearlyChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}k`} />
                      <Tooltip 
                        formatter={(value) => [`$${Number(value).toFixed(0)}k`, '']}
                        contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                      />
                      <Bar dataKey="achievable" fill="#22c55e" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="gap" fill="#fbbf24" stackId="target" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Annual Summary */}
                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-500">Annual Target</p>
                    <p className="text-xl font-bold text-gray-900">
                      {formatCurrency(yearlyPlan.annualSummary.totalRevenue)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Achievable Revenue</p>
                    <p className="text-xl font-bold text-green-700">
                      {formatCurrency(yearlyPlan.annualSummary.achievableRevenue)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Revenue Gap</p>
                    <p className="text-xl font-bold text-red-600">
                      {formatCurrency(yearlyPlan.annualSummary.gapRevenue)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Units</p>
                    <p className="text-xl font-bold text-gray-900">
                      {formatNumber(yearlyPlan.annualSummary.totalUnits)}
                    </p>
                  </div>
                </div>
                
                {yearlyPlan.annualSummary.criticalMonths.length > 0 && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <span className="text-sm text-red-800">
                      <strong>Critical months:</strong> {yearlyPlan.annualSummary.criticalMonths.map(m => 
                        MONTH_NAMES[parseInt(m.split('-')[1]) - 1]
                      ).join(', ')}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            {/* Monthly View */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Tier Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>SKU Tier Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={tierBreakdown}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${formatNumber(value)}`}
                        >
                          {tierBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 space-y-2">
                    {tierBreakdown.map((tier) => (
                      <div key={tier.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded" style={{ backgroundColor: tier.fill }}></div>
                          <span>{tier.name}</span>
                        </div>
                        <span className="font-medium">{formatNumber(tier.value)} units</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Category Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Waterfall</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm">Monthly Target</span>
                      <span className="font-bold">{formatCurrency(revenueTarget)}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 border-l-4 border-gray-300">
                      <span className="text-sm text-gray-600">− Shipping (10%)</span>
                      <span className="text-gray-600">-{formatCurrency(revenueTarget * 0.10)}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-amber-50 rounded">
                      <span className="text-sm font-medium">Product Revenue</span>
                      <span className="font-bold text-amber-700">{formatCurrency(monthlyPlan.productRevenue)}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 border-l-4 border-amber-200">
                      <span className="text-sm text-gray-600">Plushies (75%)</span>
                      <span className="text-gray-600">{formatCurrency(monthlyPlan.productRevenue * 0.75 * 0.55)}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 border-l-4 border-amber-200">
                      <span className="text-sm text-gray-600">Charms (25%)</span>
                      <span className="text-gray-600">{formatCurrency(monthlyPlan.productRevenue * 0.25 * 0.55)}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 border-l-4 border-gray-200">
                      <span className="text-sm text-gray-600">Fixed Categories</span>
                      <span className="text-gray-600">{formatCurrency(monthlyPlan.productRevenue * 0.077)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-500" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    className="w-full justify-start gap-2" 
                    variant="outline"
                    onClick={() => setShowPOModal(true)}
                  >
                    <Package className="w-4 h-4" />
                    Generate PO Recommendations
                    {poRecommendations.filter(p => p.urgency === 'immediate').length > 0 && (
                      <Badge variant="danger" className="ml-auto">
                        {poRecommendations.filter(p => p.urgency === 'immediate').length}
                      </Badge>
                    )}
                  </Button>
                  <Button className="w-full justify-start gap-2" variant="outline">
                    <Download className="w-4 h-4" />
                    Export Supply Plan
                  </Button>
                  <Button className="w-full justify-start gap-2" variant="outline">
                    <Sparkles className="w-4 h-4" />
                    AI Optimization
                  </Button>
                  
                  <div className="pt-4 border-t">
                    <p className="text-xs text-gray-500 mb-2">Forecast Assumptions</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Old/New Split</span>
                        <span>55% / 45%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Lead Time</span>
                        <span>21 days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Safety Stock</span>
                        <span>7 days</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* SKU-Level Forecast Table */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>SKU-Level Supply Plan</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="success">{monthlyPlan.skuForecasts.filter(s => s.canFulfill).length} can fulfill</Badge>
                  <Badge variant="danger">{monthlyPlan.skuForecasts.filter(s => !s.canFulfill).length} at risk</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead className="text-right">Forecast Units</TableHead>
                      <TableHead className="text-right">Current Stock</TableHead>
                      <TableHead className="text-right">Inbound</TableHead>
                      <TableHead className="text-right">Gap</TableHead>
                      <TableHead className="text-right">Days Left</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthlyPlan.skuForecasts.map((forecast) => (
                      <TableRow key={forecast.sku} className={!forecast.canFulfill ? 'bg-red-50' : ''}>
                        <TableCell className="font-mono text-xs">{forecast.sku}</TableCell>
                        <TableCell className="max-w-[150px] truncate">{forecast.name}</TableCell>
                        <TableCell>
                          <Badge variant={forecast.tier === 'A' ? 'success' : forecast.tier === 'B' ? 'warning' : 'default'}>
                            {forecast.tier}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">{formatNumber(forecast.forecastUnits)}</TableCell>
                        <TableCell className="text-right">{formatNumber(forecast.currentInventory)}</TableCell>
                        <TableCell className="text-right">
                          {forecast.inboundUnits > 0 ? (
                            <span className="text-blue-600">+{formatNumber(forecast.inboundUnits)}</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {forecast.gap > 0 ? (
                            <span className="text-red-600 font-medium">-{formatNumber(forecast.gap)}</span>
                          ) : (
                            <span className="text-green-600">✓</span>
                          )}
                        </TableCell>
                        <TableCell className={cn(
                          "text-right font-medium",
                          forecast.daysUntilStockout && forecast.daysUntilStockout <= 7 ? "text-red-600" :
                          forecast.daysUntilStockout && forecast.daysUntilStockout <= 14 ? "text-yellow-600" : "text-green-600"
                        )}>
                          {forecast.daysUntilStockout}d
                        </TableCell>
                        <TableCell>
                          <span className={cn("px-2 py-1 rounded-full text-xs font-medium border", urgencyColors[forecast.urgency])}>
                            {forecast.urgency}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}

        {/* PO Recommendations Modal */}
        {showPOModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between p-6 border-b">
                <div>
                  <h3 className="text-xl font-semibold">PO Recommendations</h3>
                  <p className="text-sm text-gray-500 mt-1">Based on revenue target and current inventory</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowPOModal(false)}>✕</Button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                {poRecommendations.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <p className="text-lg font-medium">All SKUs are well-stocked!</p>
                    <p className="text-gray-500">No immediate PO recommendations.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {poRecommendations.map((rec) => (
                      <div 
                        key={rec.sku}
                        className={cn(
                          "p-4 rounded-lg border-2",
                          rec.urgency === 'immediate' ? 'border-red-200 bg-red-50' :
                          rec.urgency === 'this_week' ? 'border-yellow-200 bg-yellow-50' :
                          'border-gray-200 bg-gray-50'
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm text-gray-600">{rec.sku}</span>
                              <Badge variant={
                                rec.urgency === 'immediate' ? 'danger' :
                                rec.urgency === 'this_week' ? 'warning' : 'default'
                              }>
                                {rec.urgency.replace('_', ' ')}
                              </Badge>
                            </div>
                            <h4 className="font-semibold mt-1">{rec.name}</h4>
                            <p className="text-sm text-gray-600 mt-2">{rec.reasoning}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-amber-700">{formatNumber(rec.recommendedQty)}</p>
                            <p className="text-sm text-gray-500">units to order</p>
                            <p className="text-sm font-medium text-gray-700 mt-1">
                              Est. cost: {formatCurrency(rec.estimatedCost)}
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 flex items-center gap-6 text-sm">
                          <div>
                            <span className="text-gray-500">Current:</span>
                            <span className="ml-1 font-medium">{formatNumber(rec.currentQty)}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Inbound:</span>
                            <span className="ml-1 font-medium text-blue-600">+{formatNumber(rec.inboundQty)}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Monthly Demand:</span>
                            <span className="ml-1 font-medium">{formatNumber(rec.monthlyDemand)}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Days Left:</span>
                            <span className={cn(
                              "ml-1 font-medium",
                              rec.daysUntilStockout <= 7 ? "text-red-600" : "text-gray-900"
                            )}>
                              {rec.daysUntilStockout}d
                            </span>
                          </div>
                        </div>
                        <div className="mt-4 flex justify-end gap-2">
                          <Button variant="outline" size="sm">View SKU</Button>
                          <Button size="sm">
                            Create PO
                            <ArrowRight className="w-4 h-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="border-t p-4 flex justify-between items-center bg-gray-50">
                <div className="text-sm text-gray-600">
                  Total estimated cost: <span className="font-bold text-gray-900">
                    {formatCurrency(poRecommendations.reduce((s, r) => s + r.estimatedCost, 0))}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowPOModal(false)}>Close</Button>
                  <Button>Create All POs</Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
