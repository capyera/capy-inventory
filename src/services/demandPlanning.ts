import type { 
  DemandForecast, 
  InventoryPlan, 
  SeasonalPattern, 
  PromotionEvent,
  MonthlyForecast,
  WeeklyForecast,
  DailyForecast
} from '../types/warehouse';

// Capy-Era specific seasonal patterns based on 2025 data
const CAPY_ERA_SEASONALITY: Record<string, number[]> = {
  // Monthly indices (Jan-Dec), average = 1.0
  default: [1.1, 0.85, 0.95, 0.9, 0.8, 0.85, 1.0, 1.15, 1.05, 0.95, 1.5, 1.1],
  // Valentine's boost in Feb
  valentine: [0.9, 2.5, 0.6, 0.5, 0.4, 0.3, 0.2, 0.2, 0.2, 0.2, 0.3, 0.4],
  // Holiday items boost in Nov-Dec
  holiday: [0.3, 0.2, 0.2, 0.2, 0.2, 0.2, 0.3, 0.4, 0.5, 0.8, 2.0, 2.5],
};

// Day of week patterns (Mon-Sun)
const DOW_PATTERN = [1.1, 0.95, 0.9, 0.95, 1.0, 1.15, 1.05];

// 2026 Product Launch Calendar
const LAUNCH_CALENDAR: PromotionEvent[] = [
  { id: 'val-26', name: "Valentine's Collection", startDate: new Date('2026-01-07'), endDate: new Date('2026-02-14'), type: 'launch', expectedLift: 2.5, affectedSkus: ['LE-M-006', 'LE-M-007', 'LE-M-008'] },
  { id: 'spring-26', name: 'Spring Collection', startDate: new Date('2026-02-25'), endDate: new Date('2026-03-15'), type: 'launch', expectedLift: 1.8, affectedSkus: [] },
  { id: 'dessert-26', name: 'Dessert Collection', startDate: new Date('2026-03-18'), endDate: new Date('2026-04-05'), type: 'launch', expectedLift: 1.5, affectedSkus: [] },
  { id: 'fruit-26', name: 'New Fruit Collection', startDate: new Date('2026-04-08'), endDate: new Date('2026-04-25'), type: 'launch', expectedLift: 1.7, affectedSkus: [] },
  { id: 'unicorn-26', name: 'Unicorn Collection', startDate: new Date('2026-05-06'), endDate: new Date('2026-05-25'), type: 'launch', expectedLift: 2.0, affectedSkus: [] },
  { id: 'worldcup-26', name: 'World Cup Collection', startDate: new Date('2026-06-10'), endDate: new Date('2026-07-15'), type: 'launch', expectedLift: 1.8, affectedSkus: [] },
];

