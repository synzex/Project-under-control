import { useMemo } from 'react';
import type { TaskView } from '../types';
import { addDays, daysBetween, isWeekend, MONTHS_SHORT, parseISO, todayAtMidnight, todayISO, toISO } from '../utils/date';
import { effectiveStatus, STATUS_BAR_CLASSES } from '../utils/domain';

const DAY_WIDTH = 34;
const ROW_HEIGHT = 52;

interface GanttChartProps {
  /** all tasks of the project, used to compute a stable date axis */
  allProjectTasks: TaskView[];
  /** currently visible (filtered) tasks, rendered as rows */
  visibleTasks: TaskView[];
  highlightedIds: Set<number>;
  onOpenTask: (id: number) => void;
}

interface BarPos {
  x1: number;
  x2: number;
  y: number;
}

export function GanttChart({ allProjectTasks, visibleTasks, highlightedIds, onOpenTask }: GanttChartProps) {
  const { minDate, totalDays, width } = useMemo(() => {
    if (!allProjectTasks.length) return { minDate: todayAtMidnight(), totalDays: 0, width: 0 };
    const starts = allProjectTasks.map((t) => parseISO(t.start).getTime());
    const ends = allProjectTasks.map((t) => parseISO(t.end).getTime());
    const min = addDays(new Date(Math.min(...starts)), -2);
    const max = addDays(new Date(Math.max(...ends)), 2);
    const days = daysBetween(min, max) + 1;
    return { minDate: min, totalDays: days, width: days * DAY_WIDTH };
  }, [allProjectTasks]);

  if (!visibleTasks.length) {
    return <div className="p-8 text-center text-sm text-on-surface-variant">Нет задач по выбранному фильтру</div>;
  }

  const barPos = new Map<number, BarPos>();
  visibleTasks.forEach((t, i) => {
    const s = parseISO(t.start);
    const e = parseISO(t.end);
    const left = daysBetween(minDate, s) * DAY_WIDTH;
    const dur = daysBetween(s, e) + 1;
    const w = Math.max(dur * DAY_WIDTH - 6, 20);
    barPos.set(t.id, { x1: left, x2: left + w, y: i * ROW_HEIGHT + ROW_HEIGHT / 2 });
  });

  const todayOffset = daysBetween(minDate, todayAtMidnight()) * DAY_WIDTH;
  const ganttHeight = visibleTasks.length * ROW_HEIGHT;

  const monthSegs: { month: number; span: number }[] = [];
  let curMonth = -1;
  let segStart = 0;
  for (let i = 0; i < totalDays; i++) {
    const d = addDays(minDate, i);
    if (d.getMonth() !== curMonth) {
      if (curMonth !== -1) monthSegs.push({ month: curMonth, span: i - segStart });
      curMonth = d.getMonth();
      segStart = i;
    }
  }
  if (totalDays > 0) monthSegs.push({ month: curMonth, span: totalDays - segStart });

  const todayStr = todayISO();

  return (
    <div className="relative" style={{ width }}>
      <div className="sticky top-0 z-20 bg-surface-container-low/80 backdrop-blur border-b border-outline-variant/30" style={{ width }}>
        <div className="flex" style={{ height: 26 }}>
          {monthSegs.map((seg, i) => (
            <div
              key={i}
              className="shrink-0 px-2 text-xs font-semibold text-primary border-r border-outline-variant/20 flex items-center"
              style={{ width: seg.span * DAY_WIDTH }}
            >
              {MONTHS_SHORT[seg.month]}
            </div>
          ))}
        </div>
        <div className="flex border-t border-outline-variant/20" style={{ height: 28 }}>
          {Array.from({ length: totalDays }).map((_, i) => {
            const d = addDays(minDate, i);
            const isToday = toISO(d) === todayStr;
            const weekend = isWeekend(d);
            return (
              <div
                key={i}
                style={{ width: DAY_WIDTH }}
                className={`shrink-0 text-center text-[10px] py-1.5 ${
                  isToday
                    ? 'bg-primary text-white font-bold rounded-t'
                    : weekend
                      ? 'bg-surface-container-high/40 text-outline-variant font-semibold'
                      : 'text-outline'
                }`}
              >
                {d.getDate()}
              </div>
            );
          })}
        </div>
      </div>

      <div className="relative" style={{ width, height: ganttHeight }}>
        <div className="absolute inset-0 flex pointer-events-none">
          {Array.from({ length: totalDays }).map((_, i) => {
            const d = addDays(minDate, i);
            return (
              <div
                key={i}
                style={{ width: DAY_WIDTH }}
                className={`h-full border-r border-outline-variant/10 ${isWeekend(d) ? 'bg-surface-container-low/30' : ''}`}
              />
            );
          })}
        </div>

        {todayOffset >= 0 && todayOffset <= width && (
          <div
            className="absolute top-0 bottom-0 border-l-2 border-dashed border-primary z-10 pointer-events-none"
            style={{ left: todayOffset }}
          />
        )}

        <svg className="absolute inset-0 pointer-events-none z-10" width={width} height={ganttHeight}>
          <defs>
            <marker id="gantt-arrowhead" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
              <path d="M0,0 L7,3.5 L0,7 Z" fill="#94a3b8" />
            </marker>
          </defs>
          {visibleTasks.flatMap((t) =>
            t.deps.map((depId) => {
              const src = barPos.get(depId);
              const dst = barPos.get(t.id);
              if (!src || !dst) return null;
              const midX = src.x2 + 12;
              const d = `M ${src.x2} ${src.y} L ${midX} ${src.y} L ${midX} ${dst.y} L ${dst.x1} ${dst.y}`;
              return <path key={`${depId}->${t.id}`} d={d} fill="none" stroke="#94a3b8" strokeWidth={1.5} markerEnd="url(#gantt-arrowhead)" />;
            }),
          )}
        </svg>

        <div className="relative z-20">
          {visibleTasks.map((t, i) => {
            const pos = barPos.get(t.id)!;
            const es = effectiveStatus(t);
            const isHighlighted = highlightedIds.has(t.id);
            return (
              <div key={t.id} className="absolute flex items-center" style={{ left: pos.x1, top: i * ROW_HEIGHT, height: ROW_HEIGHT }}>
                <button
                  onClick={() => onOpenTask(t.id)}
                  title={`${t.title} · ${t.start} — ${t.end}`}
                  className={`h-7 rounded-md flex items-center px-2 text-[11px] font-medium shadow-sm whitespace-nowrap overflow-hidden ${STATUS_BAR_CLASSES[es]} ${
                    isHighlighted ? 'ring-2 ring-amber-400 animate-pulse' : ''
                  }`}
                  style={{ width: pos.x2 - pos.x1 }}
                >
                  {t.title}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}