import { useCallback, useEffect, useState } from 'react';
import { Header } from './components/Header';
import { ProjectList } from './components/ProjectList';
import { ProjectDetail } from './components/ProjectDetail';
import { ProjectModal } from './components/ProjectModal';
import { TaskDrawer } from './components/TaskDrawer';
import { useAppState } from './state/useAppState';
import type { View, TaskFormValues } from './types';

export default function App() {
  const {
    projects, tasks, tasksForProject, projectProgress, overdueCount,
    loadTasksForProject,
    createProject, createTask, updateTask, deleteTask,
  } = useAppState();

  const [view, setView] = useState<View>('list');
  const [currentProjectId, setCurrentProjectId] = useState<number | null>(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [highlightedIds, setHighlightedIds] = useState<Set<number>>(new Set());
  const [affectedNames, setAffectedNames] = useState<string[]>([]);

  const goList = useCallback(() => {
    setView('list');
    setCurrentProjectId(null);
  }, []);

  const openProject = useCallback(async (id: number) => {
    setCurrentProjectId(id);
    setView('detail');
    await loadTasksForProject(id);
  }, [loadTasksForProject]);

  const openTaskDrawer = useCallback((id: number | null) => {
    setEditingTaskId(id);
    setDrawerOpen(true);
  }, []);

  const closeTaskDrawer = useCallback(() => {
    setDrawerOpen(false);
    setEditingTaskId(null);
  }, []);

  const currentProject = projects.find((p) => p.id === currentProjectId) ?? null;
  const projectTasks = currentProjectId ? tasksForProject(currentProjectId) : [];
  const editingTask = editingTaskId ? (tasks.find((t) => t.id === editingTaskId) ?? null) : null;

  async function handleSaveTask(values: TaskFormValues) {
    if (!currentProjectId) return;

    if (editingTaskId) {
      await updateTask(editingTaskId, values);
    } else {
      await createTask(currentProjectId, values);
    }
    closeTaskDrawer();
  }

  async function handleDeleteTask() {
    if (!editingTaskId) return;
    if (!window.confirm('Удалить задачу? Связи с другими задачами тоже будут удалены.')) return;
    await deleteTask(editingTaskId);
    closeTaskDrawer();
  }

  return (
    <div className="font-body text-on-surface bg-background min-h-screen">
      <Header onLogoClick={goList} />
      <main className="w-full pt-16 min-h-screen">
        {view === 'list' && (
          <ProjectList
            projects={projects}
            taskCount={(id) => tasksForProject(id).length}
            progress={projectProgress}
            overdueCount={overdueCount}
            onOpenProject={openProject}
            onCreateProject={() => setShowProjectModal(true)}
          />
        )}
        {view === 'detail' && currentProject && (
          <ProjectDetail
            project={currentProject}
            tasks={projectTasks}
            highlightedIds={highlightedIds}
            affectedNames={affectedNames}
            onBack={goList}
            onCreateTask={() => openTaskDrawer(null)}
            onOpenTask={(id) => openTaskDrawer(id)}
          />
        )}
      </main>

      {showProjectModal && (
        <ProjectModal
          onClose={() => setShowProjectModal(false)}
          onSave={async (values) => {
            const p = await createProject(values);
            setShowProjectModal(false);
            openProject(p.id);
          }}
        />
      )}

      {drawerOpen && currentProjectId && (
        <TaskDrawer
          task={editingTask}
          otherTasksInProject={projectTasks.filter((t) => t.id !== editingTaskId)}
          onClose={closeTaskDrawer}
          onSave={handleSaveTask}
          onDelete={handleDeleteTask}
        />
      )}
    </div>
  );
}