export const demandPlanningApi = {
  /**
   * Generate SKU-level demand forecast
   * Uses: historical velocity, seasonality, launches, trends
   */
  async getForecast(sku: string, daysAhead: number = 90): Promise<DemandForecast> {
    // Get historical velocity (would come from real data)
    const baseVelocity = getMockBaseVelocity(sku);
    const seasonalPattern = getSeasonalPattern(sku);
    const trendFactor = getTrendFactor(sku);
    
    const today = new Date();
    const daily: DailyForecast[] = [];
    const weekly: WeeklyForecast[] = [];
    const monthly: MonthlyForecast[] = [];
    
    // Generate daily forecast
    for (let i = 0; i < daysAhead; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      
      const dayOfWeek = date.getDay();
      const month = date.getMonth();
      
      // Apply seasonality
      const monthlyFactor = seasonalPattern.monthlyIndices[month];
      const dowFactor = DOW_PATTERN[dayOfWeek];
      
      // Check for promotions/launches
      const promoFactor = getPromotionFactor(sku, date);
      
      // Apply trend
      const trendMultiplier = 1 + (trendFactor * (i / 365)); // Annualized trend
      
      // Calculate prediction
      const predicted = baseVelocity * monthlyFactor * dowFactor * promoFactor * trendMultiplier;
      
      // Add uncertainty (wider bounds for further dates)
      const uncertainty = 0.1 + (i / daysAhead) * 0.2; // 10% to 30%
      
      daily.push({
        date: date.toISOString().split('T')[0],
        predictedUnits: Math.round(predicted * 10) / 10,
        lowerBound: Math.round(predicted * (1 - uncertainty) * 10) / 10,
        upperBound: Math.round(predicted * (1 + uncertainty) * 10) / 10,
        isPromoDay: promoFactor > 1,
        isLaunchDay: isLaunchDay(sku, date),
      });
    }
    
    // Aggregate to weekly
    for (let i = 0; i < Math.ceil(daysAhead / 7); i++) {
      const weekDays = daily.slice(i * 7, (i + 1) * 7);
      if (weekDays.length === 0) continue;
      
      const weekStart = weekDays[0].date;
      const sum = weekDays.reduce((s, d) => s + d.predictedUnits, 0);
      const lowerSum = weekDays.reduce((s, d) => s + d.lowerBound, 0);
      const upperSum = weekDays.reduce((s, d) => s + d.upperBound, 0);
      
      weekly.push({
        weekStart,
        predictedUnits: Math.round(sum),
        lowerBound: Math.round(lowerSum),
        upperBound: Math.round(upperSum),
      });
    }
    
    // Aggregate to monthly
    const monthlyGroups = new Map<string, DailyForecast[]>();
    for (const day of daily) {
      const monthKey = day.date.substring(0, 7); // YYYY-MM
      if (!monthlyGroups.has(monthKey)) {
        monthlyGroups.set(monthKey, []);
      }
      monthlyGroups.get(monthKey)!.push(day);
    }
    
    for (const [monthKey, days] of monthlyGroups) {
      const [year, monthNum] = monthKey.split('-').map(Number);
      const sum = days.reduce((s, d) => s + d.predictedUnits, 0);
      const avgPrice = sku.includes('KEY') ? 13.53 : 16.19;
      
      monthly.push({
        month: monthKey,
        year,
        predictedUnits: Math.round(sum),
        predictedRevenue: Math.round(sum * avgPrice),
        lowerBound: Math.round(days.reduce((s, d) => s + d.lowerBound, 0)),
        upperBound: Math.round(days.reduce((s, d) => s + d.upperBound, 0)),
        seasonalFactor: seasonalPattern.monthlyIndices[monthNum - 1],
      });
    }
    
    return {
      sku,
      productName: getProductName(sku),
      daily,
      weekly,
      monthly,
      forecastMethod: 'hybrid',
      confidenceLevel: 0.85,
      lastUpdated: new Date(),
      seasonalityIndex: seasonalPattern.monthlyIndices,
      trendDirection: trendFactor > 0.05 ? 'up' : trendFactor < -0.05 ? 'down' : 'stable',
      trendStrength: Math.abs(trendFactor) * 100,
    };
  },
  
  /**
   * Generate inventory plan with reorder recommendations
   */
  async getInventoryPlan(sku: string, currentInventory: number, currentVelocity: number, onOrderQty: number = 0): Promise<InventoryPlan> {
    const forecast = await this.getForecast(sku, 90);
    const forecastDemand = forecast.weekly.slice(0, 13).reduce((s, w) => s + w.predictedUnits, 0); // 90 days
    
    // Calculate coverage
    const totalSupply = currentInventory + onOrderQty;
    const inventoryGap = totalSupply - forecastDemand;
    const coverageDays = currentVelocity > 0 ? Math.round(totalSupply / currentVelocity) : 999;
    
    // Calculate stockout probability using forecast uncertainty
    const avgDailyForecast = forecastDemand / 90;
    const forecastVariability = 0.2; // 20% average variability
    const stockoutProbability = calculateStockoutProbability(
      currentInventory,
      avgDailyForecast,
      forecastVariability,
      21 // lead time days
    );
    
    // Determine urgency
    let urgency: InventoryPlan['urgency'];
    if (coverageDays < 7 || stockoutProbability > 0.5) {
      urgency = 'immediate';
    } else if (coverageDays < 14 || stockoutProbability > 0.3) {
      urgency = 'this_week';
    } else if (coverageDays < 28 || stockoutProbability > 0.15) {
      urgency = 'next_week';
    } else {
      urgency = 'on_track';
    }
    
    // Calculate recommended order
    const targetDaysOfStock = 45; // 6 weeks target
    const safetyStock = Math.round(currentVelocity * 7); // 1 week safety
    const targetInventory = Math.round(currentVelocity * targetDaysOfStock) + safetyStock;
    const recommendedOrderQty = Math.max(0, targetInventory - totalSupply);
    
    // When to order (work back from when we'd hit reorder point)
    const reorderPoint = Math.round(currentVelocity * 21); // 21 day lead time
    const daysUntilReorderPoint = currentVelocity > 0 
      ? Math.round((currentInventory - reorderPoint) / currentVelocity)
      : 999;
    const recommendedOrderDate = new Date();
    recommendedOrderDate.setDate(recommendedOrderDate.getDate() + Math.max(0, daysUntilReorderPoint - 3));
    
    // Potential lost sales if we stock out
    const avgPrice = sku.includes('KEY') ? 13.53 : 16.19;
    const potentialLostSales = stockoutProbability > 0.1 
      ? Math.round(avgDailyForecast * 30 * avgPrice * stockoutProbability)
      : 0;
    
    return {
      sku,
      productName: getProductName(sku),
      currentInventory,
      currentVelocity,
      forecastDemand,
      onOrderQty,
      inventoryGap,
      coverageDays,
      recommendedOrderQty,
      recommendedOrderDate,
      urgency,
      stockoutProbability: Math.round(stockoutProbability * 100) / 100,
      potentialLostSales,
    };
  },
  
  /**
   * Get all inventory plans for planning dashboard
   */
  async getAllInventoryPlans(): Promise<InventoryPlan[]> {
    // Would fetch real inventory data
    const mockInventory = getMockInventoryForPlanning();
    
    const plans = await Promise.all(
      mockInventory.map(item => 
        this.getInventoryPlan(item.sku, item.currentQty, item.velocity, item.onOrder)
      )
    );
    
    // Sort by urgency
    const urgencyOrder = { immediate: 0, this_week: 1, next_week: 2, on_track: 3 };
    return plans.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);
  },
  
  /**
   * Get seasonal patterns for a SKU
   */
  async getSeasonalPattern(sku: string): Promise<SeasonalPattern> {
    return getSeasonalPattern(sku);
  },
  
  /**
   * Get upcoming promotions/launches
   */
  async getUpcomingEvents(): Promise<PromotionEvent[]> {
    const now = new Date();
    return LAUNCH_CALENDAR.filter(e => e.endDate > now).slice(0, 6);
  },
  
  /**
   * Calculate "Can we hit our forecast?" decision
   */
  async canHitForecast(targetRevenue: number, periodDays: number): Promise<{
    canHit: boolean;
    probability: number;
    totalInventoryValue: number;
    forecastedRevenue: number;
    gap: number;
    limitingSkus: string[];
    recommendations: string[];
  }> {
    const plans = await this.getAllInventoryPlans();
    
    // Calculate total potential revenue from inventory
    let totalPotentialRevenue = 0;
    let totalInventoryValue = 0;
    const limitingSkus: string[] = [];
    
    for (const plan of plans) {
      const avgPrice = plan.sku.includes('KEY') ? 13.53 : 16.19;
      const potentialUnits = plan.currentInventory + plan.onOrderQty;
      totalPotentialRevenue += potentialUnits * avgPrice;
      totalInventoryValue += potentialUnits * (avgPrice * 0.5); // ~50% margin
      
      if (plan.urgency === 'immediate' || plan.urgency === 'this_week') {
        limitingSkus.push(plan.sku);
      }
    }
    
    const forecastedRevenue = plans.reduce((s, p) => {
      const avgPrice = p.sku.includes('KEY') ? 13.53 : 16.19;
      return s + (p.forecastDemand / 90 * periodDays * avgPrice);
    }, 0);
    
    const gap = targetRevenue - Math.min(totalPotentialRevenue, forecastedRevenue);
    const canHit = gap <= 0;
    const probability = canHit 
      ? Math.min(0.95, (totalPotentialRevenue / targetRevenue))
      : Math.max(0.05, 1 - (gap / targetRevenue));
    
    const recommendations: string[] = [];
    if (!canHit) {
      if (limitingSkus.length > 0) {
        recommendations.push(`Create POs for ${limitingSkus.length} at-risk SKUs immediately`);
      }
      recommendations.push(`Need ~$${Math.round(gap).toLocaleString()} more in inventory to hit target`);
    } else if (probability < 0.8) {
      recommendations.push('Consider expediting some inbound orders');
      recommendations.push('Monitor velocity closely this week');
    } else {
      recommendations.push('On track! Continue monitoring');
    }
    
    return {
      canHit,
      probability: Math.round(probability * 100) / 100,
      totalInventoryValue: Math.round(totalInventoryValue),
      forecastedRevenue: Math.round(forecastedRevenue),
      gap: Math.round(gap),
      limitingSkus,
      recommendations,
    };
  },
};

