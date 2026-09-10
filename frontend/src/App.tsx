import { useCallback, useState } from 'react';
import { Header } from './components/Header';
import { ProjectList } from './components/ProjectList';
import { ProjectDetail } from './components/ProjectDetail';
import { ProjectModal } from './components/ProjectModal';
import { TaskDrawer } from './components/TaskDrawer';
import { useAppState } from './state/useAppState';
import type { View } from './types';

export default function App() {
  const { projects, tasks, tasksForProject, projectProgress, overdueCount, createProject, createTask, updateTask, deleteTask } =
    useAppState();

  const [view, setView] = useState<View>('list');
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [highlightedIds, setHighlightedIds] = useState<Set<string>>(new Set());
  const [affectedNames, setAffectedNames] = useState<string[]>([]);

  const goList = useCallback(() => {
    setView('list');
    setCurrentProjectId(null);
  }, []);

  const openProject = useCallback((id: string) => {
    setCurrentProjectId(id);
    setView('detail');
  }, []);

  const openTaskDrawer = useCallback((id: string | null) => {
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

  function handleSaveTask(values: Parameters<typeof createTask>[1]) {
    if (!currentProjectId) return;
    if (editingTaskId) {
      const affected = updateTask(editingTaskId, values);
      if (affected.length) {
        setHighlightedIds(new Set(affected));
        setAffectedNames(affected.map((id) => tasks.find((t) => t.id === id)?.name).filter((n): n is string => !!n));
        window.setTimeout(() => {
          setHighlightedIds(new Set());
          setAffectedNames([]);
        }, 6000);
      }
    } else {
      createTask(currentProjectId, values);
    }
    closeTaskDrawer();
  }

  function handleDeleteTask() {
    if (!editingTaskId) return;
    if (!window.confirm('Удалить задачу? Связи с другими задачами тоже будут удалены.')) return;
    deleteTask(editingTaskId);
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
          onSave={(values) => {
            const p = createProject(values);
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
