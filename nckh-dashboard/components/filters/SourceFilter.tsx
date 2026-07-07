'use client';

const SOURCE_OPTIONS = ['arXiv', 'Nature', 'IEEE', 'ACM', 'Science', 'JMLR', 'Other'];

interface SourceFilterProps {
  defaultValue?: string[];
}

export default function SourceFilter({ defaultValue = [] }: SourceFilterProps) {
  return (
    <select
      name="sources"
      multiple
      defaultValue={defaultValue}
      className="w-full md:w-40 px-3 py-2 border border-slate-300 rounded bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <option value="">-- Nguồn --</option>
      {SOURCE_OPTIONS.map((source) => (
        <option key={source} value={source}>
          {source}
        </option>
      ))}
    </select>
  );
}
