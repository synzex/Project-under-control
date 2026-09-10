// ============================================================
// frontend/src/api.ts — клиент для общения с бэкендом
// Плюс адаптеры: БД-формат ↔ фронт-формат
// ============================================================

const API = '/api'; // Vite проксирует на http://localhost:4000

// ============================================================
// АДАПТЕРЫ
// Преобразуют объекты из БД в формат, который ждёт фронт.
// ============================================================

export function adaptProject(p: any) {
  return {
    id: p.id,
    title: p.title,
    description: p.description || '',
    start: p.start_date,   // ← переименование
    end: p.end_date,       // ← переименование
  };
}

export function adaptTask(t: any) {
  return {
    id: t.id,
    projectId: t.project_id,      // ← переименование
    title: t.title,
    description: t.description || '',
    start: t.start_date,          // ← переименование
    end: t.end_date,              // ← переименование
    status: t.status,
    assigneeId: t.assignee_id ?? null,
    deps: [] as number[],          // заполним отдельно из links
  };
}

// Обратные адаптеры: фронт → БД (для POST/PUT)
export function toProjectPayload(values: any) {
  return {
    title: values.title,
    description: values.description,
    start_date: values.start,   // ← переименование
    end_date: values.end,       // ← переименование
  };
}

export function toTaskPayload(values: any) {
  return {
    title: values.title,
    description: values.description,
    start_date: values.start,   // ← переименование
    end_date: values.end,       // ← переименование
    status: values.status,
    assignee_id: values.assigneeId ?? null,
  };
}

// ============================================================
// ПРОЕКТЫ
// ============================================================

export async function fetchProjects() {
  const res = await fetch(`${API}/projects`);
  if (!res.ok) throw new Error('Не удалось загрузить проекты');
  const raw = await res.json();
  return raw.map(adaptProject);
}

export async function fetchProject(id: number) {
  const res = await fetch(`${API}/projects/${id}`);
  if (!res.ok) throw new Error('Проект не найден');
  return adaptProject(await res.json());
}

export async function createProjectRemote(data: {
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
}) {
  const res = await fetch(`${API}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Ошибка создания проекта');
  }
  return adaptProject(await res.json());
}

// ============================================================
// ЗАДАЧИ
// ============================================================

export async function fetchTasksByProject(projectId: number) {
  const res = await fetch(`${API}/tasks/project/${projectId}`);
  if (!res.ok) throw new Error('Не удалось загрузить задачи');
  const raw = await res.json(); // { tasks, links }

  // Преобразуем задачи
  const tasks = raw.tasks.map((t: any) => {
    const adapted = adaptTask(t);
    // Из links достаём deps (зависимости для этой задачи)
    adapted.deps = raw.links
      .filter((l: any) => l.target === t.id)
      .map((l: any) => l.source);
    return adapted;
  });

  return { tasks, links: raw.links };
}

export async function createTaskRemote(projectId: number, data: {
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  status?: string;
  assignee_id?: number | null;
}) {
  const res = await fetch(`${API}/tasks/project/${projectId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Ошибка создания задачи');
  }
  return adaptTask(await res.json());
}

export async function updateTaskRemote(id: number, data: {
  title?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
  assignee_id?: number | null;
}) {
  const res = await fetch(`${API}/tasks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Ошибка обновления задачи');
  }
  return adaptTask(await res.json());
}

export async function deleteTaskRemote(id: number) {
  const res = await fetch(`${API}/tasks/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Ошибка удаления задачи');
  return res.json();
}

export async function createDependencyRemote(task_id: number, depends_on_task_id: number) {
  const res = await fetch(`${API}/tasks/dependencies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task_id, depends_on_task_id }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Ошибка создания связи');
  }
  return res.json();
}

export async function setTaskDependenciesRemote(taskId: number, deps: number[]) {
  const res = await fetch(`${API}/tasks/${taskId}/dependencies`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deps }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Ошибка сохранения зависимостей');
  }
  return res.json();
}

export async function shiftTaskRemote(id: number, days: number) {
  const res = await fetch(`${API}/tasks/${id}/shift`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ days }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Ошибка сдвига задачи');
  }
  return res.json();
}

// ============================================================
// ПОЛЬЗОВАТЕЛИ
// ============================================================

export async function fetchUsers() {
  const res = await fetch(`${API}/users`);
  if (!res.ok) throw new Error('Не удалось загрузить пользователей');
  return res.json();
}