/**
 * AI Insight Cards - Smart Inventory Intelligence
 * 
 * Generates actionable insights like premium tools (Prediko, Cogsy)
 */

export type InsightType = 
  | 'stockout_warning'
  | 'velocity_spike'
  | 'velocity_drop'
  | 'transfer_suggestion'
  | 'reorder_reminder'
  | 'launch_prep'
  | 'overstock_alert'
  | 'margin_opportunity'
  | 'seasonal_prep'
  | 'trend_alert';

export type InsightPriority = 'critical' | 'high' | 'medium' | 'low';

export interface AIInsight {
  id: string;
  type: InsightType;
  priority: InsightPriority;
  title: string;
  message: string;
  impact?: string;
  action?: {
    label: string;
    type: 'create_po' | 'create_transfer' | 'view_sku' | 'view_forecast' | 'dismiss';
    payload?: Record<string, unknown>;
  };
  sku?: string;
  productName?: string;
  metrics?: {
    label: string;
    value: string | number;
    change?: number;
    isPositive?: boolean;
  }[];
  createdAt: Date;
  expiresAt?: Date;
  dismissed?: boolean;
}

// Mock inventory data for generating insights
const INVENTORY_STATE = {
  'OG-M-009': { 
    name: 'Cherry Capybara 10"', 
    qty: 1250, 
    velocity7d: 42, 
    velocity30d: 38,
    marsQty: 1250, 
    fbaQty: 420, 
    ttsQty: 185,
    inbound: 500,
    reorderPoint: 420,
    price: 16.19,
    cost: 5.50,
  },
  'OG-M-002': { 
    name: 'Strawberry Capybara 10"', 
    qty: 890, 
    velocity7d: 38, 
    velocity30d: 35,
    marsQty: 890, 
    fbaQty: 280, 
    ttsQty: 120,
    inbound: 300,
    reorderPoint: 350,
    price: 16.19,
    cost: 5.50,
  },
  'OG-M-007': { 
    name: 'Matcha Capybara 10"', 
    qty: 540, 
    velocity7d: 32, 
    velocity30d: 25,
    marsQty: 540, 
    fbaQty: 85, 
    ttsQty: 95,
    inbound: 0,
    reorderPoint: 250,
    price: 16.19,
    cost: 5.50,
  },
  'OG-M-005': { 
    name: 'Violet Capybara 10"', 
    qty: 75, 
    velocity7d: 14, 
    velocity30d: 12,
    marsQty: 75, 
    fbaQty: 0, 
    ttsQty: 0,
    inbound: 200,
    reorderPoint: 120,
    price: 16.19,
    cost: 5.50,
  },
  'OG-M-006': { 
    name: 'Lily Capybara 10"', 
    qty: 45, 
    velocity7d: 12, 
    velocity30d: 10,
    marsQty: 45, 
    fbaQty: 0, 
    ttsQty: 0,
    inbound: 0,
    reorderPoint: 100,
    price: 16.19,
    cost: 5.50,
  },
  'OG-M-010': { 
    name: 'Avocado Capybara 10"', 
    qty: 0, 
    velocity7d: 8, 
    velocity30d: 8,
    marsQty: 0, 
    fbaQty: 0, 
    ttsQty: 0,
    inbound: 300,
    reorderPoint: 80,
    price: 16.19,
    cost: 5.50,
  },
  'OG-KEY-007': { 
    name: 'Matcha Bag Charm', 
    qty: 890, 
    velocity7d: 35, 
    velocity30d: 28,
    marsQty: 890, 
    fbaQty: 0, 
    ttsQty: 0,
    inbound: 0,
    reorderPoint: 280,
    price: 13.53,
    cost: 3.50,
  },
  'OG-KEY-009': { 
    name: 'Cherry Bag Charm', 
    qty: 720, 
    velocity7d: 38, 
    velocity30d: 32,
    marsQty: 720, 
    fbaQty: 0, 
    ttsQty: 0,
    inbound: 0,
    reorderPoint: 320,
    price: 13.53,
    cost: 3.50,
  },
};

// Upcoming launches
const UPCOMING_LAUNCHES = [
  { name: 'Spring Collection', date: new Date('2026-02-25'), daysAway: 14 },
  { name: 'Dessert Collection', date: new Date('2026-03-18'), daysAway: 35 },
];

/**
 * Generate AI insights based on current inventory state
 */
