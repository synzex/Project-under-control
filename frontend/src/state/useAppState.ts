import { useCallback, useEffect, useState } from 'react';
import type { ProjectView, TaskView, ProjectFormValues, TaskFormValues } from '../types';
import * as api from '../api';

export function useAppState() {
  const [projects, setProjects] = useState<ProjectView[]>([]);
  const [tasks, setTasks] = useState<TaskView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.fetchProjects()
      .then(setProjects)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const loadTasksForProject = useCallback(async (projectId: number) => {
    try {
      const { tasks: t } = await api.fetchTasksByProject(projectId);
      setTasks(t);
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  const createProject = useCallback(async (values: ProjectFormValues) => {
    const p = await api.createProjectRemote({
      title: values.name,
      description: '',
      start_date: values.start,
      end_date: values.end,
    });
    setProjects(prev => [...prev, p]);
    return p;
  }, []);

  const createTask = useCallback(async (projectId: number, values: TaskFormValues) => {
    // 1. Создаём задачу
    const t = await api.createTaskRemote(projectId, {
      title: values.name,
      description: values.description,
      start_date: values.start,
      end_date: values.end,
      status: values.status,
      assignee: values.assignee?.trim() || null,   // ← было: assignee_id: parseAssignee(...)
    });

    // 2. Сохраняем зависимости
    const deps = values.deps ?? [];
    if (deps.length > 0) {
      await api.setTaskDependenciesRemote(t.id, deps);
      t.deps = deps;
    }

    setTasks(prev => [...prev, t]);
    return t;
  }, []);

  const updateTask = useCallback(async (taskId: number, values: TaskFormValues) => {
    // 1. Обновляем саму задачу
    const t = await api.updateTaskRemote(taskId, {
      title: values.name,
      description: values.description,
      start_date: values.start,
      end_date: values.end,
      status: values.status,
      assignee: values.assignee?.trim() || null,   // ← было: assignee_id: parseAssignee(...)
    });

    // 2. Обновляем зависимости (заменяем все)
    const deps = values.deps ?? [];
    await api.setTaskDependenciesRemote(taskId, deps);
    t.deps = deps;

    setTasks(prev => prev.map(task => task.id === taskId ? t : task));
    return t;
  }, []);

  const deleteTask = useCallback(async (taskId: number) => {
    await api.deleteTaskRemote(taskId);
    setTasks(prev => prev.filter(t => t.id !== taskId));
  }, []);

  const shiftTask = useCallback(async (taskId: number, days: number) => {
    const result = await api.shiftTaskRemote(taskId, days);
    const current = tasks.find(t => t.id === taskId);
    if (current) await loadTasksForProject(current.projectId);
    return result;
  }, [tasks, loadTasksForProject]);

  const tasksForProject = useCallback(
    (projectId: number) => tasks.filter(t => t.projectId === projectId),
    [tasks],
  );

  const projectProgress = useCallback(
    (projectId: number) => {
      const ts = tasksForProject(projectId);
      if (!ts.length) return 0;
      const done = ts.filter(t => t.status === 'done').length;
      return Math.round((done / ts.length) * 100);
    },
    [tasksForProject],
  );

  const overdueCount = useCallback(
    (projectId: number) => {
      const today = new Date().toISOString().slice(0, 10);
      return tasksForProject(projectId).filter(
        t => t.end < today && t.status !== 'done'
      ).length;
    },
    [tasksForProject],
  );

  const taskCount = useCallback(
    (projectId: number) => tasks.filter(t => t.projectId === projectId).length,
    [tasks],
  );

  return {
    projects,
    tasks,
    loading,
    error,
    taskCount,
    tasksForProject,
    projectProgress,
    overdueCount,
    loadTasksForProject,
    createProject,
    createTask,
    updateTask,
    deleteTask,
    shiftTask,
  };
}