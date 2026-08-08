export const Modules = {
  ANALYTICS: "analytics",
  AUTH: "auth",
  CACHE: "cache",
  CART: "cart",
  CUSTOMER: "customer",
  EVENT_BUS: "event_bus",
  INVENTORY: "inventory",
  LINK: "link_modules",
  PAYMENT: "payment",
  PRICING: "pricing",
  PRODUCT: "product",
  PROMOTION: "promotion",
  SALES_CHANNEL: "sales_channel",
  TAX: "tax",
  FULFILLMENT: "fulfillment",
  STOCK_LOCATION: "stock_location",
  USER: "user",
  WORKFLOW_ENGINE: "workflows",
  REGION: "region",
  ORDER: "order",
  API_KEY: "api_key",
  STORE: "store",
  CURRENCY: "currency",
  FILE: "file",
  NOTIFICATION: "notification",
  INDEX: "index",
  LOCKING: "locking",
  SETTINGS: "settings",
  CACHING: "caching",
  TRANSLATION: "translation",
  RBAC: "rbac",
} as const

export const MODULE_PACKAGE_NAMES = {
  [Modules.ANALYTICS]: "@bentoco/medusa/analytics",
  [Modules.AUTH]: "@bentoco/medusa/auth",
  [Modules.CACHE]: "@bentoco/medusa/cache-inmemory",
  [Modules.CART]: "@bentoco/medusa/cart",
  [Modules.CUSTOMER]: "@bentoco/medusa/customer",
  [Modules.EVENT_BUS]: "@bentoco/medusa/event-bus-local",
  [Modules.INVENTORY]: "@bentoco/medusa/inventory",
  [Modules.LINK]: "@bentoco/medusa/link-modules",
  [Modules.PAYMENT]: "@bentoco/medusa/payment",
  [Modules.PRICING]: "@bentoco/medusa/pricing",
  [Modules.PRODUCT]: "@bentoco/medusa/product",
  [Modules.PROMOTION]: "@bentoco/medusa/promotion",
  [Modules.SALES_CHANNEL]: "@bentoco/medusa/sales-channel",
  [Modules.FULFILLMENT]: "@bentoco/medusa/fulfillment",
  [Modules.STOCK_LOCATION]: "@bentoco/medusa/stock-location",
  [Modules.TAX]: "@bentoco/medusa/tax",
  [Modules.USER]: "@bentoco/medusa/user",
  [Modules.WORKFLOW_ENGINE]: "@bentoco/medusa/workflow-engine-inmemory",
  [Modules.REGION]: "@bentoco/medusa/region",
  [Modules.ORDER]: "@bentoco/medusa/order",
  [Modules.API_KEY]: "@bentoco/medusa/api-key",
  [Modules.STORE]: "@bentoco/medusa/store",
  [Modules.CURRENCY]: "@bentoco/medusa/currency",
  [Modules.FILE]: "@bentoco/medusa/file",
  [Modules.NOTIFICATION]: "@bentoco/medusa/notification",
  [Modules.INDEX]: "@bentoco/medusa/index-module",
  [Modules.LOCKING]: "@bentoco/medusa/locking",
  [Modules.SETTINGS]: "@bentoco/medusa/settings",
  [Modules.CACHING]: "@bentoco/medusa/caching",
  [Modules.TRANSLATION]: "@bentoco/medusa/translation",
  [Modules.RBAC]: "@bentoco/medusa/rbac",
}

export const REVERSED_MODULE_PACKAGE_NAMES = Object.entries(
  MODULE_PACKAGE_NAMES
).reduce((acc, [key, value]) => {
  acc[value] = key
  return acc
}, {})

// TODO: temporary fix until the event bus, cache and workflow engine are migrated to use providers and therefore only a single resolution will be good
export const TEMPORARY_REDIS_MODULE_PACKAGE_NAMES = {
  [Modules.EVENT_BUS]: "@bentoco/medusa/event-bus-redis",
  [Modules.CACHE]: "@bentoco/medusa/cache-redis",
  [Modules.WORKFLOW_ENGINE]: "@bentoco/medusa/workflow-engine-redis",
  [Modules.LOCKING]: "@bentoco/medusa/locking-redis",
}

REVERSED_MODULE_PACKAGE_NAMES[
  TEMPORARY_REDIS_MODULE_PACKAGE_NAMES[Modules.EVENT_BUS]
] = Modules.EVENT_BUS
REVERSED_MODULE_PACKAGE_NAMES[
  TEMPORARY_REDIS_MODULE_PACKAGE_NAMES[Modules.CACHE]
] = Modules.CACHE
REVERSED_MODULE_PACKAGE_NAMES[
  TEMPORARY_REDIS_MODULE_PACKAGE_NAMES[Modules.WORKFLOW_ENGINE]
] = Modules.WORKFLOW_ENGINE
REVERSED_MODULE_PACKAGE_NAMES[
  TEMPORARY_REDIS_MODULE_PACKAGE_NAMES[Modules.LOCKING]
] = Modules.LOCKING

/**
 * Making modules be referenced as a type as well.
 */
export type Modules = (typeof Modules)[keyof typeof Modules]
export const ModuleRegistrationName = Modules
