"use client";

import { useEffect, useState } from "react";
import { getUserTasksAction } from "@/lib/actions/tasks.actions";
import { toast } from "sonner";

interface UserTask {
  id: string;
  type: string;
  status: string;
  createdAt: string;
  instance: {
    id: string;
    status: string;
    document: {
      id: string;
      type: string;
      referenceNumber: string;
    };
  };
  assignedTo?: { name: string };
}

export default function Dashboard() {
  const [tasks, setTasks] = useState<UserTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const userId = "user-placeholder";

  useEffect(() => {
    const loadTasks = async () => {
      setIsLoading(true);
      const result = await getUserTasksAction(userId);

      if (result.success) {
        setTasks(result.tasks || []);
      } else {
        toast.error(result.error || "Error al cargar tareas");
      }

      setIsLoading(false);
    };

    loadTasks();
  }, []);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Mi Bandeja
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Gestiona tus tareas pendientes
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-slate-600 dark:text-slate-400">
              Cargando tareas...
            </p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-8 text-center">
            <p className="text-slate-600 dark:text-slate-400">
              No tienes tareas pendientes
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {task.instance.document.referenceNumber}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      Tipo: {task.type}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs font-semibold">
                    {task.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
