"use client"

import { Button } from "@/components/ui/button"
import { ArrowUpRight, ArrowDownRight, TrendingUp } from "lucide-react"

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

interface TokenCardProps {
  token: Token
}

const ChainBadge = ({ chain }: { chain: string }) => {
  const colors: Record<string, { bg: string; text: string }> = {
    Ethereum: { bg: "bg-blue-500/15", text: "text-blue-400" },
    Arbitrum: { bg: "bg-cyan-500/15", text: "text-cyan-400" },
    Base: { bg: "bg-purple-500/15", text: "text-purple-400" },
  }

  const color = colors[chain] || { bg: "bg-gray-500/15", text: "text-gray-400" }

  return <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${color.bg} ${color.text}`}>{chain}</span>
}

const TypeBadge = ({ type }: { type: "PT" | "YT" }) => {
  return (
    <span
      className={`px-2.5 py-1 rounded-md text-xs font-bold ${
        type === "PT" ? "bg-accent/20 text-accent" : "bg-chart-2/20 text-chart-2"
      }`}
    >
      {type}
    </span>
  )
}

const PercentBadge = ({ value, label }: { value: number; label: string }) => {
  const isPositive = value >= 0
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1.5">
        {isPositive ? (
          <ArrowUpRight size={14} className="text-green-400" />
        ) : (
          <ArrowDownRight size={14} className="text-red-400" />
        )}
        <span className={`text-sm font-semibold ${isPositive ? "text-green-400" : "text-red-400"}`}>
          {isPositive ? "+" : ""}
          {value.toFixed(2)}%
        </span>
      </div>
    </div>
  )
}

export default function TokenCard({ token }: TokenCardProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 hover:border-accent/50 transition-all hover:shadow-lg hover:shadow-accent/10">
      {/* Header: Token info + Type badge */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap gap-y-1.5">
            <TypeBadge type={token.type} />
            <ChainBadge chain={token.chain} />
          </div>
          <h3 className="text-base font-bold text-foreground leading-tight break-words">{token.name}</h3>
        </div>
      </div>

      {/* Price section */}
      <div className="mb-4 pb-4 border-b border-border">
        <span className="text-xs font-medium text-muted-foreground">Current Price</span>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-xl font-bold text-foreground">${token.price.toFixed(4)}</span>
          <PercentBadge value={token.change1h} label="1H" />
        </div>
      </div>

      {/* APY section */}
      <div className="grid grid-cols-2 gap-3 mb-4 pb-4 border-b border-border">
        <div>
          <span className="text-xs font-medium text-muted-foreground block mb-1">Fixed APY</span>
          <div className="flex items-center gap-1.5">
            <TrendingUp size={14} className="text-accent" />
            <span className="text-base font-bold text-accent">{token.fixedApy.toFixed(2)}%</span>
          </div>
        </div>
        <div>
          <span className="text-xs font-medium text-muted-foreground block mb-1">Implied APY</span>
          <div className="flex items-center gap-1.5">
            <TrendingUp size={14} className="text-chart-2" />
            <span className="text-base font-bold text-chart-2">{token.impliedApy.toFixed(2)}%</span>
          </div>
        </div>
      </div>

      {/* 24H change + Days to expiry */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <PercentBadge value={token.change24h} label="24H Change" />
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">Days to Expiry</span>
          <span className="text-sm font-semibold text-foreground">{token.daysToExpiry} days</span>
        </div>
      </div>

      {/* View Details button */}
      <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold h-9 rounded-md transition-colors">
        View Details →
      </Button>
    </div>
  )
}