export function generateInsights(): AIInsight[] {
  const insights: AIInsight[] = [];
  const now = new Date();
  
  // Analyze each SKU
  for (const [sku, data] of Object.entries(INVENTORY_STATE)) {
    const daysOfStock = data.velocity7d > 0 
      ? Math.round((data.qty + data.inbound) / data.velocity7d) 
      : 999;
    
    // 1. Stockout warnings
    if (data.qty === 0 && data.inbound === 0) {
      insights.push({
        id: `stockout-${sku}`,
        type: 'stockout_warning',
        priority: 'critical',
        title: `${data.name} is OUT OF STOCK! 🚨`,
        message: `Lost sales estimated at $${Math.round(data.velocity7d * data.price * 7).toLocaleString()} per week. Create a PO immediately.`,
        impact: `~$${Math.round(data.velocity7d * data.price * 30).toLocaleString()} potential monthly loss`,
        sku,
        productName: data.name,
        action: {
          label: 'Create PO',
          type: 'create_po',
          payload: { sku, qty: Math.round(data.velocity7d * 45) },
        },
        metrics: [
          { label: 'Daily Demand', value: data.velocity7d, change: 0 },
          { label: 'Days Out', value: 'NOW', isPositive: false },
        ],
        createdAt: now,
      });
    } else if (daysOfStock <= 7 && data.qty > 0) {
      insights.push({
        id: `low-stock-${sku}`,
        type: 'stockout_warning',
        priority: 'critical',
        title: `${data.name} is ${daysOfStock} days from stockout`,
        message: `At current velocity of ${data.velocity7d}/day, you'll run out by ${new Date(Date.now() + daysOfStock * 86400000).toLocaleDateString()}.`,
        impact: `Risk of losing $${Math.round(data.velocity7d * data.price * 14).toLocaleString()} in sales`,
        sku,
        productName: data.name,
        action: {
          label: 'Create PO',
          type: 'create_po',
          payload: { sku, qty: Math.round(data.velocity7d * 45) },
        },
        metrics: [
          { label: 'Current Stock', value: data.qty },
          { label: 'Days Left', value: `${daysOfStock}d`, isPositive: false },
          { label: 'Daily Velocity', value: data.velocity7d },
        ],
        createdAt: now,
      });
    } else if (daysOfStock <= 14) {
      insights.push({
        id: `watch-stock-${sku}`,
        type: 'reorder_reminder',
        priority: 'high',
        title: `Order ${data.name} soon`,
        message: `${daysOfStock} days of stock remaining. Consider ordering this week to maintain buffer.`,
        sku,
        productName: data.name,
        action: {
          label: 'View Forecast',
          type: 'view_forecast',
          payload: { sku },
        },
        metrics: [
          { label: 'Days of Stock', value: `${daysOfStock}d` },
          { label: 'Reorder Point', value: data.reorderPoint },
        ],
        createdAt: now,
      });
    }
    
    // 2. Velocity changes (trending products)
    const velocityChange = ((data.velocity7d - data.velocity30d) / data.velocity30d) * 100;
    if (velocityChange >= 20) {
      insights.push({
        id: `velocity-up-${sku}`,
        type: 'velocity_spike',
        priority: 'medium',
        title: `${data.name} is trending up 📈`,
        message: `Velocity increased ${Math.round(velocityChange)}% vs 30-day average. Consider increasing next order.`,
        sku,
        productName: data.name,
        action: {
          label: 'Adjust Forecast',
          type: 'view_forecast',
          payload: { sku },
        },
        metrics: [
          { label: '7-Day Velocity', value: data.velocity7d, change: velocityChange, isPositive: true },
          { label: '30-Day Velocity', value: data.velocity30d },
        ],
        createdAt: now,
      });
    }
    
    // 3. Transfer suggestions (FBA running low, Mars has stock)
    if (sku.startsWith('OG-M-') && data.fbaQty !== undefined) {
      const fbaVelocity = data.velocity7d * 0.35; // Assume 35% of sales from FBA
      const fbaDaysOfStock = fbaVelocity > 0 ? Math.round(data.fbaQty / fbaVelocity) : 999;
      
      if (fbaDaysOfStock <= 10 && data.marsQty > 200) {
        const transferQty = Math.min(Math.round(fbaVelocity * 30), Math.floor(data.marsQty * 0.3));
        insights.push({
          id: `transfer-fba-${sku}`,
          type: 'transfer_suggestion',
          priority: 'high',
          title: `Transfer ${transferQty} ${data.name} to FBA`,
          message: `FBA has only ${fbaDaysOfStock} days of stock. Mars has ${data.marsQty} units available.`,
          impact: 'Prevent FBA stockout and maintain Prime eligibility',
          sku,
          productName: data.name,
          action: {
            label: 'Create Transfer',
            type: 'create_transfer',
            payload: { sku, from: 'mars', to: 'fba', qty: transferQty },
          },
          metrics: [
            { label: 'FBA Stock', value: data.fbaQty },
            { label: 'FBA Days Left', value: `${fbaDaysOfStock}d`, isPositive: false },
            { label: 'Mars Available', value: data.marsQty },
          ],
          createdAt: now,
        });
      }
    }
    
    // 4. Overstock alerts
    if (daysOfStock > 90) {
      insights.push({
        id: `overstock-${sku}`,
        type: 'overstock_alert',
        priority: 'low',
        title: `${data.name} has ${daysOfStock}+ days of stock`,
        message: `Consider slowing reorders or running promotions to move inventory.`,
        sku,
        productName: data.name,
        metrics: [
          { label: 'Days of Stock', value: `${daysOfStock}d` },
          { label: 'Current Stock', value: data.qty + data.inbound },
        ],
        createdAt: now,
      });
    }
  }
  
  // 5. Launch prep insights
  for (const launch of UPCOMING_LAUNCHES) {
    if (launch.daysAway <= 21 && launch.daysAway > 0) {
      insights.push({
        id: `launch-prep-${launch.name.toLowerCase().replace(/\s/g, '-')}`,
        type: 'launch_prep',
        priority: launch.daysAway <= 7 ? 'high' : 'medium',
        title: `${launch.name} launches in ${launch.daysAway} days`,
        message: `Verify inventory levels for launch SKUs. Check marketing assets and ad creatives are ready.`,
        action: {
          label: 'View Calendar',
          type: 'view_forecast',
          payload: { view: 'calendar' },
        },
        metrics: [
          { label: 'Launch Date', value: launch.date.toLocaleDateString() },
          { label: 'Days Away', value: `${launch.daysAway}d` },
        ],
        createdAt: now,
        expiresAt: launch.date,
      });
    }
  }
  
  // 6. Weekly summary insight
  const totalStockValue = Object.values(INVENTORY_STATE).reduce(
    (sum, item) => sum + (item.qty * item.cost), 0
  );
  const criticalCount = Object.entries(INVENTORY_STATE).filter(([_, data]) => {
    const days = data.velocity7d > 0 ? (data.qty + data.inbound) / data.velocity7d : 999;
    return days <= 7;
  }).length;
  
  insights.push({
    id: 'weekly-summary',
    type: 'trend_alert',
    priority: criticalCount > 2 ? 'high' : 'low',
    title: `Weekly Inventory Health Check`,
    message: criticalCount > 0 
      ? `${criticalCount} SKUs need immediate attention. Total inventory value: $${Math.round(totalStockValue).toLocaleString()}`
      : `All systems healthy! Total inventory value: $${Math.round(totalStockValue).toLocaleString()}`,
    metrics: [
      { label: 'Critical SKUs', value: criticalCount, isPositive: criticalCount === 0 },
      { label: 'Inventory Value', value: `$${Math.round(totalStockValue).toLocaleString()}` },
      { label: 'Active SKUs', value: Object.keys(INVENTORY_STATE).length },
    ],
    createdAt: now,
  });
  
  // Sort by priority
  const priorityOrder: Record<InsightPriority, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };
  
  return insights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}

