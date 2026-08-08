import { defineConfig } from "@bentoco/utils"

const { Modules } = require("@bentoco/utils")

const DB_HOST = process.env.DB_HOST
const DB_USERNAME = process.env.DB_USERNAME
const DB_PASSWORD = process.env.DB_PASSWORD
const DB_NAME = process.env.DB_TEMP_NAME
const DB_URL = `postgres://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}/${DB_NAME}`
process.env.POSTGRES_URL = DB_URL
process.env.LOG_LEVEL = "error"

const customTaxProviderRegistration = {
  resolve: {
    services: [require("@bentoco/tax/dist/providers/system").default],
  },
  id: "system_2",
}

const customPaymentProvider = {
  resolve: {
    services: [require("@bentoco/payment/dist/providers/system").default],
  },
  id: "default_2",
}

const customFulfillmentProvider = {
  resolve: "@bentoco/fulfillment-manual",
  id: "test-provider",
}

const customFulfillmentProviderCalculated = {
  resolve: require("./dist/utils/providers/fulfillment-manual-calculated")
    .default,
  id: "test-provider-calculated",
}

module.exports = defineConfig({
  admin: {
    disable: true,
  },
  plugins: [
    {
      resolve: "@bentoco/loyalty-plugin",
      options: {},
    },
  ],
  projectConfig: {
    databaseUrl: DB_URL,
    databaseType: "postgres",
    http: {
      jwtSecret: "test",
      cookieSecret: "test",
    },
  },
  featureFlags: {},
  modules: [
    {
      key: "testingModule",
      resolve: "__tests__/__fixtures__/testing-module",
    },
    {
      key: "auth",
      resolve: "@bentoco/auth",
      options: {
        providers: [
          {
            id: "emailpass",
            resolve: "@bentoco/auth-emailpass",
          },
        ],
      },
    },
    {
      key: Modules.USER,
      scope: "internal",
      resolve: "@bentoco/user",
      options: {
        jwt_secret: "test",
      },
    },
    {
      key: Modules.CACHE,
      resolve: "@bentoco/cache-inmemory",
      options: { ttl: 0 }, // Cache disabled
    },
    {
      key: Modules.LOCKING,
      resolve: "@bentoco/locking",
    },
    {
      key: Modules.STOCK_LOCATION,
      resolve: "@bentoco/stock-location",
      options: {},
    },
    {
      key: Modules.INVENTORY,
      resolve: "@bentoco/inventory",
      options: {},
    },
    {
      key: Modules.PRODUCT,
      resolve: "@bentoco/product",
    },
    {
      key: Modules.PRICING,
      resolve: "@bentoco/pricing",
    },
    {
      key: Modules.PROMOTION,
      resolve: "@bentoco/promotion",
    },
    {
      key: Modules.REGION,
      resolve: "@bentoco/region",
    },
    {
      key: Modules.CUSTOMER,
      resolve: "@bentoco/customer",
    },
    {
      key: Modules.SALES_CHANNEL,
      resolve: "@bentoco/sales-channel",
    },
    {
      key: Modules.CART,
      resolve: "@bentoco/cart",
    },
    {
      key: Modules.WORKFLOW_ENGINE,
      resolve: "@bentoco/workflow-engine-inmemory",
    },
    {
      key: Modules.API_KEY,
      resolve: "@bentoco/api-key",
    },
    {
      key: Modules.STORE,
      resolve: "@bentoco/store",
    },
    {
      key: Modules.TAX,
      resolve: "@bentoco/tax",
      options: {
        providers: [customTaxProviderRegistration],
      },
    },
    {
      key: Modules.CURRENCY,
      resolve: "@bentoco/currency",
    },
    {
      key: Modules.ORDER,
      resolve: "@bentoco/order",
    },
    {
      key: Modules.PAYMENT,
      resolve: "@bentoco/payment",
      options: {
        providers: [customPaymentProvider],
      },
    },
    {
      key: Modules.FULFILLMENT,
      resolve: "@bentoco/fulfillment",
      options: {
        providers: [
          customFulfillmentProvider,
          customFulfillmentProviderCalculated,
        ],
      },
    },
    {
      key: Modules.NOTIFICATION,
      options: {
        providers: [
          {
            resolve: "@bentoco/notification-local",
            id: "local-notification-provider",
            options: {
              name: "Local Notification Provider",
              channels: ["log", "email"],
            },
          },
        ],
      },
    },
    {
      key: Modules.INDEX,
      resolve: "@bentoco/index",
      disable: process.env.ENABLE_INDEX_MODULE !== "true",
    },
    {
      key: "brand",
      resolve: "src/modules/brand",
    },
    {
      key: Modules.RBAC,
      resolve: "@bentoco/rbac",
    },
  ],
})
