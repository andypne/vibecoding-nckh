'use client';

import Link from "next/link";
import { Paper, truncateText, getScoreBadgeColor, scoreBadgeClasses } from "@/lib/utils/paper-helpers";

interface PaperCardProps extends Paper {
  isExpanded?: boolean;
  onExpand?: () => void;
  onCollapse?: () => void;
}

export default function PaperCard({
  id,
  title,
  authors,
  url,
  source,
  ai_score,
  ai_summary_vi,
  published_at,
  isExpanded,
  onExpand,
  onCollapse,
}: PaperCardProps) {
  return (
    <div className="p-5 bg-white dark:bg-slate-800 rounded-lg shadow hover:shadow-lg transition">
      {/* Title */}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-lg font-bold text-blue-600 dark:text-blue-400 hover:underline block"
      >
        {title}
      </a>

      {/* Authors */}
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        {authors}
      </p>

      {/* Summary - only render if it exists */}
      {ai_summary_vi && (
        <p className="mt-3 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
          {truncateText(ai_summary_vi, 200)}
        </p>
      )}

      {/* Footer */}
      <div className="mt-4 flex row items-center justify-between flex-wrap gap-2">
        {/* Left side - badges */}
        <div className="flex row gap-2">
          {/* Source badge - only show if source exists */}
          {source && (
            <span className="inline-block px-3 py-1 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
              {source}
            </span>
          )}

          {/* AI Score badge - always show */}
          <span
            className={`inline-block px-3 py-1 rounded text-xs font-medium ${
              scoreBadgeClasses[getScoreBadgeColor(ai_score)]
            }`}
          >
            ⭐ {ai_score !== undefined ? ai_score.toFixed(1) : "N/A"}
          </span>
        </div>

        {/* Right side - published date */}
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {new Date(published_at).toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}
        </span>
      </div>

      {/* Action buttons */}
      <div className="mt-4 flex flex-wrap gap-3">
        {/* Expand/Collapse button - only render if onExpand/onCollapse provided */}
        {onExpand || onCollapse ? (
          <button
            onClick={isExpanded ? onCollapse : onExpand}
            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition"
          >
            {isExpanded ? "↑ Ẩn" : "Chi tiết"}
          </button>
        ) : null}

        {/* Navigation link - always render */}
        <Link
          href={`/paper/${id}`}
          className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition"
        >
          → Xem trang
        </Link>
      </div>
    </div>
  );
}
