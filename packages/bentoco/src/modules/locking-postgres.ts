import PostgresLockingProvider from "@bentoco/locking-postgres"

export * from "@bentoco/locking-postgres"

export default PostgresLockingProvider
export const discoveryPath = require.resolve("@bentoco/locking-postgres")
