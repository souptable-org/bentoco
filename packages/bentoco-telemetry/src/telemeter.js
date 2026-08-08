import fs from "fs"
import os from "os"

class Telemeter {
  constructor(options = {}) {
    this.trackingEnabled = false
    this.featureFlags_ = new Set()
    this.modules_ = new Set()
    this.plugins_ = []
  }

  getMachineId() {
    return "telemetry-disabled"
  }

  isTrackingEnabled() {
    return false
  }

  getOsInfo() {
    return {}
  }

  getMedusaVersion() {
    return "0.0.0"
  }

  getCliVersion() {
    return "0.0.0"
  }

  setTelemetryEnabled(enabled) {
    this.trackingEnabled = false
  }

  track(event, data) {
    // Purged: No tracking
    return
  }

  enqueue_(type, data) {
    // Purged: No queueing or network dispatches
    return
  }

  trackFeatureFlag(flag) {}

  trackModule(module) {}

  trackPlugin(plugin) {}
}

export default Telemeter
