'use client';

interface YearFilterProps {
  defaultValue?: string[];
}

export default function YearFilter({ defaultValue = [] }: YearFilterProps) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2015 + 1 }, (_, i) => currentYear - i);

  return (
    <select
      name="year"
      multiple
      defaultValue={defaultValue}
      className="w-full md:w-40 px-3 py-2 border border-slate-300 rounded bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <option value="">-- Năm --</option>
      {years.map((year) => (
        <option key={year} value={year.toString()}>
          {year}
        </option>
      ))}
    </select>
  );
}
