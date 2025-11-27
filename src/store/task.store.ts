import { create } from "zustand";

interface Task {
  id: string;
  type: string;
  status: string;
  instanceId: string;
  nodeId: string;
  assignedToId?: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

interface TaskStore {
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  removeTask: (id: string) => void;
  clear: () => void;
}

export const useTaskStore = create<TaskStore>((set) => ({
  tasks: [],

  setTasks: (tasks: Task[]) => set({ tasks }),

  addTask: (task: Task) =>
    set((state) => ({ tasks: [...state.tasks, task] })),

  updateTask: (id: string, updates: Partial<Task>) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),

  removeTask: (id: string) =>
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
    })),

  clear: () => set({ tasks: [] }),
}));
