// Paper type interface and helper utilities

export interface Paper {
  id: string;
  title: string;
  authors: string;
  url: string;
  source?: string;           // website/journal name (optional)
  ai_score?: number;         // 0-10 scale (optional)
  ai_summary_vi?: string;    // Vietnamese summary (optional)
  abstract?: string;         // Original paper abstract (optional)
  published_at: string;      // ISO 8601 date string
}

/**
 * Truncates text to a specified maximum length and appends "..." if truncated.
 * @param text - The text to truncate
 * @param maxLength - Maximum length (default: 200 characters)
 * @returns Truncated text with "..." appended if necessary
 */
export function truncateText(text: string, maxLength: number = 200): string {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + "...";
}

/**
 * Determines the badge color based on an AI score.
 * @param score - The score (0-10 scale)
 * @returns Badge color: 'green' (≥8), 'yellow' (6-8), or 'gray' (<6 or undefined)
 */
export function getScoreBadgeColor(score?: number): 'green' | 'yellow' | 'gray' {
  if (typeof score !== 'number') return 'gray';
  if (score >= 8) return 'green';
  if (score >= 6) return 'yellow';
  return 'gray';
}

/**
 * Tailwind CSS class names for score badge colors.
 * Includes dark mode variants.
 */
export const scoreBadgeClasses = {
  green: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
  yellow: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
  gray: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
};
