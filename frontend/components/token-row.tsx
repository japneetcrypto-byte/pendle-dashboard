"use client"

import { Button } from "@/components/ui/button"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"
import { Market } from "@/lib/api"

interface TokenRowProps {
  token: Market
}

const PercentChange = ({ value }: { value: number | undefined }) => {
  const numValue = typeof value === 'number' ? value : 0
  const isPositive = numValue >= 0
  return (
    <div className="flex items-center gap-1 text-sm font-medium">
      {isPositive ? (
        <>
          <ArrowUpRight size={16} className="text-emerald-600 flex-shrink-0" />
          <span className="text-emerald-600">
            {isPositive ? "+" : ""}
            {numValue.toFixed(2)}%
          </span>
        </>
      ) : (
        <>
          <ArrowDownRight size={16} className="text-red-600 flex-shrink-0" />
          <span className="text-red-600">{numValue.toFixed(2)}%</span>
        </>
      )}
    </div>
  )
}

export default function TokenRow({ token }: TokenRowProps) {
  // Ensure values are numbers
  const ptPrice = typeof token.ptPrice === 'number' ? token.ptPrice : 0
  const ptPriceUSD = typeof token.ptPriceUSD === 'number' ? token.ptPriceUSD : 0  // ✅ ADD THIS
  const fixedAPY = typeof token.fixedAPY === 'number' ? token.fixedAPY : 0
  const impliedAPY = typeof token.impliedAPY === 'number' ? token.impliedAPY : 0
  const daysToMaturity = typeof token.daysToMaturity === 'number' ? token.daysToMaturity : 0
  const change24h = typeof token.change24h === 'number' ? token.change24h : 0

  return (
    <tr className="border-b border-border hover:bg-muted/30 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded text-xs font-semibold bg-amber-100 text-amber-700">
            PT
          </span>
          <div>
            <div className="font-semibold text-foreground">{token.name || "Unknown"}</div>
            <div className="text-xs text-muted-foreground">{token.underlyingAsset || "N/A"}</div>
          </div>
        </div>
      </td>

      <td className="px-6 py-4">
        <div>
          <span className="font-semibold text-foreground">
            {ptPrice.toFixed(4)} {token.underlyingAsset || "Asset"}
          </span>
          <div className="text-xs text-muted-foreground">
            ${ptPriceUSD.toFixed(2)}
          </div>
        </div>
      </td>

      <td className="px-6 py-4">
        <PercentChange value={change24h} />
      </td>

      <td className="px-6 py-4">
        <span className="font-semibold text-amber-600">{fixedAPY.toFixed(2)}%</span>
      </td>

      <td className="px-6 py-4">
        <span className="font-semibold text-foreground">{impliedAPY.toFixed(2)}%</span>
      </td>

      <td className="px-6 py-4">
        <span className="font-semibold text-foreground">{daysToMaturity}</span>
      </td>

      <td className="px-6 py-4 text-right">
        <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
          View Details
        </Button>
      </td>
    </tr>
  )
}