// Helper functions
function getMockBaseVelocity(sku: string): number {
  const velocities: Record<string, number> = {
    'OG-M-009': 42, 'OG-M-002': 35, 'OG-M-001': 28, 'OG-M-007': 25,
    'OG-M-008': 22, 'OG-M-003': 18, 'OG-M-004': 15, 'OG-M-005': 12,
    'OG-M-006': 10, 'OG-M-010': 8, 'OG-M-011': 14, 'OG-M-012': 12,
    'OG-KEY-007': 28, 'OG-KEY-009': 32, 'OG-KEY-003': 20, 'OG-KEY-008': 18,
    'OG-KEY-001': 15, 'LE-M-006': 45, 'LE-M-007': 38, 'LE-M-008': 32,
  };
  return velocities[sku] || 10;
}

function getSeasonalPattern(sku: string): SeasonalPattern {
  // Determine pattern based on SKU
  let monthlyIndices = CAPY_ERA_SEASONALITY.default;
  
  if (sku.includes('LE-M-006') || sku.includes('LE-M-007') || sku.includes('LE-M-008')) {
    monthlyIndices = CAPY_ERA_SEASONALITY.valentine;
  }
  
  const peakMonths = monthlyIndices
    .map((v, i) => ({ v, i }))
    .filter(x => x.v > 1.2)
    .map(x => x.i);
  
  const lowMonths = monthlyIndices
    .map((v, i) => ({ v, i }))
    .filter(x => x.v < 0.8)
    .map(x => x.i);
  
  return {
    sku,
    monthlyIndices,
    weekdayIndices: DOW_PATTERN,
    peakMonths,
    lowMonths,
    yearOverYearGrowth: 1.0, // 100% YoY growth target for 2026
  };
}

