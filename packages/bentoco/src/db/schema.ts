import { pgTable, uuid, varchar, text, timestamp, boolean, jsonb, integer, serial } from "drizzle-orm/pg-core"

export const tenant = pgTable("tenant", {
  id: uuid("id").defaultRandom().primaryKey(),
  storeName: varchar("store_name", { length: 255 }).notNull(),
  subdomain: varchar("subdomain", { length: 255 }).notNull().unique(),
  customDomain: varchar("custom_domain", { length: 255 }).unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
})

export const product = pgTable("product", {
  id: varchar("id", { length: 255 }).primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenant.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  handle: varchar("handle", { length: 255 }),
  description: text("description"),
  status: varchar("status", { length: 50 }).default("draft"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
})

export const customer = pgTable("customer", {
  id: varchar("id", { length: 255 }).primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenant.id, { onDelete: "cascade" }),
  email: varchar("email", { length: 255 }).notNull(),
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
})

export const cart = pgTable("cart", {
  id: varchar("id", { length: 255 }).primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenant.id, { onDelete: "cascade" }),
  email: varchar("email", { length: 255 }),
  billingAddressId: varchar("billing_address_id", { length: 255 }),
  shippingAddressId: varchar("shipping_address_id", { length: 255 }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
})

export const order = pgTable("order", {
  id: varchar("id", { length: 255 }).primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenant.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 50 }).default("pending"),
  fulfillmentStatus: varchar("fulfillment_status", { length: 50 }).default("not_fulfilled"),
  paymentStatus: varchar("payment_status", { length: 50 }).default("awaiting"),
  displayId: serial("display_id"),
  cartId: varchar("cart_id", { length: 255 }),
  customerId: varchar("customer_id", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull(),
  currencyCode: varchar("currency_code", { length: 10 }).default("inr"),
  total: integer("total").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
})

export const user = pgTable("user", {
  id: varchar("id", { length: 255 }).primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenant.id, { onDelete: "cascade" }),
  email: varchar("email", { length: 255 }).notNull(),
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  role: varchar("role", { length: 50 }).default("member"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
})

export const tenantPaymentConfig = pgTable("tenant_payment_config", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenant.id, { onDelete: "cascade" }),
  providerId: varchar("provider_id", { length: 50 }).notNull(),
  encryptedPayload: jsonb("encrypted_payload").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
})
