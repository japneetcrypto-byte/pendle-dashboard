"use client"

import { useState } from "react"
import TokenRow from "./token-row"

interface Token {
  id: string
  name: string
  type: "PT" | "YT"
  chain: string
  price: number
  change1h: number
  change24h: number
  fixedApy: number
  impliedApy: number
  daysToExpiry: number
}

const mockTokens: Token[] = [
  {
    id: "1",
    name: "PENDLE-LPT",
    type: "PT",
    chain: "Ethereum",
    price: 1.0082,
    change1h: 0.25,
    change24h: -3.81,
    fixedApy: 9.83,
    impliedApy: 10.45,
    daysToExpiry: 45,
  },
  {
    id: "2",
    name: "PENDLE-LPT",
    type: "PT",
    chain: "Ethereum",
    price: 1.0067,
    change1h: 0.67,
    change24h: -1.8,
    fixedApy: 4.34,
    impliedApy: 4.82,
    daysToExpiry: 45,
  },
  {
    id: "3",
    name: "PENDLE-LPT",
    type: "PT",
    chain: "Ethereum",
    price: 0.9676,
    change1h: 1.53,
    change24h: -3.66,
    fixedApy: 11.76,
    impliedApy: 12.43,
    daysToExpiry: 45,
  },
  {
    id: "4",
    name: "SY-MC_PTs",
    type: "PT",
    chain: "Ethereum",
    price: 1.0219,
    change1h: -0.46,
    change24h: -3.82,
    fixedApy: 16.06,
    impliedApy: 16.92,
    daysToExpiry: 151,
  },
  {
    id: "5",
    name: "PENDLE-LPT",
    type: "PT",
    chain: "Ethereum",
    price: 1.0359,
    change1h: 0.86,
    change24h: -0.68,
    fixedApy: 13.15,
    impliedApy: 13.87,
    daysToExpiry: 118,
  },
  {
    id: "6",
    name: "PT-AIdaUSDC-30OCT2025",
    type: "PT",
    chain: "Ethereum",
    price: 1.0094,
    change1h: -1.68,
    change24h: -2.77,
    fixedApy: 12.31,
    impliedApy: 13.02,
    daysToExpiry: 98,
  },
  {
    id: "7",
    name: "PT-AIdaUSDC-14AUG2025",
    type: "PT",
    chain: "Ethereum",
    price: 1.0329,
    change1h: -1.76,
    change24h: -3.24,
    fixedApy: 13.25,
    impliedApy: 14.01,
    daysToExpiry: 68,
  },
]

export default function TokenTable() {
  const [tokens] = useState(mockTokens)

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
