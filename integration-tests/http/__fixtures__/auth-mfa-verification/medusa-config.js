const { defineConfig, Modules } = require("@bentoco/utils")
const os = require("os")
const path = require("path")

const DB_HOST = process.env.DB_HOST
const DB_USERNAME = process.env.DB_USERNAME
const DB_PASSWORD = process.env.DB_PASSWORD
const DB_NAME = process.env.DB_TEMP_NAME
const DB_URL = `postgres://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}/${DB_NAME}`
process.env.DATABASE_URL = DB_URL
process.env.LOG_LEVEL = "error"

const customFulfillmentProvider = {
  resolve: "@bentoco/fulfillment-manual",
  id: "test-provider",
}

const customFulfillmentProviderCalculated = {
  resolve: require("../../dist/utils/providers/fulfillment-manual-calculated")
    .default,
  id: "test-provider-calculated",
}

const customPaymentProvider = {
  resolve: {
    services: [require("@bentoco/payment/dist/providers/system").default],
  },
  id: "default_2",
}

const modules = {
  [Modules.PAYMENT]: {
    resolve: "@bentoco/payment",
    options: {
      providers: [customPaymentProvider],
    },
  },
  [Modules.FULFILLMENT]: {
    options: {
      providers: [
        customFulfillmentProvider,
        customFulfillmentProviderCalculated,
      ],
    },
  },
  [Modules.NOTIFICATION]: {
    resolve: "@bentoco/notification",
    options: {
      providers: [
        {
          resolve: "@bentoco/notification-local",
          id: "local",
          options: {
            name: "Local Notification Provider",
            channels: ["feed"],
          },
        },
      ],
    },
  },
  [Modules.FILE]: {
    resolve: "@bentoco/file",
    options: {
      providers: [
        {
          resolve: "@bentoco/file-local",
          id: "local",
          options: {
            upload_dir: path.join(os.tmpdir(), "uploads"),
            private_upload_dir: path.join(os.tmpdir(), "static"),
          },
        },
      ],
    },
  },
  [Modules.INDEX]: {
    resolve: "@bentoco/index",
    disable: process.env.ENABLE_INDEX_MODULE !== "true",
  },
  [Modules.RBAC]: {
    resolve: "@bentoco/rbac",
    disable: process.env.MEDUSA_FF_RBAC !== "true",
  },
  [Modules.AUTH]: {
    options: {
      mfa: {
        encryption_key: "test-mfa-encryption-key",
      },
      providers: [
        {
          resolve: "@bentoco/medusa/auth-emailpass",
          id: "emailpass",
        },
      ],
    },
  },
}

if (process.env.MEDUSA_FF_TRANSLATION === "true") {
  modules[Modules.TRANSLATION] = {
    resolve: "@bentoco/translation",
  }
}

module.exports = defineConfig({
  admin: {
    disable: true,
  },
  projectConfig: {
    http: {
      jwtSecret: "test",
      authVerificationsPerActor: {
        user: [
          {
            entity_type: "email",
            auth_provider: "emailpass",
          },
        ],
      },
    },
  },
  featureFlags: {
    index_engine: process.env.ENABLE_INDEX_MODULE === "true",
    translation: process.env.MEDUSA_FF_TRANSLATION === "true",
    rbac: process.env.MEDUSA_FF_RBAC === "true",
  },
  modules,
  plugins: [
    {
      resolve: "@bentoco/loyalty-plugin",
      options: {},
    },
  ],
})
