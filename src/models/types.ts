export type TaskCategory = "Assignment" | "Test" | "Project";

export interface Folder {
  id: string;
  name: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  subject: string;
  category: TaskCategory;
  dueDate: string;
  dateAssigned: string;
  folderId: string | null;
  completed: boolean;
  completedAt?: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  enableTaskCompletionTracking: boolean;
}

export type AppView = "all" | "today" | "overdue" | "folder" | "calendar";
