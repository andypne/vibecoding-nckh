'use client';

import { Paper, getScoreBadgeColor, scoreBadgeClasses } from "@/lib/utils/paper-helpers";

interface PaperDetailProps {
  paper: Paper;
  showFullLayout?: boolean;  // true on /paper/[id], false when inline
  onClose?: () => void;      // callback to collapse inline
}

export default function PaperDetail({
  paper,
  showFullLayout = false,
  onClose,
}: PaperDetailProps) {
  const formattedDate = new Date(paper.published_at).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const scoreColor = getScoreBadgeColor(paper.ai_score);

  return (
    <div className={`p-6 bg-white dark:bg-slate-800 rounded-lg shadow-lg ${
      !showFullLayout ? "ml-4" : ""
    }`}>
      {/* Header with title and buttons */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex-1">
          {paper.title}
        </h1>
        <div className="flex gap-2 flex-shrink-0">
          {paper.url ? (
            <a
              href={paper.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded text-sm font-medium bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white transition"
            >
              Mở paper gốc
            </a>
          ) : (
            <button
              disabled
              className="px-4 py-2 rounded text-sm font-medium bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
            >
              Mở paper gốc
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 rounded text-sm font-medium bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-700 text-gray-900 dark:text-white transition"
            >
              ↑ Ẩn
            </button>
          )}
          {!onClose && showFullLayout && (
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 rounded text-sm font-medium bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-700 text-gray-900 dark:text-white transition"
            >
              ← Quay lại
            </button>
          )}
        </div>
      </div>

      {/* Metadata row */}
      <div className="flex flex-wrap gap-3 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
        {/* Authors */}
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {paper.authors || "—"}
          </p>
        </div>

        {/* Source badge */}
        {paper.source && (
          <span className="inline-block px-3 py-1 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
            {paper.source}
          </span>
        )}

        {/* Date */}
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {formattedDate}
        </span>

        {/* AI Score badge */}
        <span
          className={`inline-block px-3 py-1 rounded text-xs font-medium ${
            scoreBadgeClasses[scoreColor]
          }`}
        >
          ⭐ {paper.ai_score !== undefined ? paper.ai_score.toFixed(1) : "N/A"}
        </span>
      </div>

      {/* Original Abstract */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Abstract gốc
        </h2>
        <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded text-gray-700 dark:text-gray-300 text-sm leading-relaxed max-h-96 overflow-y-auto">
          {paper.abstract ? (
            <p>{paper.abstract}</p>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">Chưa có abstract</p>
          )}
        </div>
      </div>

      {/* Vietnamese Summary */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Tóm tắt tiếng Việt (AI)
        </h2>
        <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded text-gray-700 dark:text-gray-300 text-sm leading-relaxed max-h-96 overflow-y-auto">
          {paper.ai_summary_vi ? (
            <p>{paper.ai_summary_vi}</p>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">Chưa có tóm tắt</p>
          )}
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400 italic mt-2">
          Do AI sinh — nên đọc bản gốc trước khi trích dẫn
        </p>
      </div>
    </div>
  );
}
