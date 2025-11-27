import { create } from "zustand";
import { Node, Edge } from "@xyflow/react";

interface FlowStore {
  flowId: string | null;
  nodes: Node[];
  edges: Edge[];
  setFlowId: (id: string) => void;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  addNode: (node: Node) => void;
  removeNode: (nodeId: string) => void;
  addEdge: (edge: Edge) => void;
  removeEdge: (edgeId: string) => void;
  reset: () => void;
}

export const useFlowStore = create<FlowStore>((set) => ({
  flowId: null,
  nodes: [],
  edges: [],

  setFlowId: (id: string) => set({ flowId: id }),

  setNodes: (nodes: Node[]) => set({ nodes }),

  setEdges: (edges: Edge[]) => set({ edges }),

  addNode: (node: Node) => set((state) => ({ nodes: [...state.nodes, node] })),

  removeNode: (nodeId: string) =>
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== nodeId),
      edges: state.edges.filter(
        (e) => e.source !== nodeId && e.target !== nodeId
      ),
    })),

  addEdge: (edge: Edge) =>
    set((state) => ({ edges: [...state.edges, edge] })),

  removeEdge: (edgeId: string) =>
    set((state) => ({
      edges: state.edges.filter((e) => e.id !== edgeId),
    })),

  reset: () => set({ flowId: null, nodes: [], edges: [] }),
}));
