/**
 * Revenue Target Planner - Capy-Era Forecasting Methodology
 * 
 * Top-down waterfall approach:
 * 1. Start with monthly revenue target
 * 2. Subtract shipping (10%) → Product Revenue
 * 3. Allocate fixed categories (Clothing 2.5%, Accessories 2.5%, Jumbo 2.7%)
 * 4. Split variable pool: Plushies (70-80%) / Bag Charms (20-30%)
 * 5. Divide by Old vs New (~55% / ~45%)
 * 6. Convert revenue → units using unit prices
 * 7. Distribute to SKUs using A/B/C tier system
 */

// Pricing
const PRICES = {
  plushie: { evergreen: 16.19, limited: 18.25 },
  charm: { evergreen: 13.53, limited: 16.04 },
  jumbo: 35.00,
  clothing: 32.00,
  accessory: 12.00,
};

// Revenue allocation percentages
const ALLOCATION = {
  shipping: 0.10,
  clothing: 0.025,
  accessories: 0.025,
  jumbo: 0.027,
  // Variable pool allocation
  plushieShare: { min: 0.70, max: 0.80, default: 0.75 },
  charmShare: { min: 0.20, max: 0.30, default: 0.25 },
  // Old vs New split
  oldProductShare: 0.55,
  newProductShare: 0.45,
};

// Tier allocation for 10" Plushies
const PLUSHIE_TIERS = {
  A: {
    share: 0.49,
    skus: [
      { sku: 'OG-M-009', name: 'Cherry Capybara 10"', share: 0.425 },
      { sku: 'OG-M-002', name: 'Strawberry Capybara 10"', share: 0.32 },
      { sku: 'OG-M-001', name: 'Orange Capybara 10"', share: 0.255 },
    ],
  },
  B: {
    share: 0.39,
    skus: [
      { sku: 'OG-M-008', name: 'Blueberry Capybara 10"', share: 0.20 },
      { sku: 'OG-M-003', name: 'Watermelon Capybara 10"', share: 0.20 },
      { sku: 'OG-M-004', name: 'Sakura Capybara 10"', share: 0.20 },
      { sku: 'OG-M-007', name: 'Matcha Capybara 10"', share: 0.20 },
      { sku: 'OG-M-005', name: 'Violet Capybara 10"', share: 0.20 },
    ],
  },
  C: {
    share: 0.12,
    skus: [
      { sku: 'OG-M-011', name: 'Croissant Capybara 10"', share: 0.447 },
      { sku: 'OG-M-012', name: 'Coffee Capybara 10"', share: 0.374 },
      { sku: 'OG-M-010', name: 'Avocado Capybara 10"', share: 0.179 },
    ],
  },
};

// Tier allocation for Bag Charms
const CHARM_TIERS = {
  A: {
    share: 0.40,
    skus: [
      { sku: 'OG-KEY-007', name: 'Matcha Bag Charm', share: 0.366 },
      { sku: 'OG-KEY-009', name: 'Cherry Bag Charm', share: 0.339 },
      { sku: 'OG-KEY-003', name: 'Watermelon Bag Charm', share: 0.295 },
    ],
  },
  B: {
    share: 0.56,
    skus: [
      { sku: 'OG-KEY-008', name: 'Blueberry Bag Charm', share: 0.143 },
      { sku: 'OG-KEY-001', name: 'Orange Bag Charm', share: 0.143 },
      { sku: 'OG-KEY-002', name: 'Strawberry Bag Charm', share: 0.143 },
      { sku: 'OG-KEY-012', name: 'Coffee Bag Charm', share: 0.143 },
      { sku: 'OG-KEY-005', name: 'Violet Bag Charm', share: 0.143 },
      { sku: 'OG-KEY-011', name: 'Croissant Bag Charm', share: 0.143 },
      { sku: 'OG-KEY-004', name: 'Sakura Bag Charm', share: 0.143 },
    ],
  },
  C: {
    share: 0.04,
    skus: [
      { sku: 'OG-KEY-010', name: 'Avocado Bag Charm', share: 1.0 },
    ],
  },
};

// 2026 Monthly Revenue Targets
const MONTHLY_TARGETS_2026: Record<string, number> = {
  '2026-01': 640000,
  '2026-02': 530000,
  '2026-03': 530000,
  '2026-04': 530000,
  '2026-05': 530000,
  '2026-06': 530000,
  '2026-07': 530000,
  '2026-08': 530000,
  '2026-09': 530000,
  '2026-10': 530000,
  '2026-11': 795000, // Black Friday / Holiday
  '2026-12': 635000,
};

