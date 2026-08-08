import "./types"
import { SettingsModuleService } from "@/services"
import { Module } from "@bentoco/framework/utils"
import { Modules } from "@bentoco/utils"

export default Module(Modules.SETTINGS, {
  service: SettingsModuleService,
})

export * from "./utils"
