import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // App backup data (all localStorage data in one place)
  appBackups: defineTable({
    backupId: v.string(),
    userId: v.string(),
    data: v.string(), // JSON stringified app state
    createdAt: v.string(),
    description: v.optional(v.string()),
  }).index("by_user", ["userId"])
    .index("by_backup_id", ["backupId"]),

  // Bundle registry
  bundles: defineTable({
    bundleSku: v.string(),
    components: v.array(v.object({
      sku: v.string(),
      quantity: v.number(),
    })),
    isCustom: v.boolean(),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_sku", ["bundleSku"]),

  // Suppliers
  suppliers: defineTable({
    supplierId: v.string(),
    name: v.string(),
    contact: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    leadTimeDays: v.optional(v.number()),
    notes: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_supplier_id", ["supplierId"]),

  // Purchase Orders
  purchaseOrders: defineTable({
    poNumber: v.string(),
    supplierId: v.string(),
    status: v.string(),
    items: v.array(v.object({
      sku: v.string(),
      quantity: v.number(),
      unitCost: v.number(),
    })),
    totalCost: v.number(),
    orderDate: v.string(),
    expectedDate: v.optional(v.string()),
    receivedDate: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_po_number", ["poNumber"])
    .index("by_status", ["status"]),

  // Inventory adjustments/overrides
  inventoryAdjustments: defineTable({
    sku: v.string(),
    adjustmentType: v.string(),
    quantity: v.number(),
    reason: v.optional(v.string()),
    createdAt: v.string(),
    createdBy: v.optional(v.string()),
  }).index("by_sku", ["sku"]),

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
