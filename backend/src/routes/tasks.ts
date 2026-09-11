import { Router } from 'express';
import {
  getTasksByProject,
  getLinksByProject,
  createTask,
  updateTask,
  createDependency,
  setTaskDependencies,
  deleteTaskById,
  deleteDependencyById,
  findDependents,
  shiftTask,
  getTaskById
} from '../db';

const router = Router();

// GET /api/tasks/project/:projectId — задачи + связи проекта
router.get('/project/:projectId', (req, res) => {
  try {
    const projectId = Number(req.params.projectId);
    const tasks = getTasksByProject(projectId);
    const links = getLinksByProject(projectId);
    res.json({ tasks, links });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ошибка получения задач проекта' });
  }
});

// POST /api/tasks/project/:projectId — создать задачу
router.post('/project/:projectId', (req, res) => {
  try {
    const projectId = Number(req.params.projectId);
    const { title, description, start_date, end_date, status, assignee } = req.body;

    if (!title || !start_date || !end_date) {
      return res.status(400).json({ error: 'Поля title, start_date и end_date обязательны' });
    }
    if (new Date(end_date) < new Date(start_date)) {
      return res.status(400).json({ error: 'Дата окончания раньше даты начала' });
    }

    const task = createTask({
      project_id: projectId,
      title,
      description,
      start_date,
      end_date,
      status,
      assignee,
    });
    res.status(201).json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ошибка создания задачи' });
  }
});

// POST /api/tasks/dependencies — создать одну связь
router.post('/dependencies', (req, res) => {
  try {
    const { task_id, depends_on_task_id } = req.body;

    if (!task_id || !depends_on_task_id) {
      return res.status(400).json({ error: 'Нужны task_id и depends_on_task_id' });
    }
    if (task_id === depends_on_task_id) {
      return res.status(400).json({ error: 'Задача не может зависеть сама от себя' });
    }

    const link = createDependency(Number(task_id), Number(depends_on_task_id));
    res.status(201).json(link);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ошибка создания связи (возможно, уже существует)' });
  }
});

// GET /api/tasks/:id/dependents — какие задачи затронутся
router.get('/:id/dependents', (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!getTaskById(id)) {
      return res.status(404).json({ error: 'Задача не найдена' });
    }
    res.json({ affected_task_ids: Array.from(findDependents(id)) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ошибка получения зависимых задач' });
  }
});

// POST /api/tasks/:id/shift — сдвинуть задачу и всех зависимых
router.post('/:id/shift', (req, res) => {
  try {
    const id = Number(req.params.id);
    const { days } = req.body;

    if (typeof days !== 'number' || days === 0) {
      return res.status(400).json({ error: 'Нужно число days (не 0)' });
    }

    const result = shiftTask(id, days);
    if (!result) return res.status(404).json({ error: 'Задача не найдена' });

    res.json({ ok: true, ...result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ошибка сдвига задачи' });
  }
});

router.put('/:id/dependencies', (req, res) => {
  try {
    const taskId = Number(req.params.id);
    const { deps } = req.body;

    if (!Array.isArray(deps)) {
      return res.status(400).json({ error: 'deps должен быть массивом' });
    }
    if (!getTaskById(taskId)) {
      return res.status(404).json({ error: 'Задача не найдена' });
    }

    //console.log('🔍 setTaskDependencies:', { taskId, deps });

    const result = setTaskDependencies(taskId, deps);
    res.json(result);
  } catch (error) {
    console.error('❌ setTaskDependencies failed:', error);
    res.status(500).json({ error: 'Ошибка сохранения зависимостей' });
  }
});

// PUT /api/tasks/:id — обновить задачу
router.put('/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const { title, description, start_date, end_date, status, assignee } = req.body;

    if (end_date && start_date && new Date(end_date) < new Date(start_date)) {
      return res.status(400).json({ error: 'Дата окончания раньше даты начала' });
    }

    const updated = updateTask(id, {
      title,
      description,
      start_date,
      end_date,
      status,
      assignee,
    });

    if (!updated) return res.status(404).json({ error: 'Задача не найдена' });
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ошибка обновления задачи' });
  }
});

// DELETE /api/tasks/dependencies/:id — удалить связь
router.delete('/dependencies/:id', (req, res) => {
  try {
    const ok = deleteDependencyById(Number(req.params.id));
    if (!ok) return res.status(404).json({ error: 'Связь не найдена' });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ошибка удаления связи' });
  }
});

// DELETE /api/tasks/:id — удалить задачу
router.delete('/:id', (req, res) => {
  try {
    const ok = deleteTaskById(Number(req.params.id));
    if (!ok) return res.status(404).json({ error: 'Задача не найдена' });
    res.json({ success: true, message: 'Задача удалена' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ошибка удаления задачи' });
  }
});

export default router;