import { useState } from 'react';
import type { ProjectFormValues } from '../types';
import { addDays, todayISO, toISO } from '../utils/date';

interface ProjectModalProps {
  onClose: () => void;
  onSave: (values: ProjectFormValues) => void;
}

export function ProjectModal({ onClose, onSave }: ProjectModalProps) {
  const [name, setName] = useState('');
  const [start, setStart] = useState(todayISO());
  const [end, setEnd] = useState(toISO(addDays(new Date(), 30)));
  const [error, setError] = useState<string | null>(null);

  function handleSave() {
    if (!name.trim() || !start || !end) {
      setError('Заполните название и сроки проекта');
      return;
    }
    if (end < start) {
      setError('Дата окончания раньше даты начала');
      return;
    }
    onSave({ name: name.trim(), start, end });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 flex flex-col gap-5 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary-container to-secondary-container" />
        <div className="flex items-start justify-between gap-3 pt-1">
          <div>
            <h2 className="font-display text-lg font-semibold">Новый проект</h2>
            <p className="text-xs text-on-surface-variant mt-0.5">Название и сроки для диаграммы Ганта</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-on-surface-variant">Название проекта *</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              type="text"
              placeholder="Например, Редизайн сайта"
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
          {error && <p className="text-xs text-error">{error}</p>}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button onClick={onClose} className="px-4 h-10 rounded-xl text-sm text-on-surface-variant hover:bg-surface-container-low">
              Отмена
            </button>
            <button
              onClick={handleSave}
              className="px-5 h-10 rounded-xl bg-primary-container text-white text-sm font-medium shadow-sm hover:bg-primary"
            >
              Создать
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
