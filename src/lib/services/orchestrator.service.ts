import { db } from "../db";
import { logger } from "../logger";
import { lockService } from "./lock.service";
import { auditService } from "./audit.service";
import { notificationService } from "./notification.service";
import { webhookService } from "./webhook.service";

interface StartInstanceInput {
  documentId: string;
  flowId: string;
  initiatorId?: string;
}

interface CompleteTaskInput {
  taskId: string;
  userId: string;
  payload?: Record<string, unknown>;
}

export class OrchestratorService {
  async startInstance(input: StartInstanceInput): Promise<string> {
    return lockService.acquireLock(`instance:${input.documentId}`, async () => {
      try {
        const flow = await db.flow.findUniqueOrThrow({
          where: { id: input.flowId },
          include: { nodes: true },
        });

        const instance = await db.documentInstance.create({
          data: {
            documentId: input.documentId,
            flowId: input.flowId,
            status: "pending",
          },
        });

        const startNodes = flow.nodes.filter((n) => n.isStart);

        if (startNodes.length === 0) {
          throw new Error("Flow has no start nodes");
        }

        for (const node of startNodes) {
          await this.createTasksForNode(instance.id, node.id, node.config as Record<string, unknown>);
        }

        await db.documentInstance.update({
          where: { id: instance.id },
          data: { status: "in_progress" },
        });

        await this.recordExecution(instance.id, 0, "instance_started", {
          flowId: input.flowId,
          initiator: input.initiatorId,
        });

        await auditService.log({
          entity: "DocumentInstance",
          entityId: instance.id,
          action: "create",
          actorId: input.initiatorId,
          payload: { flowId: input.flowId },
        });

        return instance.id;
      } catch (error) {
        logger.error("Failed to start instance", error);
        throw error;
      }
    });
  }

  async completeTask(input: CompleteTaskInput): Promise<void> {
    return lockService.acquireLock(`task:${input.taskId}`, async () => {
      try {
        const task = await db.documentTask.findUniqueOrThrow({
          where: { id: input.taskId },
          include: {
            instance: {
              include: { flow: { include: { nodes: true, edges: true } } },
            },
            node: true,
          },
        });

        if (task.status !== "todo" && task.status !== "in_progress") {
          throw new Error(`Cannot complete task with status ${task.status}`);
        }

        await db.documentTask.update({
          where: { id: input.taskId },
          data: {
            status: "done",
            payload: {
              ...(task.payload as Record<string, unknown>),
              completedAt: new Date().toISOString(),
              completedBy: input.userId,
            },
          },
        });

        const outgoingEdges = task.instance.flow.edges.filter((e) => e.sourceId === task.nodeId);

        if (outgoingEdges.length === 0) {
          await this.completeInstance(task.instance.id, input.userId);
        } else {
          for (const edge of outgoingEdges) {
            const targetNode = task.instance.flow.nodes.find((n) => n.id === edge.targetId);
            if (targetNode) {
              await this.createTasksForNode(task.instance.id, targetNode.id, targetNode.config as Record<string, unknown>);
            }
          }

          await db.documentInstance.update({
            where: { id: task.instance.id },
            data: { currentNodeId: outgoingEdges[0].targetId },
          });
        }

        await this.recordExecution(task.instance.id, task.nodeId, "task_completed", input.payload || {});

        await auditService.log({
          entity: "DocumentTask",
          entityId: input.taskId,
          action: "complete",
          actorId: input.userId,
        });

        await notificationService.notify({
          userId: input.userId,
          type: "task_completed",
          title: "Tarea completada",
          message: `La tarea ha sido completada exitosamente`,
          data: { taskId: input.taskId, instanceId: task.instance.id },
        });
      } catch (error) {
        logger.error("Failed to complete task", error);
        throw error;
      }
    });
  }

  async returnInstance(input: {
    instanceId: string;
    targetNodeId: string;
    userId: string;
    annotation: string;
  }): Promise<void> {
    return lockService.acquireLock(`instance:${input.instanceId}`, async () => {
      try {
        const instance = await db.documentInstance.findUniqueOrThrow({
          where: { id: input.instanceId },
        });

        if (instance.status !== "in_progress") {
          throw new Error("Can only return in_progress instances");
        }

        await db.annotation.create({
          data: {
            instanceId: input.instanceId,
            authorId: input.userId,
            body: input.annotation,
          },
        });

        await db.documentInstance.update({
          where: { id: input.instanceId },
          data: {
            status: "returned",
            currentNodeId: input.targetNodeId,
          },
        });

        await this.recordExecution(input.instanceId, input.targetNodeId, "instance_returned", {
          returnedBy: input.userId,
          annotation: input.annotation,
        });

        await auditService.log({
          entity: "DocumentInstance",
          entityId: input.instanceId,
          action: "return",
          actorId: input.userId,
          payload: { targetNode: input.targetNodeId },
        });
      } catch (error) {
        logger.error("Failed to return instance", error);
        throw error;
      }
    });
  }

  private async createTasksForNode(
    instanceId: string,
    nodeId: string,
    config: Record<string, unknown>
  ): Promise<void> {
    try {
      const taskType = (config.type as string) || "review";

      if (taskType === "auto") {
        await db.documentTask.create({
          data: {
            instanceId,
            nodeId,
            type: "auto",
            status: "todo",
            payload: config,
          },
        });
      } else {
        const assignedTo = (config.assignedTo as string[]) || [];

        if (assignedTo.length === 0) {
          throw new Error(`Node ${nodeId} has no assigned users`);
        }

        for (const userId of assignedTo) {
          const task = await db.documentTask.create({
            data: {
              instanceId,
              nodeId,
              assignedToId: userId,
              type: (config.requiresSignature ? "signature" : "review") as string,
              status: "todo",
              payload: config,
            },
          });

          await notificationService.notify({
            userId,
            type: "task_assigned",
            title: "Nueva tarea asignada",
            message: `Se ha asignado una nueva tarea para revisar`,
            data: { taskId: task.id, instanceId },
          });
        }
      }
    } catch (error) {
      logger.error("Failed to create tasks for node", error);
      throw error;
    }
  }

  private async completeInstance(instanceId: string, userId: string): Promise<void> {
    try {
      const instance = await db.documentInstance.findUniqueOrThrow({
        where: { id: instanceId },
      });

      await db.documentInstance.update({
        where: { id: instanceId },
        data: {
          status: "completed",
          completedAt: new Date(),
        },
      });

      await this.recordExecution(instanceId, instance.currentNodeId || "", "instance_completed", {
        completedBy: userId,
      });

      await auditService.log({
        entity: "DocumentInstance",
        entityId: instanceId,
        action: "complete",
        actorId: userId,
      });
    } catch (error) {
      logger.error("Failed to complete instance", error);
      throw error;
    }
  }

  private async recordExecution(
    instanceId: string,
    nodeId: string,
    event: string,
    payload: Record<string, unknown>
  ): Promise<void> {
    try {
      const lastExecution = await db.flowExecution.findFirst({
        where: { instanceId },
        orderBy: { step: "desc" },
      });

      const nextStep = (lastExecution?.step || 0) + 1;

      await db.flowExecution.create({
        data: {
          instanceId,
          step: nextStep,
          event,
          payload: {
            nodeId,
            ...payload,
          },
        },
      });
    } catch (error) {
      logger.error("Failed to record execution", error);
      throw error;
    }
  }
}

export const orchestratorService = new OrchestratorService();