export interface SKUForecast {
  sku: string;
  name: string;
  category: 'plushie' | 'charm' | 'jumbo' | 'clothing' | 'accessory';
  tier?: 'A' | 'B' | 'C';
  forecastUnits: number;
  forecastRevenue: number;
  unitPrice: number;
  currentInventory: number;
  inboundUnits: number;
  gap: number;
  canFulfill: boolean;
  daysUntilStockout?: number;
  urgency: 'critical' | 'warning' | 'good' | 'excess';
}

export interface MonthlySupplyPlan {
  month: string;
  year: number;
  revenueTarget: number;
  productRevenue: number;
  skuForecasts: SKUForecast[];
  summary: {
    totalUnits: number;
    plushieUnits: number;
    charmUnits: number;
    totalGap: number;
    canHitTarget: boolean;
    fillRate: number;
    criticalSkus: number;
    estimatedRevenue: number;
  };
}

export interface YearlySupplyPlan {
  year: number;
  months: MonthlySupplyPlan[];
  annualSummary: {
    totalRevenue: number;
    achievableRevenue: number;
    gapRevenue: number;
    totalUnits: number;
    criticalMonths: string[];
  };
}

// Mock current inventory - in production would come from API
const CURRENT_INVENTORY: Record<string, { qty: number; inbound: number; velocity: number }> = {
  'OG-M-009': { qty: 1850, inbound: 500, velocity: 42 },
  'OG-M-002': { qty: 1290, inbound: 300, velocity: 35 },
  'OG-M-001': { qty: 920, inbound: 300, velocity: 28 },
  'OG-M-008': { qty: 580, inbound: 200, velocity: 22 },
  'OG-M-003': { qty: 490, inbound: 0, velocity: 18 },
  'OG-M-004': { qty: 280, inbound: 0, velocity: 15 },
  'OG-M-007': { qty: 720, inbound: 0, velocity: 25 },
  'OG-M-005': { qty: 275, inbound: 200, velocity: 12 },
  'OG-M-011': { qty: 180, inbound: 0, velocity: 14 },
  'OG-M-012': { qty: 155, inbound: 0, velocity: 12 },
  'OG-M-010': { qty: 300, inbound: 300, velocity: 8 },
  'OG-KEY-007': { qty: 890, inbound: 0, velocity: 28 },
  'OG-KEY-009': { qty: 720, inbound: 0, velocity: 32 },
  'OG-KEY-003': { qty: 450, inbound: 0, velocity: 20 },
  'OG-KEY-008': { qty: 320, inbound: 0, velocity: 18 },
  'OG-KEY-001': { qty: 525, inbound: 500, velocity: 15 },
  'OG-KEY-002': { qty: 280, inbound: 0, velocity: 12 },
  'OG-KEY-012': { qty: 190, inbound: 0, velocity: 10 },
  'OG-KEY-005': { qty: 165, inbound: 0, velocity: 8 },
  'OG-KEY-011': { qty: 145, inbound: 0, velocity: 6 },
  'OG-KEY-004': { qty: 210, inbound: 0, velocity: 9 },
  'OG-KEY-010': { qty: 85, inbound: 0, velocity: 3 },
};

/**
 * Calculate SKU-level unit forecast from revenue target
 * Using Capy-Era's top-down waterfall methodology
 */
