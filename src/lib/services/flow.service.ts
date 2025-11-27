import { db } from "../db";
import { logger } from "../logger";
import { auditService } from "./audit.service";
import { notificationService } from "./notification.service";
import { FlowDefinition, TaskType } from "../../types";

export class FlowService {
  async createFlow(input: {
    name: string;
    description?: string;
    departmentId: string;
    definition: FlowDefinition;
  }): Promise<string> {
    try {
      const flow = await db.flow.create({
        data: {
          name: input.name,
          description: input.description,
          departmentId: input.departmentId,
          isActive: true,
        },
      });

      await this.persistFlowDefinition(flow.id, input.definition);

      await auditService.log({
        entity: "Flow",
        entityId: flow.id,
        action: "create",
        payload: { name: input.name },
      });

      return flow.id;
    } catch (error) {
      logger.error("Failed to create flow", error);
      throw error;
    }
  }

  async updateFlow(
    flowId: string,
    input: {
      definition: FlowDefinition;
      version?: number;
    }
  ): Promise<void> {
    try {
      const flow = await db.flow.findUniqueOrThrow({
        where: { id: flowId },
      });

      const activeInstances = await db.documentInstance.count({
        where: {
          flowId,
          status: { in: ["pending", "in_progress"] },
        },
      });

      if (activeInstances > 0) {
        throw new Error("Cannot update flow with active instances");
      }

      const updatedFlow = await db.flow.update({
        where: { id: flowId },
        data: {
          version: { increment: 1 },
          updatedAt: new Date(),
        },
      });

      await this.deleteFlowDefinition(flowId);
      await this.persistFlowDefinition(flowId, input.definition);

      await auditService.log({
        entity: "Flow",
        entityId: flowId,
        action: "update",
        payload: { newVersion: updatedFlow.version },
      });
    } catch (error) {
      logger.error("Failed to update flow", error);
      throw error;
    }
  }

  async getFlow(flowId: string) {
    try {
      const flow = await db.flow.findUniqueOrThrow({
        where: { id: flowId },
        include: {
          nodes: true,
          edges: true,
        },
      });

      return flow;
    } catch (error) {
      logger.error("Failed to fetch flow", error);
      throw error;
    }
  }

  async getFlowsByDepartment(departmentId: string) {
    try {
      return await db.flow.findMany({
        where: {
          departmentId,
          isActive: true,
        },
        orderBy: { createdAt: "desc" },
      });
    } catch (error) {
      logger.error("Failed to fetch flows", error);
      throw error;
    }
  }

  private async persistFlowDefinition(flowId: string, definition: FlowDefinition): Promise<void> {
    try {
      const nodeMap = new Map(definition.nodes.map((n) => [n.id, n]));

      for (const node of definition.nodes) {
        const dbNode = nodeMap.get(node.id);
        if (!dbNode) continue;

        await db.flowNode.create({
          data: {
            flowId,
            nodeId: node.id,
            type: node.type || "default",
            label: dbNode.data?.label as string,
            positionX: node.position.x,
            positionY: node.position.y,
            config: node.data || {},
            isStart: dbNode.data?.isStart === true,
            isEnd: dbNode.data?.isEnd === true,
          },
        });
      }

      for (const edge of definition.edges) {
        await db.flowEdge.create({
          data: {
            flowId,
            edgeId: edge.id,
            sourceId: edge.source,
            targetId: edge.target,
            label: edge.data?.label as string,
            condition: edge.data?.condition || null,
          },
        });
      }
    } catch (error) {
      logger.error("Failed to persist flow definition", error);
      throw error;
    }
  }

  private async deleteFlowDefinition(flowId: string): Promise<void> {
    try {
      await db.flowEdge.deleteMany({ where: { flowId } });
      await db.flowNode.deleteMany({ where: { flowId } });
    } catch (error) {
      logger.error("Failed to delete flow definition", error);
      throw error;
    }
  }
}

export const flowService = new FlowService();
