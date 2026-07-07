'use client';

interface TopicFilterProps {
  topics: string[];
  defaultValue?: string[];
}

export default function TopicFilter({ topics, defaultValue = [] }: TopicFilterProps) {
  return (
    <select
      name="topics"
      multiple
      defaultValue={defaultValue}
      className="w-full md:w-40 px-3 py-2 border border-slate-300 rounded bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <option value="">-- Chủ đề --</option>
      {topics.map((topic) => (
        <option key={topic} value={topic}>
          {topic}
        </option>
      ))}
    </select>
  );
}
