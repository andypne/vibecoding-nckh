'use client';

import { useState } from 'react';

interface ScoreSliderProps {
  defaultValue?: string;
}

export default function ScoreSlider({ defaultValue = '0' }: ScoreSliderProps) {
  const [value, setValue] = useState(defaultValue);

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-slate-700 dark:text-slate-300">
        Điểm AI ≥
      </label>
      <input
        type="range"
        name="score"
        min="0"
        max="10"
        step="0.5"
        defaultValue={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-24 h-2 bg-slate-300 rounded-lg appearance-none cursor-pointer dark:bg-slate-600 accent-blue-500"
      />
      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 w-8">
        {parseFloat(value as string).toFixed(1)}
      </span>
    </div>
  );
}
