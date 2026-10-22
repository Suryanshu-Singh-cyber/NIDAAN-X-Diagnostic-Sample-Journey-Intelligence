import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const STAGE_LABELS: Record<string, string> = {
  collection: 'Collection',
  labeling: 'Labeling',
  dispatch: 'Dispatch',
  lab_reception: 'Lab Reception',
  processing: 'Processing',
  testing: 'Testing',
  report_generated: 'Report Generated',
};

export const STAGE_ICONS: Record<string, string> = {
  collection: '🩸',
  labeling: '🏷️',
  dispatch: '🚚',
  lab_reception: '📥',
  processing: '⚙️',
  testing: '🔬',
  report_generated: '📄',
};

export function formatTimestamp(ts: string): string {
  return new Date(ts).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

export function minutesBetween(a: string, b: string): number {
  return (new Date(b).getTime() - new Date(a).getTime()) / 60000;
}