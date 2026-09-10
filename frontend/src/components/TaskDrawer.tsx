import { useEffect, useState } from 'react';
import type { TaskView, TaskFormValues, TaskStatus } from '../types';
import { addDays, todayISO, toISO } from '../utils/date';
import { wouldCreateCycle } from '../utils/domain';

interface TaskDrawerProps {
  task: TaskView | null;             // ← Task → TaskView
  otherTasksInProject: TaskView[];   // ← Task[] → TaskView[]
  onClose: () => void;
  onSave: (values: TaskFormValues) => void;
  onDelete: () => void;
}

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'planned', label: 'Запланировано' },
  { value: 'in_progress', label: 'В работе' },
  { value: 'done', label: 'Готово' },
];

export function TaskDrawer({ task, otherTasksInProject, onClose, onSave, onDelete }: TaskDrawerProps) {
  const isEdit = !!task;

  const [name, setName] = useState(task?.title ?? '');            // ← name → title
  const [start, setStart] = useState(task?.start ?? todayISO());  // ✅ start есть
  const [end, setEnd] = useState(task?.end ?? toISO(addDays(new Date(), 5)));  // ✅ end есть
  const [assignee, setAssignee] = useState(task?.assigneeId?.toString() ?? ''); // ← assigneeId → string
  const [status, setStatus] = useState<TaskStatus>(task?.status as TaskStatus ?? 'planned');
  const [description, setDescription] = useState(task?.description ?? '');
  const [deps, setDeps] = useState<number[]>(task?.deps ?? []);   // ← string[] → number[]
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  function toggleDep(id: number) {                                // ← string → number
    setDeps((prev) => (prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]));
  }

  function handleSave() {
    if (!name.trim() || !start || !end) {
      setError('Заполните название и сроки задачи');
      return;
    }
    if (end < start) {
      setError('Дата окончания раньше даты начала');
      return;
    }
    onSave({
      name: name.trim(),
      start,
      end,
      assignee: assignee.trim(),
      status,
      description: description.trim(),
      deps,
    });
  }

  return (
    <>
      <div className="fixed inset-0 top-16 z-40 bg-slate-900/20 backdrop-blur-[2px]" onClick={onClose} />
      <aside
        className={`fixed top-16 right-0 bottom-0 w-full max-w-[440px] z-50 bg-white shadow-2xl flex flex-col overflow-hidden transition-transform duration-200 ${
          mounted ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="px-5 py-4 border-b border-outline-variant/20 flex items-center justify-between shrink-0">
          <h2 className="font-display text-base font-semibold">{isEdit ? 'Редактировать задачу' : 'Новая задача'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-on-surface-variant">Название задачи *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              type="text"
              placeholder="Например, Дизайн интерфейса"
              className="h-10 px-3 rounded-xl bg-surface-container-low text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-on-surface-variant">Начало</label>
              <input
                value={start}
                onChange={(e) => setStart(e.target.value)}
                type="date"
                className="h-10 px-3 rounded-xl bg-surface-container-low text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-on-surface-variant">Окончание</label>
              <input
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                type="date"
                className="h-10 px-3 rounded-xl bg-surface-container-low text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-on-surface-variant">Ответственный (ID пользователя)</label>
            <input
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              type="text"
              placeholder="Например, 1"
              className="h-10 px-3 rounded-xl bg-surface-container-low text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-on-surface-variant">Статус</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="h-10 px-3 rounded-xl bg-surface-container-low text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-on-surface-variant">Зависит от (предшественники)</label>
            <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto border border-outline-variant/30 rounded-xl p-2.5">
              {otherTasksInProject.length === 0 ? (
                <span className="text-xs text-on-surface-variant">В проекте пока нет других задач</span>
              ) : (
                otherTasksInProject.map((o) => {
                  const disabled = !!task && wouldCreateCycle(task.id, o.id, task ? [...otherTasksInProject, task] : otherTasksInProject);
                  return (
                    <label key={o.id} className={`flex items-center gap-2 text-sm ${disabled ? 'opacity-40' : 'cursor-pointer'}`}>
                      <input
                        type="checkbox"
                        disabled={disabled}
                        checked={deps.includes(o.id)}
                        onChange={() => toggleDep(o.id)}
                        className="rounded text-primary"
                      />
                      <span className="truncate">{o.title}</span>
                    </label>
                  );
                })
              )}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-on-surface-variant">Комментарий / описание</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Необязательно"
              className="p-3 rounded-xl bg-surface-container-low text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>
          {error && <p className="text-xs text-error">{error}</p>}
        </div>

        <div className="p-4 border-t border-outline-variant/20 flex items-center justify-between shrink-0">
          {isEdit ? (
            <button
              onClick={onDelete}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-error hover:bg-error-container/40 text-sm font-medium"
            >
              <span className="material-symbols-outlined text-lg">delete</span>
              Удалить
            </button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-4 h-9 rounded-xl bg-surface-container-low text-sm hover:bg-surface-container">
              Отмена
            </button>
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-4 h-9 rounded-xl bg-primary text-white text-sm font-medium shadow-sm hover:bg-primary-container"
            >
              <span className="material-symbols-outlined text-base">save</span>
              Сохранить
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}