function getTrendFactor(sku: string): number {
  // Positive = growing, negative = declining
  // Based on 2026 growth targets
  const trends: Record<string, number> = {
    'OG-M-009': 0.15, // Cherry growing fast
    'OG-M-002': 0.12,
    'OG-M-007': 0.18, // Matcha trending
    'OG-KEY-009': 0.20, // Charms growing faster
    'OG-KEY-007': 0.22,
  };
  return trends[sku] || 0.10; // Default 10% growth
}

function getPromotionFactor(sku: string, date: Date): number {
  for (const event of LAUNCH_CALENDAR) {
    if (date >= event.startDate && date <= event.endDate) {
      if (event.affectedSkus.length === 0 || event.affectedSkus.includes(sku)) {
        return event.expectedLift;
      }
    }
  }
  return 1.0;
}

function isLaunchDay(sku: string, date: Date): boolean {
  for (const event of LAUNCH_CALENDAR) {
    const startDay = event.startDate.toISOString().split('T')[0];
    const dateStr = date.toISOString().split('T')[0];
    if (startDay === dateStr) {
      if (event.affectedSkus.length === 0 || event.affectedSkus.includes(sku)) {
        return true;
      }
    }
  }
  return false;
}

function calculateStockoutProbability(
  currentStock: number,
  avgDailyDemand: number,
  demandVariability: number,
  leadTimeDays: number
): number {
  if (avgDailyDemand === 0) return 0;
  
  // Simple model: probability that demand during lead time exceeds stock
  const expectedDemandDuringLT = avgDailyDemand * leadTimeDays;
  const stdDevDemand = avgDailyDemand * demandVariability * Math.sqrt(leadTimeDays);
  
  // Z-score
  const z = (currentStock - expectedDemandDuringLT) / stdDevDemand;
  
  // Approximate normal CDF (simplified)
  // Negative z = stock is below expected demand = high stockout risk
  if (z < -3) return 0.99;
  if (z < -2) return 0.95;
  if (z < -1) return 0.85;
  if (z < 0) return 0.5;
  if (z < 1) return 0.15;
  if (z < 2) return 0.05;
  return 0.01;
}

