import { Paper, truncateText, getScoreBadgeColor, scoreBadgeClasses } from "@/lib/utils/paper-helpers";

export default function PaperCard(paper: Paper) {
  return (
    <div className="p-5 bg-white dark:bg-slate-800 rounded-lg shadow hover:shadow-lg transition">
      {/* Title */}
      <a
        href={paper.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-lg font-bold text-blue-600 dark:text-blue-400 hover:underline block"
      >
        {paper.title}
      </a>

      {/* Authors */}
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        {paper.authors}
      </p>

      {/* Summary - only render if it exists */}
      {paper.ai_summary_vi && (
        <p className="mt-3 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
          {truncateText(paper.ai_summary_vi, 200)}
        </p>
      )}

      {/* Footer */}
      <div className="mt-4 flex row items-center justify-between flex-wrap gap-2">
        {/* Left side - badges */}
        <div className="flex row gap-2">
          {/* Source badge - only show if source exists */}
          {paper.source && (
            <span className="inline-block px-3 py-1 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
              {paper.source}
            </span>
          )}

          {/* AI Score badge - always show */}
          <span
            className={`inline-block px-3 py-1 rounded text-xs font-medium ${
              scoreBadgeClasses[getScoreBadgeColor(paper.ai_score)]
            }`}
          >
            ⭐ {paper.ai_score !== undefined ? paper.ai_score.toFixed(1) : "N/A"}
          </span>
        </div>

        {/* Right side - published date */}
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {new Date(paper.published_at).toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}
        </span>
      </div>
    </div>
  );
}
