"use client";

import { useCallback, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { toast } from "sonner";
import { createFlowAction } from "@/lib/actions/flows.actions";

const initialNodes: Node[] = [
  {
    id: "start",
    data: { label: "Inicio" },
    position: { x: 250, y: 5 },
    type: "input",
  },
  {
    id: "end",
    data: { label: "Fin" },
    position: { x: 250, y: 250 },
    type: "output",
  },
];

const initialEdges: Edge[] = [];

export default function EditorPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [flowName, setFlowName] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge(connection, eds));
    },
    [setEdges]
  );

  const handleSaveFlow = async () => {
    if (!flowName.trim()) {
      toast.error("Ingresa un nombre para el flujo");
      return;
    }

    if (!departmentId.trim()) {
      toast.error("Selecciona un departamento");
      return;
    }

    setIsSaving(true);

    try {
      const result = await createFlowAction({
        name: flowName,
        departmentId,
        definition: {
          nodes: nodes.map((node) => ({
            id: node.id,
            data: node.data,
            position: { x: node.position.x, y: node.position.y },
            type: node.type,
          })),
          edges: edges.map((edge) => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            data: edge.data,
          })),
        },
      });

      if (result.success) {
        toast.success("Flujo guardado exitosamente");
        setFlowName("");
      } else {
        toast.error(result.error || "Error al guardar el flujo");
      }
    } catch (error) {
      toast.error("Error al guardar el flujo");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddNode = () => {
    const newNode: Node = {
      id: `node-${Date.now()}`,
      data: { label: "Nuevo nodo" },
      position: { x: 250, y: 150 },
      type: "default",
    };
    setNodes((nds) => [...nds, newNode]);
  };

  return (
    <div className="w-full h-screen flex flex-col">
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 space-y-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Editor de Flujos
        </h1>

        <div className="flex gap-4 items-end flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Nombre del Flujo
            </label>
            <input
              type="text"
              value={flowName}
              onChange={(e) => setFlowName(e.target.value)}
              placeholder="Ej: Orden de Pago"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Departamento
            </label>
            <input
              type="text"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              placeholder="ID del Departamento"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleAddNode}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg font-semibold transition-colors"
            >
              Agregar Nodo
            </button>
            <button
              onClick={handleSaveFlow}
              disabled={isSaving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-semibold transition-colors"
            >
              {isSaving ? "Guardando..." : "Guardar Flujo"}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>
    </div>
  );
}
