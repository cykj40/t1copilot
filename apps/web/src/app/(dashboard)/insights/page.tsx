import { InsightFeed } from '@/components/insights/InsightFeed'
import { Card, CardContent } from '@/components/ui/card'

export default function InsightsPage() {
  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto">
      <div>
        <h1 className="text-sm font-semibold text-foreground">Insights</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Agent-synthesized patterns and observations.
        </p>
      </div>

      {/* Summary callout */}
      <Card className="border-primary/25 bg-primary/5">
        <CardContent className="pt-3 pb-3 px-4">
          <p className="text-xs font-medium text-primary mb-0.5">This week</p>
          <p className="text-xs text-muted-foreground">
            Time in range improved <span className="font-medium text-[#22c55e]">+8%</span> vs last
            week. Two patterns detected — ask the agent for details.
          </p>
        </CardContent>
      </Card>

      <InsightFeed />

      {/* Placeholder for agent synthesis cards */}
      <p className="text-[10px] text-muted-foreground/50 text-center py-2">
        Ask the agent for a detailed analysis or weekly summary.
      </p>
    </div>
  )
}
