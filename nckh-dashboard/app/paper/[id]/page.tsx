import { supabase } from "@/lib/supabase";
import PaperDetail from "@/components/papers/PaperDetail";
import PapersGrid from "@/components/papers/PapersGrid";
import { Paper } from "@/lib/utils/paper-helpers";

/**
 * Fetch a single paper by ID from Supabase
 */
async function getPaperData(id: string): Promise<Paper | null> {
  try {
    const { data, error } = await supabase
      .from("papers")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching paper:", error);
      return null;
    }

    return data as Paper;
  } catch (err) {
    console.error("Unexpected error fetching paper:", err);
    return null;
  }
}

/**
 * Fetch page data: recent papers and topics
 */
async function getPageData() {
  try {
    const { data: papers, error: papersError } = await supabase
      .from("papers")
      .select("*")
      .order("published_at", { ascending: false })
      .limit(50);

    const { data: topics, error: topicsError } = await supabase
      .from("topics")
      .select("*")
      .limit(10);

    if (papersError) {
      console.error("Error fetching papers:", papersError);
    }
    if (topicsError) {
      console.error("Error fetching topics:", topicsError);
    }

    return {
      papers: (papers as Paper[]) || [],
      topics: topics || [],
    };
  } catch (err) {
    console.error("Unexpected error fetching page data:", err);
    return {
      papers: [],
      topics: [],
    };
  }
}

export default async function PaperDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const paper = await getPaperData(id);
  const { papers, topics } = await getPageData();

  // Error state: paper not found
  if (!paper) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 p-8 flex items-center justify-center">
        <div className="text-center">
          <p className="text-6xl mb-4">❌</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">
            Không tìm thấy bài báo
          </p>
        </div>
      </div>
    );
  }

  // Success state: render full layout
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Paper detail at top - full-width */}
        <PaperDetail paper={paper} showFullLayout={true} />

        {/* Grid below: topics (left) + papers (right) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Topics sidebar */}
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

          {/* Papers list */}
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
