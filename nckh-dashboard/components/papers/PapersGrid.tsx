'use client';

import { useState } from 'react';
import PaperCard from "./PaperCard";
import PaperDetail from "./PaperDetail";
import { Paper } from "@/lib/utils/paper-helpers";

interface PapersGridProps {
  papers: Paper[];
  isLoading: boolean;
}

export default function PapersGrid({ papers, isLoading }: PapersGridProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Đang tải bài báo...</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (papers.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-gray-600 dark:text-gray-300">Chưa có bài báo nào</p>
        </div>
      </div>
    );
  }

  // Normal state - grid of papers
  return (
    <div className="grid grid-cols-1 gap-4">
      {papers.map((paper) => (
        <div key={paper.id}>
          <PaperCard
            {...paper}
            isExpanded={expandedId === paper.id}
            onExpand={() => setExpandedId(paper.id)}
            onCollapse={() => setExpandedId(null)}
          />
          {expandedId === paper.id && (
            <PaperDetail
              paper={paper}
              showFullLayout={false}
              onClose={() => setExpandedId(null)}
            />
          )}
        </div>
      ))}
    </div>
  );
}
