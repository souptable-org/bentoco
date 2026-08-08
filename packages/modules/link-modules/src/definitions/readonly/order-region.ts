import { ModuleJoinerConfig } from "@bentoco/framework/types"
import { Modules } from "@bentoco/framework/utils"

export const OrderRegion: ModuleJoinerConfig = {
  isLink: true,
  isReadOnlyLink: true,
  extends: [
    {
      serviceName: Modules.ORDER,
      entity: "Order",
      relationship: {
        serviceName: Modules.REGION,
        entity: "Region",
        primaryKey: "id",
        foreignKey: "region_id",
        alias: "region",
        args: {
          methodSuffix: "Regions",
        },
      },
    },
    {
      serviceName: Modules.REGION,
      entity: "Region",
      relationship: {
        serviceName: Modules.ORDER,
        entity: "Order",
        primaryKey: "region_id",
        foreignKey: "id",
        alias: "orders",
        args: {
          methodSuffix: "Orders",
        },
        isList: true,
      },
    },
  ],
}
