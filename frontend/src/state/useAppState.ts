import { useCallback, useMemo, useState } from 'react';
import type { Project, ProjectFormValues, Task, TaskFormValues } from '../types';
import { seedData, uid } from '../data/seed';
import { downstreamOf, effectiveStatus } from '../utils/domain';

export function useAppState() {
  // seed once so project/task ids reference each other correctly
  const [seed] = useState(() => seedData());
  const [projects, setProjects] = useState<Project[]>(seed.projects);
  const [tasks, setTasks] = useState<Task[]>(seed.tasks);

  const tasksForProject = useCallback(
    (projectId: string) => tasks.filter((t) => t.projectId === projectId),
    [tasks],
  );

  const projectProgress = useCallback(
    (projectId: string) => {
      const ts = tasksForProject(projectId);
      if (!ts.length) return 0;
      const done = ts.filter((t) => t.status === 'done').length;
      return Math.round((done / ts.length) * 100);
    },
    [tasksForProject],
  );

  const createProject = useCallback((values: ProjectFormValues) => {
    const p: Project = { id: uid('p'), ...values };
    setProjects((prev) => [...prev, p]);
    return p;
  }, []);

  const createTask = useCallback((projectId: string, values: TaskFormValues) => {
    const t: Task = { id: uid('t'), projectId, ...values };
    setTasks((prev) => [...prev, t]);
    return t;
  }, []);

  /** Returns ids of downstream tasks that may be affected if dates changed. */
  const updateTask = useCallback(
    (taskId: string, values: TaskFormValues): string[] => {
      let affected: string[] = [];
      setTasks((prev) => {
        const current = prev.find((t) => t.id === taskId);
        const datesChanged = !!current && (current.start !== values.start || current.end !== values.end);
        const next = prev.map((t) => (t.id === taskId ? { ...t, ...values } : t));
        if (datesChanged && current) {
          affected = downstreamOf(taskId, next.filter((t) => t.projectId === current.projectId));
        }
        return next;
      });
      return affected;
    },
    [],
  );

  const deleteTask = useCallback((taskId: string) => {
    setTasks((prev) =>
      prev.filter((t) => t.id !== taskId).map((t) => ({ ...t, deps: t.deps.filter((d) => d !== taskId) })),
    );
  }, []);

  const overdueCount = useCallback(
    (projectId: string) => tasksForProject(projectId).filter((t) => effectiveStatus(t) === 'overdue').length,
    [tasksForProject],
  );

  return useMemo(
    () => ({
      projects,
      tasks,
      tasksForProject,
      projectProgress,
      overdueCount,
      createProject,
      createTask,
      updateTask,
      deleteTask,
    }),
    [projects, tasks, tasksForProject, projectProgress, overdueCount, createProject, createTask, updateTask, deleteTask],
  );
}
