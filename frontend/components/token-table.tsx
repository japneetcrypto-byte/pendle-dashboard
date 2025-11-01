"use client"

import { useState, useEffect } from "react"
import TokenRow from "./token-row"
import { fetchMarkets, Market } from "@/lib/api"

export default function TokenTable() {
  const [tokens, setTokens] = useState<Market[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadTokens = async () => {
      setLoading(true)
      const data = await fetchMarkets()
      setTokens(data)
      setLoading(false)
    }

    loadTokens()

    // Refresh every 60 seconds
    const interval = setInterval(loadTokens, 60000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">TOKEN</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">PRICE</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">24H %</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">FIXED APY</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">IMPLIED APY</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">DAYS TO EXPIRY</th>
            <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">ACTION</th>
          </tr>
        </thead>
        <tbody>
          {tokens.map((token) => (
            <TokenRow key={token.id} token={token} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
