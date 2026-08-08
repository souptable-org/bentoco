import "@bentoco/utils"
export * from "@bentoco/types"

import type { ModuleOptions as ModuleOptionsType } from "@bentoco/types"

// Re-declare ModuleOptions to enable augmentation from @bentoco/framework/types
// EventBusEventsOptions is exported via "export *" and gets augmentations from @bentoco/utils
export interface ModuleOptions extends ModuleOptionsType {}
