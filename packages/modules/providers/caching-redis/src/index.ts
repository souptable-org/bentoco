import { ModuleProvider, Modules } from "@bentoco/framework/utils"
import Connection from "./loaders/connection"
import Hash from "./loaders/hash"
import { RedisCachingProvider } from "./services/redis-cache"

const services = [RedisCachingProvider]
const loaders = [Connection, Hash]

export default ModuleProvider(Modules.CACHING, {
  services,
  loaders,
})
