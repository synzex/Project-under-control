import type { EffectiveStatus, Task, TaskStatus, TaskView } from '../types';
import { parseISO, todayAtMidnight } from './date';

const AVATAR_COLORS = ['#4f46e5', '#0ea5e9', '#059669', '#d97706', '#db2777', '#7c3aed'];

export function initials(name?: string): string {
  if (!name) return '?';
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function colorForName(name?: string): string {
  if (!name) return '#94a3b8';
  let hash = 0;
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[hash];
}

export function effectiveStatus(task: Task): EffectiveStatus {
  if (task.status !== 'done' && parseISO(task.end_date) < todayAtMidnight()) return 'overdue';
  return task.status as TaskStatus;
}

export const STATUS_LABELS: Record<EffectiveStatus, string> = {
  planned: 'Запланировано',
  in_progress: 'В работе',
  done: 'Готово',
  overdue: 'Просрочено',
};

export const STATUS_BADGE_CLASSES: Record<EffectiveStatus, string> = {
  planned: 'bg-surface-container text-on-surface-variant',
  in_progress: 'bg-blue-50 text-blue-700',
  done: 'bg-emerald-50 text-emerald-700',
  overdue: 'bg-red-50 text-red-700',
};

export const STATUS_BAR_CLASSES: Record<EffectiveStatus, string> = {
  planned: 'bg-surface-container-high border border-outline-variant/50 text-on-surface-variant',
  in_progress: 'bg-blue-600 text-white',
  done: 'bg-emerald-500 text-white',
  overdue: 'bg-error text-white',
};

export const ALL_STATUSES: TaskStatus[] = ['planned', 'in_progress', 'done'];

// ============================================================
// Проверка циклов
// ============================================================

export function downstreamOf(taskId: number, tasksInProject: TaskView[]): number[] {
  const result = new Set<number>();
  let frontier = [taskId];
  while (frontier.length) {
    const next: number[] = [];
    for (const id of frontier) {
      for (const t of tasksInProject) {
        if (t.deps.includes(id) && !result.has(t.id)) {
          result.add(t.id);
          next.push(t.id);
        }
      }
    }
    frontier = next;
  }
  return [...result];
}

export function wouldCreateCycle(
  taskId: number,
  candidateDepId: number,
  tasksInProject: TaskView[]
): boolean {
  if (taskId === candidateDepId) return true;
  return downstreamOf(taskId, tasksInProject).includes(candidateDepId);
}