export function calculateMonthlyPlan(
  revenueTarget: number,
  month: string,
  year: number,
  options: {
    plushieShare?: number;
    charmShare?: number;
    oldShare?: number;
  } = {}
): MonthlySupplyPlan {
  const plushieShare = options.plushieShare ?? ALLOCATION.plushieShare.default;
  const charmShare = options.charmShare ?? ALLOCATION.charmShare.default;
  const oldShare = options.oldShare ?? ALLOCATION.oldProductShare;

  // Step 1-3: Calculate category allocations
  const productRevenue = revenueTarget * (1 - ALLOCATION.shipping);
  const clothingRevenue = productRevenue * ALLOCATION.clothing;
  const accessoriesRevenue = productRevenue * ALLOCATION.accessories;
  const jumboRevenue = productRevenue * ALLOCATION.jumbo;
  
  // Variable pool (after fixed categories)
  const variablePool = productRevenue * (1 - ALLOCATION.clothing - ALLOCATION.accessories - ALLOCATION.jumbo);
  
  // Step 4: Split plushies vs charms
  const plushieRevenue = variablePool * plushieShare;
  const charmRevenue = variablePool * charmShare;
  
  // Step 5: Split old vs new (we forecast old/evergreen only)
  const oldPlushieRevenue = plushieRevenue * oldShare;
  const oldCharmRevenue = charmRevenue * oldShare;
  
  // Step 6-7: Convert to units and distribute to SKUs
  const skuForecasts: SKUForecast[] = [];
  
  // Process plushie tiers
  for (const [tierName, tier] of Object.entries(PLUSHIE_TIERS)) {
    const tierRevenue = oldPlushieRevenue * tier.share;
    for (const sku of tier.skus) {
      const skuRevenue = tierRevenue * sku.share;
      const units = Math.round(skuRevenue / PRICES.plushie.evergreen);
      const inventory = CURRENT_INVENTORY[sku.sku] || { qty: 0, inbound: 0, velocity: 10 };
      const totalSupply = inventory.qty + inventory.inbound;
      const gap = units - totalSupply;
      const daysUntilStockout = inventory.velocity > 0 ? Math.round(totalSupply / inventory.velocity) : 999;
      
      skuForecasts.push({
        sku: sku.sku,
        name: sku.name,
        category: 'plushie',
        tier: tierName as 'A' | 'B' | 'C',
        forecastUnits: units,
        forecastRevenue: skuRevenue,
        unitPrice: PRICES.plushie.evergreen,
        currentInventory: inventory.qty,
        inboundUnits: inventory.inbound,
        gap: Math.max(0, gap),
        canFulfill: gap <= 0,
        daysUntilStockout,
        urgency: daysUntilStockout <= 7 ? 'critical' : daysUntilStockout <= 14 ? 'warning' : daysUntilStockout <= 30 ? 'good' : 'excess',
      });
    }
  }
  
  // Process charm tiers
  for (const [tierName, tier] of Object.entries(CHARM_TIERS)) {
    const tierRevenue = oldCharmRevenue * tier.share;
    for (const sku of tier.skus) {
      const skuRevenue = tierRevenue * sku.share;
      const units = Math.round(skuRevenue / PRICES.charm.evergreen);
      const inventory = CURRENT_INVENTORY[sku.sku] || { qty: 0, inbound: 0, velocity: 5 };
      const totalSupply = inventory.qty + inventory.inbound;
      const gap = units - totalSupply;
      const daysUntilStockout = inventory.velocity > 0 ? Math.round(totalSupply / inventory.velocity) : 999;
      
      skuForecasts.push({
        sku: sku.sku,
        name: sku.name,
        category: 'charm',
        tier: tierName as 'A' | 'B' | 'C',
        forecastUnits: units,
        forecastRevenue: skuRevenue,
        unitPrice: PRICES.charm.evergreen,
        currentInventory: inventory.qty,
        inboundUnits: inventory.inbound,
        gap: Math.max(0, gap),
        canFulfill: gap <= 0,
        daysUntilStockout,
        urgency: daysUntilStockout <= 7 ? 'critical' : daysUntilStockout <= 14 ? 'warning' : daysUntilStockout <= 30 ? 'good' : 'excess',
      });
    }
  }
  
  // Calculate summary
  const totalUnits = skuForecasts.reduce((s, f) => s + f.forecastUnits, 0);
  const plushieUnits = skuForecasts.filter(f => f.category === 'plushie').reduce((s, f) => s + f.forecastUnits, 0);
  const charmUnits = skuForecasts.filter(f => f.category === 'charm').reduce((s, f) => s + f.forecastUnits, 0);
  const totalGap = skuForecasts.reduce((s, f) => s + f.gap, 0);
  const criticalSkus = skuForecasts.filter(f => f.urgency === 'critical').length;
  
  const fulfillableUnits = skuForecasts.reduce((s, f) => {
    return s + Math.min(f.forecastUnits, f.currentInventory + f.inboundUnits);
  }, 0);
  const fillRate = totalUnits > 0 ? fulfillableUnits / totalUnits : 1;
  
  const estimatedRevenue = skuForecasts.reduce((s, f) => {
    const fulfillable = Math.min(f.forecastUnits, f.currentInventory + f.inboundUnits);
    return s + (fulfillable * f.unitPrice);
  }, 0);
  
  return {
    month,
    year,
    revenueTarget,
    productRevenue,
    skuForecasts: skuForecasts.sort((a, b) => {
      // Sort by urgency, then by tier
      const urgencyOrder = { critical: 0, warning: 1, good: 2, excess: 3 };
      if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
        return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      }
      const tierOrder = { A: 0, B: 1, C: 2 };
      return (tierOrder[a.tier!] || 2) - (tierOrder[b.tier!] || 2);
    }),
    summary: {
      totalUnits,
      plushieUnits,
      charmUnits,
      totalGap,
      canHitTarget: fillRate >= 0.95,
      fillRate,
      criticalSkus,
      estimatedRevenue: estimatedRevenue + clothingRevenue + accessoriesRevenue + jumboRevenue,
    },
  };
}

