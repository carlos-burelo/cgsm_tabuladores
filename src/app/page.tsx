"use client";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-md w-full mx-auto px-6">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
              Virtual Office
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Sistema de Flujos Documentales
            </p>
          </div>

          <div className="space-y-3 pt-8">
            <a
              href="/dashboard"
              className="block w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              Ir al Dashboard
            </a>
            <a
              href="/editor"
              className="block w-full px-6 py-3 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-semibold rounded-lg transition-colors"
            >
              Editor de Flujos
            </a>
          </div>

          <div className="pt-12 border-t border-slate-200 dark:border-slate-800">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Sistema listo para producción
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
