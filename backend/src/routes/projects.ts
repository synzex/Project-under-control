import { Router } from 'express';
import {
  getAllProjects,
  getProjectById,
  createProject,
  getAllUsers
} from '../db';

const router = Router();

// GET /api/projects — все проекты
router.get('/', (req, res) => {
  try {
    res.json(getAllProjects());
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ошибка получения проектов' });
  }
});

// GET /api/projects/users/all — все пользователи
router.get('/users/all', (req, res) => {
  try {
    res.json(getAllUsers());
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ошибка получения пользователей' });
  }
});

// GET /api/projects/:id — один проект
router.get('/:id', (req, res) => {
  try {
    const project = getProjectById(Number(req.params.id));
    if (!project) {
      return res.status(404).json({ error: 'Проект не найден' });
    }
    res.json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ошибка получения проекта' });
  }
});

// POST /api/projects — создать проект
router.post('/', (req, res) => {
  try {
    const { title, description, start_date, end_date } = req.body;

    if (!title || !start_date || !end_date) {
      return res.status(400).json({ error: 'Поля title, start_date и end_date обязательны' });
    }
    if (new Date(end_date) < new Date(start_date)) {
      return res.status(400).json({ error: 'Дата окончания раньше даты начала' });
    }

    const project = createProject({ title, description, start_date, end_date });
    res.status(201).json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ошибка создания проекта' });
  }
});

export default router;