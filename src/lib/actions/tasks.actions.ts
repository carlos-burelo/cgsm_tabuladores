"use server";

import { db } from "../db";
import { orchestratorService } from "../services/orchestrator.service";
import { logger } from "../logger";

export async function completeTaskAction(input: {
  taskId: string;
  userId: string;
  payload?: Record<string, unknown>;
}) {
  try {
    await orchestratorService.completeTask({
      taskId: input.taskId,
      userId: input.userId,
      payload: input.payload,
    });

    return { success: true };
  } catch (error) {
    logger.error("Complete task action failed", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function getUserTasksAction(userId: string) {
  try {
    const tasks = await db.documentTask.findMany({
      where: {
        assignedToId: userId,
        status: { in: ["todo", "in_progress"] },
      },
      include: {
        instance: {
          include: {
            document: true,
            flow: true,
          },
        },
        node: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return { success: true, tasks };
  } catch (error) {
    logger.error("Get user tasks action failed", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function returnInstanceAction(input: {
  instanceId: string;
  targetNodeId: string;
  userId: string;
  annotation: string;
}) {
  try {
    await orchestratorService.returnInstance(input);
    return { success: true };
  } catch (error) {
    logger.error("Return instance action failed", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function annotateInstanceAction(input: {
  instanceId: string;
  userId: string;
  body: string;
}) {
  try {
    await db.annotation.create({
      data: {
        instanceId: input.instanceId,
        authorId: input.userId,
        body: input.body,
      },
    });

    return { success: true };
  } catch (error) {
    logger.error("Annotate instance action failed", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
