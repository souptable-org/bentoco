import React from "react"
import ReactDOM from "react-dom/client"
import App from "./app.js"
import { ensureModeFromHost } from "./lib/agency-session"

// Dual-mode: agency.* host marks agency session before first paint routes resolve
try {
  ensureModeFromHost()
} catch {
  // ignore storage errors
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
