import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Product master data
  products: defineTable({
    sku: v.string(),
    name: v.string(),
    category: v.string(),
    imageBase64: v.optional(v.string()),
    imageMimeType: v.optional(v.string()),
    cogs: v.number(),
    weight: v.number(),
    dimensions: v.object({
      length: v.number(),
      width: v.number(),
      height: v.number(),
    }),
    retailPrice: v.optional(v.number()),
    isActive: v.boolean(),
    notes: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_sku", ["sku"]),

  // Daily metrics (existing - schema matches Valencia daily reports)
  dailyMetrics: defineTable({
    date: v.string(),
    dayOfWeek: v.optional(v.string()),
    orders: v.number(),
    revenue: v.number(),
    adSpend: v.optional(v.number()),
    totalSpend: v.optional(v.number()),
    metaSpend: v.optional(v.number()),
    googleSpend: v.optional(v.number()),
    roas: v.number(),
    cm3: v.optional(v.number()),
    netProfit: v.optional(v.number()),
    newCustomers: v.optional(v.number()),
    returningCustomers: v.optional(v.number()),
    newCustomerOrders: v.optional(v.number()),
    returningCustomerOrders: v.optional(v.number()),
    newCustomerRevenue: v.optional(v.number()),
    returningCustomerRevenue: v.optional(v.number()),
    newCustomerAov: v.optional(v.number()),
    returningCustomerAov: v.optional(v.number()),
    newCustomerPercent: v.optional(v.number()),
    returningCustomerPercent: v.optional(v.number()),
    avgOrderValue: v.optional(v.number()),
    aov: v.optional(v.number()),
    unitsSold: v.optional(v.number()),
    cpa: v.optional(v.number()),
    cogsAndShipping: v.optional(v.number()),
    processingFees: v.optional(v.number()),
    dailyOpex: v.optional(v.number()),
    createdAt: v.optional(v.string()),
    updatedAt: v.optional(v.number()),
  }).index("by_date", ["date"]),
});
