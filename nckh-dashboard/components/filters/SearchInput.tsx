'use client';

interface SearchInputProps {
  defaultValue?: string;
}

export default function SearchInput({ defaultValue = '' }: SearchInputProps) {
  return (
    <input
      type="text"
      name="q"
      defaultValue={defaultValue}
      placeholder="Tìm kiếm..."
      className="w-full md:w-64 px-3 py-2 border border-slate-300 rounded bg-white text-slate-900 placeholder-slate-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  );
}
