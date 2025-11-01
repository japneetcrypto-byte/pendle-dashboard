import Header from "@/components/header"
import TokenTable from "@/components/token-table"
import { Database, TrendingUp, Zap, Radio } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "PendleTracker - Token Dashboard",
  description: "Live Pendle PT & YT token tracking across multiple chains",
}

function StatsCard({ icon: Icon, value, label }: { icon: any; value: string; label: string }) {
  return (
    <div className="bg-card rounded-lg border border-border p-6 text-center">
      <div className="flex justify-center mb-3">
        <Icon className="w-8 h-8 text-primary" />
      </div>
      <div className="text-2xl font-bold text-foreground mb-1">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-secondary">
      <Header />
      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3">
            Best Pendle PT & YT <span className="text-primary">Opportunities</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Live data from 252+ tokens across 4 blockchains. Discover the highest yielding opportunities in DeFi.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <StatsCard icon={Database} value="252" label="Tokens Tracked" />
          <StatsCard icon={TrendingUp} value="126" label="Active Markets" />
          <StatsCard icon={Zap} value="4" label="Blockchains" />
          <StatsCard icon={Radio} value="Live" label="Real-time Data" />
        </div>

        {/* Table Section */}
        <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🔥</span>
            <h2 className="text-xl font-bold text-foreground">Top Pendle Opportunities</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6">Highest yielding PT & YT tokens across all chains</p>
          <TokenTable />
        </div>
      </main>
    </div>
  )
}
