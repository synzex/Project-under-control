import type { EffectiveStatus } from '../types';

export type FilterValue = EffectiveStatus | 'all';

interface StatusFiltersProps {
  value: FilterValue;
  onChange: (value: FilterValue) => void;
}

const OPTIONS: { value: FilterValue; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'planned', label: 'Запланировано' },
  { value: 'in_progress', label: 'В работе' },
  { value: 'done', label: 'Готово' },
  { value: 'overdue', label: 'Просрочено' },
];

export function StatusFilters({ value, onChange }: StatusFiltersProps) {
  return (
    <div className="flex items-center gap-1">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
            value === o.value ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant hover:bg-white/60'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
