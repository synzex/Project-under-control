import { Router } from 'express';
import db from '../db';

const router = Router();

router.get('/', (req, res) => {
  try {
    const projects = db.prepare('SELECT * FROM projects ORDER BY id DESC').all();
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения проектов' });
  }
});

router.get('/users/all', (req, res) => {
  try {
    const users = db.prepare('SELECT * FROM users').all();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения пользователей' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Проект не найден' });
    }
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения проекта' });
  }
});

router.post('/', (req, res) => {
  try {
    const { title, description, start_date, end_date } = req.body;
    if (!title || !start_date || !end_date) {
      return res.status(400).json({ error: 'Название, start_date и end_date обязательны' });
    }

    const stmt = db.prepare(
      'INSERT INTO projects (title, description, start_date, end_date) VALUES (?, ?, ?, ?)'
    );
    const info = stmt.run(title, description || '', start_date, end_date);
    
    res.status(201).json({
      id: info.lastInsertRowid,
      title,
      description,
      start_date,
      end_date
    });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка создания проекта' });
  }
});

export default router;
