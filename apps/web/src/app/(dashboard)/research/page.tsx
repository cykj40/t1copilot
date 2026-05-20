import { Card, CardContent } from '@/components/ui/card'

const MOCK_RESULTS = [
  {
    id: 'r1',
    title: 'Exercise-induced hypoglycemia in T1D athletes',
    source: 'Diabetes Care 2023',
    snippet:
      'High-intensity aerobic exercise causes significant glucose decline in T1D patients; pre-exercise carbohydrate strategies are recommended.',
  },
  {
    id: 'r2',
    title: 'CGM accuracy during physical activity',
    source: 'Journal of Diabetes Science 2024',
    snippet:
      'Interstitial glucose lag during exercise may cause CGM readings to underestimate actual blood glucose by 10–20 mg/dL.',
  },
]

export default function ResearchPage() {
  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto">
      <div>
        <h1 className="text-sm font-semibold text-foreground">Research</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Query the agent to search and summarize diabetes research.
        </p>
      </div>

      {/* Query hint */}
      <Card className="border-border bg-card">
        <CardContent className="pt-3 pb-3 px-4">
          <p className="text-xs text-muted-foreground">
            Try asking:{' '}
            <span className="italic text-foreground">
              "What does research say about Peloton rides and insulin sensitivity?"
            </span>
          </p>
        </CardContent>
      </Card>

      {/* Placeholder results */}
      <div className="flex flex-col gap-2">
        {MOCK_RESULTS.map((result) => (
          <Card key={result.id} className="bg-card border-border">
            <CardContent className="pt-4 pb-3 px-4">
              <p className="text-xs font-medium text-foreground leading-snug">{result.title}</p>
              <p className="mt-0.5 text-[10px] font-medium text-primary">{result.source}</p>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                {result.snippet}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-[10px] text-muted-foreground/50 text-center py-2">
        Research results are for informational purposes only. Discuss findings with your care team.
      </p>
    </div>
  )
}
