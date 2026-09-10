export type TaskStatus = 'planned' | 'in_progress' | 'done';
export type EffectiveStatus = TaskStatus | 'overdue';

// ----- То, что приходит с API (БД-формат) -----
export interface Project {
  id: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
}

export interface Task {
  id: number;
  project_id: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  status: string;
  assignee_id: number | null;
}

// ----- То, что используется во фронте (после адаптеров) -----
export interface ProjectView {
  id: number;
  title: string;
  description: string;
  start: string;
  end: string;
}

export interface TaskView {
  id: number;
  projectId: number;
  title: string;
  description: string;
  start: string;
  end: string;
  status: string;
  assigneeId: number | null;
  deps: number[];
}

// ----- Формы (то, что вводит пользователь) -----
export interface TaskFormValues {
  name: string;
  start: string;
  end: string;
  assignee: string;
  status: TaskStatus;
  description: string;
  deps: number[];
}

export interface ProjectFormValues {
  name: string;
  start: string;
  end: string;
}

export type View = 'list' | 'detail';