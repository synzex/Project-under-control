import { Router } from 'express';
import db from '../db';

const router = Router();

// Вспомогательная функция для расчета разницы и добавления дней в формате YYYY-MM-DD
function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function getDurationInDays(startDateStr: string, endDateStr: string): number {
  const start = new Date(startDateStr).getTime();
  const end = new Date(endDateStr).getTime();
  return Math.max(1, Math.round((end - start) / (1000 * 3600 * 24)));
}

// Рекурсивный каскадный сдвиг дат зависимых задач
function recalculateDependentTasks(parentTaskId: number, newParentEndDate: string) {
  // Находим все задачи, которые зависят от parentTaskId
  const dependentLinks = db.prepare(`
    SELECT task_id FROM dependencies WHERE depends_on_task_id = ?
  `).all(parentTaskId) as { task_id: number }[];

  for (const link of dependentLinks) {
    const childTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(link.task_id) as any;
    if (!childTask) continue;

    // Если конец родительской задачи вылезает за старт дочерней — сдвигаем дочернюю
    if (newParentEndDate > childTask.start_date) {
      const duration = getDurationInDays(childTask.start_date, childTask.end_date);
      
      // Новый старт — следующий день после конца родителя (или тот же день, в зависимости от бизнес-логики)
      const newChildStart = addDays(newParentEndDate, 1);
      const newChildEnd = addDays(newChildStart, duration);

      db.prepare(`
        UPDATE tasks SET start_date = ?, end_date = ? WHERE id = ?
      `).run(newChildStart, newChildEnd, childTask.id);

      // Рекурсивно двигаем тех, кто зависит от текущей дочерней задачи
      recalculateDependentTasks(childTask.id, newChildEnd);
    }
  }
}

// Получить все задачи и связи проекта
router.get('/project/:projectId', (req, res) => {
  try {
    const { projectId } = req.params;

    const tasks = db.prepare(`
      SELECT t.*, u.name as assignee_name 
      FROM tasks t 
      LEFT JOIN users u ON t.assignee_id = u.id 
      WHERE t.project_id = ?
    `).all(projectId);

    const links = db.prepare(`
      SELECT d.id, d.depends_on_task_id as source, d.task_id as target
      FROM dependencies d
      JOIN tasks t ON d.task_id = t.id
      WHERE t.project_id = ?
    `).all(projectId);

    res.json({ tasks, links });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения задач проекта' });
  }
});

// Создать задачу
router.post('/project/:projectId', (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description, start_date, end_date, status, assignee_id } = req.body;

    if (!title || !start_date || !end_date) {
      return res.status(400).json({ error: 'Название, start_date и end_date обязательны' });
    }

    const stmt = db.prepare(`
      INSERT INTO tasks (project_id, title, description, start_date, end_date, status, assignee_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      projectId,
      title,
      description || '',
      start_date,
      end_date,
      status || 'todo',
      assignee_id || null
    );

    res.status(201).json({
      id: info.lastInsertRowid,
      project_id: Number(projectId),
      title,
      description,
      start_date,
      end_date,
      status: status || 'todo',
      assignee_id
    });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка создания задачи' });
  }
});

// Обновить задачу (с каскадным пересчетом зависимостей)
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, start_date, end_date, status, assignee_id } = req.body;

    const currentTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as any;
    if (!currentTask) {
      return res.status(404).json({ error: 'Задача не найдена' });
    }

    const updatedTitle = title ?? currentTask.title;
    const updatedDesc = description ?? currentTask.description;
    const updatedStart = start_date ?? currentTask.start_date;
    const updatedEnd = end_date ?? currentTask.end_date;
    const updatedStatus = status ?? currentTask.status;
    const updatedAssignee = assignee_id !== undefined ? assignee_id : currentTask.assignee_id;

    db.prepare(`
      UPDATE tasks 
      SET title = ?, description = ?, start_date = ?, end_date = ?, status = ?, assignee_id = ?
      WHERE id = ?
    `).run(updatedTitle, updatedDesc, updatedStart, updatedEnd, updatedStatus, updatedAssignee, id);

    // Запускаем каскадный пересчет для зависимых задач
    recalculateDependentTasks(Number(id), updatedEnd);

    res.json({ message: 'Задача и зависимые сроки обновлены успешно' });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка обновления задачи' });
  }
});

// Создать связь между задачами
router.post('/dependencies', (req, res) => {
  try {
    const { task_id, depends_on_task_id } = req.body;

    if (!task_id || !depends_on_task_id) {
      return res.status(400).json({ error: 'Укажите task_id и depends_on_task_id' });
    }

    if (task_id === depends_on_task_id) {
      return res.status(400).json({ error: 'Задача не может зависеть сама от себя' });
    }

    const stmt = db.prepare(`
      INSERT INTO dependencies (task_id, depends_on_task_id) VALUES (?, ?)
    `);
    const info = stmt.run(task_id, depends_on_task_id);

    // При создании связи проверяем, не надо ли сразу сдвинуть дочернюю задачу
    const parentTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(depends_on_task_id) as any;
    if (parentTask) {
      recalculateDependentTasks(depends_on_task_id, parentTask.end_date);
    }

    res.status(201).json({
      id: info.lastInsertRowid,
      source: depends_on_task_id,
      target: task_id
    });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка создания связи между задачами' });
  }
});

// Удалить задачу
router.delete('/:id', (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM tasks WHERE id = ?');
    stmt.run(req.params.id);
    res.json({ success: true, message: 'Задача удалена' });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка удаления задачи' });
  }
});

export default router;
