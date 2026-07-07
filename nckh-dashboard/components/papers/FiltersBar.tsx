'use client';

import { useRef } from 'react';
import SearchInput from '../filters/SearchInput';
import TopicFilter from '../filters/TopicFilter';
import SourceFilter from '../filters/SourceFilter';
import YearFilter from '../filters/YearFilter';
import ScoreSlider from '../filters/ScoreSlider';

interface FiltersBarProps {
  topics: string[];
  searchQuery?: string;
  selectedTopics?: string[];
  selectedSources?: string[];
  selectedYears?: string[];
  selectedScore?: string;
}

export default function FiltersBar({
  topics,
  searchQuery = '',
  selectedTopics = [],
  selectedSources = [],
  selectedYears = [],
  selectedScore = '0',
}: FiltersBarProps) {
  const formRef = useRef<HTMLFormElement>(null);

  const handleClear = () => {
    if (formRef.current) {
      formRef.current.reset();
      formRef.current.submit();
    }
  };

  return (
    <form
      ref={formRef}
      method="GET"
      className="mb-6 p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700"
    >
      <div className="flex flex-wrap gap-4 items-end">
        <SearchInput defaultValue={searchQuery} />
        <TopicFilter topics={topics} defaultValue={selectedTopics} />
        <SourceFilter defaultValue={selectedSources} />
        <YearFilter defaultValue={selectedYears} />
        <ScoreSlider defaultValue={selectedScore} />

        <div className="flex gap-2 ml-auto">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors dark:bg-blue-700 dark:hover:bg-blue-800 font-medium"
          >
            Lọc
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="px-4 py-2 bg-slate-400 text-white rounded hover:bg-slate-500 transition-colors dark:bg-slate-600 dark:hover:bg-slate-700 font-medium"
          >
            Xóa
          </button>
        </div>
      </div>
    </form>
  );
}
