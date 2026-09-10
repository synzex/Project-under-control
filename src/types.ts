export type TaskStatus = 'planned' | 'in_progress' | 'done';
export type EffectiveStatus = TaskStatus | 'overdue';

export interface Project {
  id: string;
  name: string;
  start: string; // ISO yyyy-mm-dd
  end: string;   // ISO yyyy-mm-dd
}

export interface Task {
  id: string;
  projectId: string;
  name: string;
  assignee: string;
  status: TaskStatus;
  start: string; // ISO yyyy-mm-dd
  end: string;   // ISO yyyy-mm-dd
  deps: string[]; // ids of prerequisite tasks
  description: string;
}

export type View = 'list' | 'detail';

export interface TaskFormValues {
  name: string;
  start: string;
  end: string;
  assignee: string;
  status: TaskStatus;
  description: string;
  deps: string[];
}

export interface ProjectFormValues {
  name: string;
  start: string;
  end: string;
}