function getProductName(sku: string): string {
  const names: Record<string, string> = {
    'OG-M-009': 'Cherry Capybara 10"',
    'OG-M-002': 'Strawberry Capybara 10"',
    'OG-M-001': 'Orange Capybara 10"',
    'OG-M-007': 'Matcha Capybara 10"',
    'OG-M-008': 'Blueberry Capybara 10"',
    'OG-M-003': 'Watermelon Capybara 10"',
    'OG-M-004': 'Sakura Capybara 10"',
    'OG-M-005': 'Violet Capybara 10"',
    'OG-M-006': 'Lily Capybara 10"',
    'OG-M-010': 'Avocado Capybara 10"',
    'OG-M-011': 'Croissant Capybara 10"',
    'OG-M-012': 'Coffee Capybara 10"',
    'OG-KEY-007': 'Matcha Bag Charm',
    'OG-KEY-009': 'Cherry Bag Charm',
    'OG-KEY-003': 'Watermelon Bag Charm',
    'OG-KEY-008': 'Blueberry Bag Charm',
    'OG-KEY-001': 'Orange Bag Charm',
    'LE-M-006': 'Secret Crush Valentine',
    'LE-M-007': 'Rose Valentine',
    'LE-M-008': 'White Choco Valentine',
  };
  return names[sku] || sku;
}

function getMockInventoryForPlanning(): Array<{ sku: string; currentQty: number; velocity: number; onOrder: number }> {
  return [
    { sku: 'OG-M-009', currentQty: 1250, velocity: 42, onOrder: 500 },
    { sku: 'OG-M-002', currentQty: 890, velocity: 35, onOrder: 0 },
    { sku: 'OG-M-001', currentQty: 620, velocity: 28, onOrder: 300 },
    { sku: 'OG-M-007', currentQty: 540, velocity: 25, onOrder: 0 },
    { sku: 'OG-M-008', currentQty: 380, velocity: 22, onOrder: 0 },
    { sku: 'OG-M-003', currentQty: 290, velocity: 18, onOrder: 0 },
    { sku: 'OG-M-004', currentQty: 180, velocity: 15, onOrder: 0 },
    { sku: 'OG-M-005', currentQty: 75, velocity: 12, onOrder: 200 },
    { sku: 'OG-M-006', currentQty: 45, velocity: 10, onOrder: 0 },
    { sku: 'OG-M-010', currentQty: 0, velocity: 8, onOrder: 300 },
    { sku: 'OG-KEY-007', currentQty: 890, velocity: 28, onOrder: 0 },
    { sku: 'OG-KEY-009', currentQty: 720, velocity: 32, onOrder: 0 },
    { sku: 'OG-KEY-001', currentQty: 25, velocity: 15, onOrder: 500 },
    { sku: 'LE-M-006', currentQty: 340, velocity: 45, onOrder: 0 },
    { sku: 'LE-M-007', currentQty: 280, velocity: 38, onOrder: 0 },
  ];
}
