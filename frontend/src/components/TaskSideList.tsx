import type { TaskView } from '../types';
import { effectiveStatus, STATUS_BADGE_CLASSES, STATUS_LABELS } from '../utils/domain';

interface TaskSideListProps {
  tasks: TaskView[];
  highlightedIds: Set<number>;
  onOpenTask: (id: number) => void;
}

export function TaskSideList({ tasks, highlightedIds, onOpenTask }: TaskSideListProps) {
  return (
    <div className="w-[300px] sm:w-[360px] flex-shrink-0 border-r border-outline-variant/30 flex flex-col overflow-y-auto" style={{ maxHeight: '75vh' }}>
      <div className="h-11 px-4 flex items-center text-[11px] font-semibold text-outline uppercase tracking-wide bg-surface-container-low/50 border-b border-outline-variant/20 sticky top-0">
        <span>Задача</span>
      </div>
      {tasks.length === 0 ? (
        <div className="p-6 text-center text-xs text-on-surface-variant">Нет задач по фильтру</div>
      ) : (
        tasks.map((t) => {
          const es = effectiveStatus(t);
          const isHighlighted = highlightedIds.has(t.id);
          return (
            <div
              key={t.id}
              onClick={() => onOpenTask(t.id)}
              className={`h-[52px] px-4 flex items-center justify-between border-b border-outline-variant/10 hover:bg-surface-container-low/30 cursor-pointer transition-colors ${
                isHighlighted ? 'ring-2 ring-amber-400 ring-inset animate-pulse' : ''
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className={`text-sm truncate ${es === 'overdue' ? 'text-error font-medium' : ''}`}>{t.title}</div>
                <div className="text-[11px] text-on-surface-variant truncate">{t.assigneeId ?? '—'}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_BADGE_CLASSES[es]}`}>
                  {STATUS_LABELS[es]}
                </span>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}