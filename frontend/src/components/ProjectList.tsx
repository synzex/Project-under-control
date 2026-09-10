import type { ProjectView } from '../types';
import { colorForName, initials } from '../utils/domain';
import { formatShort } from '../utils/date';

interface ProjectListProps {
  projects: ProjectView[];
  taskCount: (projectId: number) => number;
  progress: (projectId: number) => number;
  overdueCount: (projectId: number) => number;
  onOpenProject: (id: number) => void;
  onCreateProject: () => void;
}

export function ProjectList({
  projects,
  taskCount,
  progress,
  overdueCount,
  onOpenProject,
  onCreateProject,
}: ProjectListProps) {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-8 py-8 flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Проекты</h1>
          <p className="text-sm text-on-surface-variant mt-1">Все ваши планы и графики выполнения задач.</p>
        </div>
        <button
          onClick={onCreateProject}
          className="inline-flex items-center gap-1.5 px-4 h-10 rounded-xl bg-primary-container text-white hover:bg-primary transition-colors text-sm font-medium shadow-sm"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Новый проект
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
        {projects.length === 0 ? (
          <div className="p-10 text-center text-on-surface-variant text-sm">
            Пока нет проектов. Создайте первый, чтобы начать планирование.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-12 gap-3 px-5 py-2.5 text-[11px] font-semibold text-outline uppercase tracking-wide bg-surface-container-low/50 border-b border-outline-variant/20">
              <div className="col-span-5">Проект</div>
              <div className="col-span-2">Сроки</div>
              <div className="col-span-3">Прогресс</div>
              <div className="col-span-2 text-right">Статус</div>
            </div>
            <div className="divide-y divide-outline-variant/15">
              {projects.map((p) => {
                const pct = progress(p.id);
                const overdue = overdueCount(p.id);
                return (
                  <div
                    key={p.id}
                    onClick={() => onOpenProject(p.id)}
                    className="grid grid-cols-12 gap-3 px-5 py-4 items-center hover:bg-surface-container-low/40 transition-colors cursor-pointer"
                  >
                    <div className="col-span-5 flex items-center gap-3 min-w-0">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-semibold text-xs shrink-0"
                        style={{ background: colorForName(p.title) }}
                      >
                        {initials(p.title)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{p.title}</div>
                        <div className="text-xs text-on-surface-variant">
                          {taskCount(p.id)} задач
                          {overdue > 0 && <span className="text-error"> · {overdue} просрочено</span>}
                        </div>
                      </div>
                    </div>
                    <div className="col-span-2 text-xs text-on-surface-variant">
                      {formatShort(p.start)} — {formatShort(p.end)}
                    </div>
                    <div className="col-span-3 pr-4">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-medium">{pct}%</span>
                      </div>
                      <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                        <div className="bg-primary-container h-full rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <div className="col-span-2 flex items-center justify-end gap-2">
                      <span className="material-symbols-outlined text-outline text-lg">arrow_forward</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </section>
  );
}