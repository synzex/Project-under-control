import { Router } from 'express';
import db from '../db';

const router = Router();

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

    res.status(201).json({
      id: info.lastInsertRowid,
      source: depends_on_task_id,
      target: task_id
    });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка создания связи между задачами' });
  }
});

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
