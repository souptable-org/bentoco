"use client"

import React from "react"
import Link from "next/link"
import { AlertCircle, Home, ShoppingBag } from "lucide-react"

export function StoreNotFound({ domain, subdomain }: { domain: string; subdomain?: string }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-6 shadow-xl shadow-amber-500/5">
        <AlertCircle className="w-8 h-8" />
      </div>

      <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 mb-3">
        404 — Store Not Found
      </span>

      <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
        Storefront Unavailable
      </h1>

      <p className="mt-3 text-slate-400 text-sm sm:text-base max-w-md">
        No active merchant store exists at domain <code className="text-amber-300 bg-slate-900 px-2 py-0.5 rounded font-mono text-xs">{domain}</code>.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <a
          href="http://localhost:3000"
          className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs py-2.5 px-5 rounded-xl border border-slate-700 transition-colors"
        >
          <Home className="w-4 h-4" /> Return to Bentoco Platform
        </a>
      </div>

      <footer className="mt-16 text-slate-600 text-xs">
        Powered by Bentoco Storefront Engine • Multi-Tenant Routing
      </footer>
    </div>
  )
}
