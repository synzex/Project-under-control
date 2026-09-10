import Database from 'better-sqlite3';

const db = new Database('database.db');
db.pragma('foreign_keys = ON');

// ------------------------------------------------------------
// 1. СХЕМА
// ------------------------------------------------------------
db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    status TEXT DEFAULT 'todo',
    assignee_id INTEGER,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS dependencies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    depends_on_task_id INTEGER NOT NULL,
    UNIQUE(task_id, depends_on_task_id),
    CHECK (task_id != depends_on_task_id),
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (depends_on_task_id) REFERENCES tasks(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
  CREATE INDEX IF NOT EXISTS idx_deps_task ON dependencies(task_id);
  CREATE INDEX IF NOT EXISTS idx_deps_depends ON dependencies(depends_on_task_id);
`);

// ------------------------------------------------------------
// 2. SEED ДАННЫЕ
// ------------------------------------------------------------
const userCount = db.prepare('SELECT count(*) as count FROM users').get() as { count: number };
if (userCount.count === 0) {
  const insertUser = db.prepare('INSERT INTO users (name) VALUES (?)');
  insertUser.run('Иван Иванов');
  insertUser.run('Василий Сидоров');
  insertUser.run('Дмитрий Федорук');
}

const projectCount = db.prepare('SELECT count(*) as count FROM projects').get() as { count: number };
if (projectCount.count === 0) {
  const insertProject = db.prepare(`
    INSERT INTO projects (title, description, start_date, end_date)
    VALUES (?, ?, ?, ?)
  `);
  const projectInfo = insertProject.run(
    'Разработка сайта',
    'Корпоративный сайт компании',
    '2026-09-01',
    '2026-10-15'
  );
  const projectId = projectInfo.lastInsertRowid;

  const insertTask = db.prepare(`
    INSERT INTO tasks (project_id, title, description, start_date, end_date, status, assignee_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertTask.run(projectId, 'Анализ требований', 'Сбор требований от заказчика', '2026-09-01', '2026-09-05', 'done', 3);
  insertTask.run(projectId, 'Дизайн',           'Макеты и UI-kit',             '2026-09-06', '2026-09-15', 'in_progress', 2);
  insertTask.run(projectId, 'Разработка',       'Верстка и бэкенд',            '2026-09-16', '2026-10-01', 'todo', 1);
  insertTask.run(projectId, 'Тестирование',     'QA и багфикс',                '2026-10-02', '2026-10-10', 'todo', 1);

  const insertDep = db.prepare(`
    INSERT INTO dependencies (task_id, depends_on_task_id) VALUES (?, ?)
  `);
  insertDep.run(2, 1);
  insertDep.run(3, 2);
  insertDep.run(4, 3);
}

// ============================================================
// 3. ПУБЛИЧНЫЙ ИНТЕРФЕЙС
// ============================================================

// ---------- Проекты ----------
export function getAllProjects() {
  return db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all();
}

export function getProjectById(id: number) {
  return db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
}

export function createProject(data: {
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
}) {
  const info = db.prepare(`
    INSERT INTO projects (title, description, start_date, end_date)
    VALUES (?, ?, ?, ?)
  `).run(data.title, data.description || '', data.start_date, data.end_date);
  return getProjectById(info.lastInsertRowid as number);
}

// ---------- Задачи ----------
export function getTasksByProject(projectId: number) {
  return db.prepare(`
    SELECT t.*, u.name AS assignee_name
    FROM tasks t
    LEFT JOIN users u ON t.assignee_id = u.id
    WHERE t.project_id = ?
    ORDER BY t.start_date
  `).all(projectId);
}

export function getTaskById(id: number) {
  return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
}

// Проверка: существует ли пользователь с таким id
export function userExists(id: number): boolean {
  const row = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
  return !!row;
}

export function createTask(data: {
  project_id: number;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  status?: string;
  assignee_id?: number | null;
}) {
  // Санитизация assignee_id — защита от FOREIGN KEY
  let safeAssignee: number | null = null;
  if (data.assignee_id !== null && data.assignee_id !== undefined) {
    const n = Number(data.assignee_id);
    if (Number.isInteger(n) && n > 0 && userExists(n)) {
      safeAssignee = n;
    }
  }

  const info = db.prepare(`
    INSERT INTO tasks (project_id, title, description, start_date, end_date, status, assignee_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.project_id,
    data.title,
    data.description || '',
    data.start_date,
    data.end_date,
    data.status || 'todo',
    safeAssignee
  );
  return getTaskById(info.lastInsertRowid as number);
}

// НОВОЕ: обновление задачи
export function updateTask(id: number, data: {
  title?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
  assignee_id?: number | null;
}) {
  const existing = getTaskById(id) as any;
  if (!existing) return null;

  // Санитизация assignee_id
  let safeAssignee: number | null = existing.assignee_id;
  if (data.assignee_id !== undefined) {
    if (data.assignee_id === null) {
      safeAssignee = null;
    } else {
      const n = Number(data.assignee_id);
      if (Number.isInteger(n) && n > 0 && userExists(n)) {
        safeAssignee = n;
      }
      // иначе оставляем как было
    }
  }

  db.prepare(`
    UPDATE tasks
    SET title       = COALESCE(?, title),
        description = COALESCE(?, description),
        start_date  = COALESCE(?, start_date),
        end_date    = COALESCE(?, end_date),
        status      = COALESCE(?, status),
        assignee_id = ?
    WHERE id = ?
  `).run(
    data.title ?? null,
    data.description ?? null,
    data.start_date ?? null,
    data.end_date ?? null,
    data.status ?? null,
    safeAssignee,
    id
  );

  return getTaskById(id);
}

export function deleteTaskById(id: number) {
  const info = db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  return info.changes > 0;
}

// ---------- Связи ----------
export function getLinksByProject(projectId: number) {
  return db.prepare(`
    SELECT d.id, d.depends_on_task_id AS source, d.task_id AS target
    FROM dependencies d
    JOIN tasks t ON d.task_id = t.id
    WHERE t.project_id = ?
  `).all(projectId);
}

export function createDependency(task_id: number, depends_on_task_id: number) {
  const info = db.prepare(`
    INSERT INTO dependencies (task_id, depends_on_task_id) VALUES (?, ?)
  `).run(task_id, depends_on_task_id);
  return {
    id: info.lastInsertRowid,
    source: depends_on_task_id,
    target: task_id
  };
}

export function setTaskDependencies(taskId: number, dependsOnIds: number[]) {
  const tx = db.transaction(() => {
    // Удаляем все текущие зависимости этой задачи
    db.prepare('DELETE FROM dependencies WHERE task_id = ?').run(taskId);

    // Вставляем новые
    const insert = db.prepare(
      'INSERT INTO dependencies (task_id, depends_on_task_id) VALUES (?, ?)'
    );
    for (const depId of dependsOnIds) {
      if (depId !== taskId) {
        insert.run(taskId, depId);
      }
    }
  });
  tx();

  return { task_id: taskId, deps: dependsOnIds };
}

export function deleteDependencyById(id: number) {
  const info = db.prepare('DELETE FROM dependencies WHERE id = ?').run(id);
  return info.changes > 0;
}

// ---------- Пользователи ----------
export function getAllUsers() {
  return db.prepare('SELECT * FROM users').all();
}

// ---------- Зависимые задачи (рекурсивно) ----------
export function findDependents(taskId: number, affected = new Set<number>()): Set<number> {
  const children = db.prepare(
    'SELECT task_id FROM dependencies WHERE depends_on_task_id = ?'
  ).all(taskId) as { task_id: number }[];

  children.forEach(c => {
    if (!affected.has(c.task_id)) {
      affected.add(c.task_id);
      findDependents(c.task_id, affected);
    }
  });
  return affected;
}

// ---------- Сдвиг задачи с каскадом ----------
export function shiftTask(taskId: number, days: number) {
  const task = getTaskById(taskId) as any;
  if (!task) return null;

  const affected = findDependents(taskId);

  const addDays = (d: string, n: number) => {
    const dt = new Date(d);
    dt.setDate(dt.getDate() + n);
    return dt.toISOString().slice(0, 10);
  };

  const tx = db.transaction(() => {
    const update = db.prepare(
      'UPDATE tasks SET start_date = ?, end_date = ? WHERE id = ?'
    );
    update.run(addDays(task.start_date, days), addDays(task.end_date, days), taskId);

    affected.forEach(aid => {
      const t = getTaskById(aid) as any;
      update.run(addDays(t.start_date, days), addDays(t.end_date, days), aid);
    });
  });
  tx();

  return {
    shifted_task_id: taskId,
    affected_task_ids: Array.from(affected),
    days
  };
}

export default db;