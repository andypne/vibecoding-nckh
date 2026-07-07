import { SupabaseClient } from "@supabase/supabase-js";

export interface SearchParams {
  q?: string;           // Search term (phrase search on title + summary)
  topics?: string;      // Comma-separated topic IDs: "1,2,3"
  sources?: string;     // Comma-separated sources: "arxiv,nature"
  year?: string;        // Comma-separated years: "2024,2023"
  score?: string;       // Minimum AI score: "6" or "7.5"
}

export function buildFilterQuery(
  supabase: SupabaseClient,
  searchParams: SearchParams
) {
  let query = supabase
    .from("papers")
    .select("*")
    .order("published_at", { ascending: false })
    .limit(50);

  // 1. Full-text search (q)
  if (searchParams.q) {
    const searchTerm = `%${searchParams.q}%`;
    query = query.or(`title.ilike.${searchTerm},ai_summary_vi.ilike.${searchTerm}`);
  }

  // 2. Topics (topics)
  if (searchParams.topics) {
    const topicIds = searchParams.topics
      .split(",")
      .map((id) => {
        const parsed = parseInt(id.trim(), 10);
        return isNaN(parsed) ? null : parsed;
      })
      .filter((id): id is number => id !== null);

    if (topicIds.length > 0) {
      query = query.in("topic_id", topicIds);
    }
  }

  // 3. Sources (sources)
  if (searchParams.sources) {
    const sourceList = searchParams.sources
      .split(",")
      .map((source) => source.trim())
      .filter((source) => source.length > 0);

    if (sourceList.length > 0) {
      query = query.in("source", sourceList);
    }
  }

  // 4. Years (year)
  if (searchParams.year) {
    const years = searchParams.year
      .split(",")
      .map((year) => {
        const parsed = parseInt(year.trim(), 10);
        return isNaN(parsed) ? null : parsed;
      })
      .filter((year): year is number => year !== null);

    if (years.length > 0) {
      const minYear = Math.min(...years);
      const maxYear = Math.max(...years);

      const startDate = `${minYear}-01-01`;
      const endDate = `${maxYear + 1}-01-01`;

      query = query
        .gte("published_at", startDate)
        .lt("published_at", endDate);
    }
  }

  // 5. AI Score (score)
  if (searchParams.score) {
    const scoreNum = parseFloat(searchParams.score.trim());
    if (!isNaN(scoreNum)) {
      query = query.gte("ai_score", scoreNum);
    }
  }

  return query;
}
