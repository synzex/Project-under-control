import type { Project, Task } from '../types';
import { addDays, toISO, todayAtMidnight } from '../utils/date';

let counter = 0;
export function uid(prefix: string): string {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}_${counter}`;
}

export function seedData(): { projects: Project[]; tasks: Task[] } {
  const today = todayAtMidnight();

  const p1: Project = {
    id: uid('p'),
    name: 'Разработка веб-платформы Flow v2.0',
    start: toISO(addDays(today, -14)),
    end: toISO(addDays(today, 45)),
  };
  const p2: Project = {
    id: uid('p'),
    name: 'Редизайн мобильного приложения',
    start: toISO(addDays(today, -5)),
    end: toISO(addDays(today, 60)),
  };

  const t1: Task = {
    id: uid('t'), projectId: p1.id, name: 'Анализ требований', assignee: 'Мария Иванова',
    status: 'done', start: toISO(addDays(today, -14)), end: toISO(addDays(today, -9)),
    deps: [], description: '',
  };
  const t2: Task = {
    id: uid('t'), projectId: p1.id, name: 'Настройка окружения', assignee: 'Дмитрий Ковалев',
    status: 'done', start: toISO(addDays(today, -12)), end: toISO(addDays(today, -7)),
    deps: [], description: '',
  };
  const t3: Task = {
    id: uid('t'), projectId: p1.id, name: 'Дизайн интерфейса', assignee: 'Алина Смирнова',
    status: 'in_progress', start: toISO(addDays(today, -9)), end: toISO(addDays(today, 3)),
    deps: [t1.id], description: '',
  };
  const t4: Task = {
    id: uid('t'), projectId: p1.id, name: 'Ревью дизайна', assignee: 'Алина Смирнова',
    status: 'in_progress', start: toISO(addDays(today, -4)), end: toISO(addDays(today, -1)),
    deps: [t1.id], description: 'Согласовать макеты с заказчиком',
  };
  const t5: Task = {
    id: uid('t'), projectId: p1.id, name: 'Разработка', assignee: 'Дмитрий Ковалев',
    status: 'planned', start: toISO(addDays(today, 3)), end: toISO(addDays(today, 25)),
    deps: [t3.id], description: '',
  };
  const t6: Task = {
    id: uid('t'), projectId: p1.id, name: 'Тестирование', assignee: 'Игорь Волков',
    status: 'planned', start: toISO(addDays(today, 25)), end: toISO(addDays(today, 36)),
    deps: [t5.id], description: '',
  };
  const t7: Task = {
    id: uid('t'), projectId: p1.id, name: 'Деплой на прод', assignee: 'Игорь Волков',
    status: 'planned', start: toISO(addDays(today, 36)), end: toISO(addDays(today, 40)),
    deps: [t6.id], description: '',
  };

  const q1: Task = {
    id: uid('t'), projectId: p2.id, name: 'Исследование пользователей', assignee: 'Мария Иванова',
    status: 'in_progress', start: toISO(addDays(today, -5)), end: toISO(addDays(today, 5)),
    deps: [], description: '',
  };
  const q2: Task = {
    id: uid('t'), projectId: p2.id, name: 'Прототип', assignee: 'Алина Смирнова',
    status: 'planned', start: toISO(addDays(today, 5)), end: toISO(addDays(today, 20)),
    deps: [q1.id], description: '',
  };

  return {
    projects: [p1, p2],
    tasks: [t1, t2, t3, t4, t5, t6, t7, q1, q2],
  };
}
