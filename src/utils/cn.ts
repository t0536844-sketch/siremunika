import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Shared dark-aware class strings ──────────────────────────
export const PAGE_BG    = 'p-6 space-y-5 bg-slate-50 dark:bg-slate-950';
export const CARD       = 'bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700';
export const CARD_HOVER = 'bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:border-teal-200 dark:hover:border-teal-700 transition-shadow';
export const TABLE_HEAD = 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 text-xs uppercase border-b border-slate-200 dark:border-slate-700';
export const TABLE_ROW  = 'border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors';
export const TABLE_CELL = 'text-slate-700 dark:text-slate-300';
export const TABLE_FOOT = 'px-5 py-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400';
export const INPUT      = 'border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder:text-slate-400 dark:placeholder:text-slate-500';
export const FILTER_BAR = 'bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-3';
export const TOOLBAR_ITEM = 'flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600';
export const MODAL_BG   = 'bg-white dark:bg-slate-800 rounded-2xl shadow-2xl dark:shadow-black/50';
export const MODAL_BODY = 'bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700';
export const TEXT_PRIMARY   = 'text-slate-800 dark:text-slate-100';
export const TEXT_SECONDARY = 'text-slate-600 dark:text-slate-300';
export const TEXT_MUTED     = 'text-slate-500 dark:text-slate-400';
export const DIVIDER        = 'border-slate-200 dark:border-slate-700';
