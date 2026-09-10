import { useMemo, useState } from 'react';
import type { ProjectView, TaskView } from '../types';
import { formatShort } from '../utils/date';
import { effectiveStatus } from '../utils/domain';
import { GanttChart } from './GanttChart';
import { StatusFilters, type FilterValue } from './StatusFilters';
import { TaskSideList } from './TaskSideList';

interface ProjectDetailProps {
  project: ProjectView;
  tasks: TaskView[];
  highlightedIds: Set<number>;
  affectedNames: string[];
  onBack: () => void;
  onCreateTask: () => void;
  onOpenTask: (id: number) => void;
}

export function ProjectDetail({
  project,
  tasks,
  highlightedIds,
  affectedNames,
  onBack,
  onCreateTask,
  onOpenTask,
}: ProjectDetailProps) {
  const [filter, setFilter] = useState<FilterValue>('all');
  const [search, setSearch] = useState('');

  const visible = useMemo(() => {
    return tasks.filter((t) => {
      const es = effectiveStatus(t);
      if (filter !== 'all' && es !== filter) return false;
      if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [tasks, filter, search]);

  function handleExport() {
    const exportData = {
      project,
      tasks,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.title}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="w-full flex flex-col">
      <section className="w-full px-4 sm:px-8 py-4 bg-white border-b border-outline-variant/30">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-surface-container-low text-on-surface-variant">
              <span className="material-symbols-outlined text-lg">arrow_back</span>
            </button>
            <div className="min-w-0">
              <h1 className="font-display text-lg font-semibold truncate">{project.title}</h1>
              <p className="text-xs text-on-surface-variant">
                {formatShort(project.start)} — {formatShort(project.end)} · {tasks.length} задач
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-1.5 px-4 h-9 rounded-xl border border-outline-variant/40 text-on-surface hover:bg-surface-container-low transition-colors text-sm font-medium"
            >
              <span className="material-symbols-outlined text-base">download</span>
              Экспорт
            </button>
            <button
              onClick={onCreateTask}
              className="inline-flex items-center gap-1.5 px-4 h-9 rounded-xl bg-primary text-white hover:bg-primary-container transition-colors text-sm font-medium shadow-sm"
            >
              <span className="material-symbols-outlined text-base">add</span>
              Задача
            </button>
          </div>
        </div>
      </section>

      <section className="w-full px-4 sm:px-8 py-2.5 bg-surface-container-low/60 border-b border-outline-variant/20 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative w-56 h-9 flex items-center bg-white rounded-lg border border-outline-variant/30 px-2.5">
            <span className="material-symbols-outlined text-outline text-base mr-1.5">search</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              type="text"
              placeholder="Поиск задач..."
              className="w-full bg-transparent text-sm focus:outline-none"
            />
          </div>
          <StatusFilters value={filter} onChange={setFilter} />
        </div>
        {affectedNames.length > 0 && (
          <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg max-w-md truncate">
            Сроки сдвинуты — эти задачи могут быть затронуты: {affectedNames.join(', ')}
          </div>
        )}
      </section>

      <section className="w-full flex overflow-hidden bg-white" style={{ minHeight: '60vh' }}>
        <TaskSideList tasks={visible} highlightedIds={highlightedIds} onOpenTask={onOpenTask} />
        <div className="flex-1 overflow-x-auto overflow-y-auto" style={{ maxHeight: '75vh' }}>
          <GanttChart allProjectTasks={tasks} visibleTasks={visible} highlightedIds={highlightedIds} onOpenTask={onOpenTask} />
        </div>
      </section>
    </div>
  );
}