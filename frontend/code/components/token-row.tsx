"use client"

import { Button } from "@/components/ui/button"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"

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

interface TokenRowProps {
  token: Token
}

const PercentChange = ({ value }: { value: number }) => {
  const isPositive = value >= 0
  return (
    <div className="flex items-center gap-1 text-sm font-medium">
      {isPositive ? (
        <>
          <ArrowUpRight size={16} className="text-emerald-600 flex-shrink-0" />
          <span className="text-emerald-600">
            {isPositive ? "+" : ""}
            {value.toFixed(2)}%
          </span>
        </>
      ) : (
        <>
          <ArrowDownRight size={16} className="text-red-600 flex-shrink-0" />
          <span className="text-red-600">{value.toFixed(2)}%</span>
        </>
      )}
    </div>
  )
}

export default function TokenRow({ token }: TokenRowProps) {
  return (
    <tr className="border-b border-border hover:bg-muted/30 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <span
            className={`px-2.5 py-1 rounded text-xs font-semibold ${
              token.type === "PT" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
            }`}
          >
            {token.type}
          </span>
          <div>
            <div className="font-semibold text-foreground">{token.name}</div>
            <div className="text-xs text-muted-foreground">{token.chain}</div>
          </div>
        </div>
      </td>

      <td className="px-6 py-4">
        <span className="font-semibold text-foreground">${token.price.toFixed(4)}</span>
      </td>

      <td className="px-6 py-4">
        <PercentChange value={token.change24h} />
      </td>

      <td className="px-6 py-4">
        <span className="font-semibold text-amber-600">{token.fixedApy.toFixed(2)}%</span>
      </td>

      <td className="px-6 py-4">
        <span className="font-semibold text-foreground">{token.impliedApy.toFixed(2)}%</span>
      </td>

      <td className="px-6 py-4">
        <span className="font-semibold text-foreground">{token.daysToExpiry}</span>
      </td>

      <td className="px-6 py-4 text-right">
        <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
          View Details
        </Button>
      </td>
    </tr>
  )
}
