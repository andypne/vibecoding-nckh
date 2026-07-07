import { supabase } from "@/lib/supabase";
import PapersGrid from "@/components/papers/PapersGrid";
import { buildFilterQuery, type SearchParams } from "@/lib/filters";
import FiltersBar from "@/components/papers/FiltersBar";

async function getResearchData(searchParams: Record<string, string | string[]>) {
  const params: SearchParams = {
    q: Array.isArray(searchParams.q) ? searchParams.q[0] : searchParams.q,
    topics: Array.isArray(searchParams.topics) ? searchParams.topics[0] : searchParams.topics,
    sources: Array.isArray(searchParams.sources) ? searchParams.sources[0] : searchParams.sources,
    year: Array.isArray(searchParams.year) ? searchParams.year[0] : searchParams.year,
    score: Array.isArray(searchParams.score) ? searchParams.score[0] : searchParams.score,
  };

  const query = buildFilterQuery(supabase, params);
  const { data: papers } = await query;

  const { data: topics } = await supabase.from("topics").select("*").limit(10);

  return {
    papers: papers || [],
    topics: topics || [],
    currentFilters: params,
  };
}

export default async function Home({ searchParams }: { searchParams: Record<string, string | string[]> }) {
  const { papers, topics, currentFilters } = await getResearchData(searchParams);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          🔍 Radar nghiên cứu
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          {papers.length} bài báo • {topics.length} chủ đề
        </p>

        <FiltersBar
          topics={topics.map((t) => t.name || String(t.id))}
          searchQuery={currentFilters.q}
          selectedTopics={currentFilters.topics ? [currentFilters.topics] : []}
          selectedSources={currentFilters.sources ? currentFilters.sources.split(",") : []}
          selectedYears={currentFilters.year ? currentFilters.year.split(",") : []}
          selectedScore={currentFilters.score}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Topics */}
          <div className="lg:col-span-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Chủ đề
            </h2>
            <div className="space-y-3">
              {topics.map((topic) => (
                <div
                  key={topic.id}
                  className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow hover:shadow-lg transition"
                >
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {topic.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {topic.keywords?.split(",").slice(0, 2).join(", ")}...
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Papers */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Bài báo gần đây
            </h2>
            <PapersGrid papers={papers} isLoading={false} />
          </div>
        </div>
      </div>
    </div>
  );
}