/**
 * Generate 12-month supply plan
 */
export function generateYearlyPlan(startMonth: string, customTargets?: Record<string, number>): YearlySupplyPlan {
  const [startYear, startMonthNum] = startMonth.split('-').map(Number);
  const months: MonthlySupplyPlan[] = [];
  
  for (let i = 0; i < 12; i++) {
    const monthNum = ((startMonthNum - 1 + i) % 12) + 1;
    const year = startYear + Math.floor((startMonthNum - 1 + i) / 12);
    const monthStr = `${year}-${String(monthNum).padStart(2, '0')}`;
    
    const target = customTargets?.[monthStr] ?? MONTHLY_TARGETS_2026[monthStr] ?? 530000;
    months.push(calculateMonthlyPlan(target, monthStr, year));
  }
  
  const totalRevenue = months.reduce((s, m) => s + m.revenueTarget, 0);
  const achievableRevenue = months.reduce((s, m) => s + m.summary.estimatedRevenue, 0);
  const totalUnits = months.reduce((s, m) => s + m.summary.totalUnits, 0);
  const criticalMonths = months
    .filter(m => !m.summary.canHitTarget || m.summary.criticalSkus > 3)
    .map(m => m.month);
  
  return {
    year: startYear,
    months,
    annualSummary: {
      totalRevenue,
      achievableRevenue,
      gapRevenue: totalRevenue - achievableRevenue,
      totalUnits,
      criticalMonths,
    },
  };
}

/**
 * Generate PO recommendations based on gaps
 */
export interface PORecommendation {
  sku: string;
  name: string;
  category: string;
  tier: string;
  currentQty: number;
  inboundQty: number;
  monthlyDemand: number;
  recommendedQty: number;
  urgency: 'immediate' | 'this_week' | 'next_week' | 'next_month';
  estimatedCost: number;
  daysUntilStockout: number;
  reasoning: string;
}

export function generatePORecommendations(plan: MonthlySupplyPlan): PORecommendation[] {
  const recommendations: PORecommendation[] = [];
  
  for (const forecast of plan.skuForecasts) {
    if (forecast.gap > 0 || forecast.urgency === 'critical' || forecast.urgency === 'warning') {
      // Calculate recommended order qty (2-month buffer)
      const monthlyDemand = forecast.forecastUnits;
      const twoMonthBuffer = monthlyDemand * 2;
      const safetyStock = Math.round(monthlyDemand * 0.2); // 20% safety
      const neededQty = twoMonthBuffer + safetyStock - (forecast.currentInventory + forecast.inboundUnits);
      const recommendedQty = Math.max(0, Math.ceil(neededQty / 100) * 100); // Round up to 100s
      
      if (recommendedQty > 0) {
        const unitCost = forecast.category === 'plushie' ? 5.50 : 3.50;
        
        let urgency: PORecommendation['urgency'];
        let reasoning: string;
        
        if (forecast.daysUntilStockout && forecast.daysUntilStockout <= 7) {
          urgency = 'immediate';
          reasoning = `Only ${forecast.daysUntilStockout} days of stock left! Rush order needed.`;
        } else if (forecast.daysUntilStockout && forecast.daysUntilStockout <= 14) {
          urgency = 'this_week';
          reasoning = `${forecast.daysUntilStockout} days of stock - order this week to avoid stockout.`;
        } else if (forecast.daysUntilStockout && forecast.daysUntilStockout <= 21) {
          urgency = 'next_week';
          reasoning = `${forecast.daysUntilStockout} days of stock - plan order for next week.`;
        } else {
          urgency = 'next_month';
          reasoning = `Adequate stock for now. Plan ahead for next month's demand.`;
        }
        
        recommendations.push({
          sku: forecast.sku,
          name: forecast.name,
          category: forecast.category,
          tier: forecast.tier || 'N/A',
          currentQty: forecast.currentInventory,
          inboundQty: forecast.inboundUnits,
          monthlyDemand,
          recommendedQty,
          urgency,
          estimatedCost: recommendedQty * unitCost,
          daysUntilStockout: forecast.daysUntilStockout || 999,
          reasoning,
        });
      }
    }
  }
  
  return recommendations.sort((a, b) => {
    const urgencyOrder = { immediate: 0, this_week: 1, next_week: 2, next_month: 3 };
    return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
  });
}

export const revenueForecasting = {
  calculateMonthlyPlan,
  generateYearlyPlan,
  generatePORecommendations,
  MONTHLY_TARGETS_2026,
  PRICES,
  ALLOCATION,
};
