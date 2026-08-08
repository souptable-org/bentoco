import { Module } from "@bentoco/framework/utils";
import { PluginModule } from "../../types";
import StoreCreditService from "./service";

export default Module(PluginModule.STORE_CREDIT, {
  service: StoreCreditService,
});