/**
 * Get insights filtered by type or priority
 */
export function getFilteredInsights(options: {
  types?: InsightType[];
  priority?: InsightPriority[];
  sku?: string;
  limit?: number;
}): AIInsight[] {
  let insights = generateInsights();
  
  if (options.types?.length) {
    insights = insights.filter(i => options.types!.includes(i.type));
  }
  
  if (options.priority?.length) {
    insights = insights.filter(i => options.priority!.includes(i.priority));
  }
  
  if (options.sku) {
    insights = insights.filter(i => i.sku === options.sku);
  }
  
  if (options.limit) {
    insights = insights.slice(0, options.limit);
  }
  
  return insights;
}

/**
 * Get quick stats for dashboard widgets
 */
export function getQuickStats() {
  const insights = generateInsights();
  
  return {
    criticalCount: insights.filter(i => i.priority === 'critical').length,
    highPriorityCount: insights.filter(i => i.priority === 'high').length,
    transfersNeeded: insights.filter(i => i.type === 'transfer_suggestion').length,
    upcomingLaunches: UPCOMING_LAUNCHES.filter(l => l.daysAway <= 30).length,
    totalInsights: insights.length,
  };
}

export const aiInsights = {
  generateInsights,
  getFilteredInsights,
  getQuickStats,
};
