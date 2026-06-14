import { getRecentResearch } from '@/actions/research'
import { ResearchPageClient } from './ResearchPageClient'

export default async function ResearchPage() {
  const recentResearch = await getRecentResearch()
  return <ResearchPageClient recentResearch={recentResearch} />
}
