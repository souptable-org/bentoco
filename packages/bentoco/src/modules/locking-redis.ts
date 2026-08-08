import RedisLockingProvider from "@bentoco/locking-redis"

export * from "@bentoco/locking-redis"

export default RedisLockingProvider
export const discoveryPath = require.resolve("@bentoco/locking-redis")
