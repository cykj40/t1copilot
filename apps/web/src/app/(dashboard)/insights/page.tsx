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

      <Card className="border-border bg-card">
        <CardContent className="pt-3 pb-3 px-4">
          <p className="text-xs text-muted-foreground">
            Ask the agent:{' '}
            <span className="italic text-foreground">"Give me a weekly insight summary"</span> or{' '}
            <span className="italic text-foreground">"How is my parameter drift looking?"</span>
          </p>
        </CardContent>
      </Card>

      <InsightFeed />
    </div>
  )
}
