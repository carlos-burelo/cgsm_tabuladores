export interface XYFlowNode {
  id: string;
  data: Record<string, unknown>;
  position: { x: number; y: number };
  type?: string;
}

export interface XYFlowEdge {
  id: string;
  source: string;
  target: string;
  data?: Record<string, unknown>;
}

export interface FlowDefinition {
  nodes: XYFlowNode[];
  edges: XYFlowEdge[];
}

export interface DocumentTaskPayload {
  message?: string;
  requiresSignature?: boolean;
  [key: string]: unknown;
}

export interface FlowNodeConfig {
  type: string;
  label: string;
  assignedTo?: string[];
  parallelExecution?: boolean;
  requiredSignatures?: number;
  webhookUrl?: string;
  [key: string]: unknown;
}

export type DocumentStatus = "pending" | "in_progress" | "completed" | "rejected" | "returned";
export type TaskStatus = "todo" | "in_progress" | "done" | "cancelled";
export type TaskType = "signature" | "review" | "auto" | "notification";

export interface FlowExecutionEvent {
  instanceId: string;
  nodeId: string;
  event: string;
  payload: Record<string, unknown>;
}

export interface WebhookPayload {
  event: string;
  instanceId: string;
  documentId: string;
  data: Record<string, unknown>;
  timestamp: string;
}
