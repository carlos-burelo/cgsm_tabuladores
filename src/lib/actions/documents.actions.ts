"use server";

import { db } from "../db";
import { orchestratorService } from "../services/orchestrator.service";
import { logger } from "../logger";

export async function createDocumentAction(input: {
  departmentId: string;
  type: string;
  referenceNumber: string;
  flowId: string;
  metadata?: Record<string, unknown>;
  initiatorId?: string;
}) {
  try {
    const document = await db.document.create({
      data: {
        departmentId: input.departmentId,
        type: input.type,
        referenceNumber: input.referenceNumber,
        metadata: input.metadata || {},
      },
    });

    const instanceId = await orchestratorService.startInstance({
      documentId: document.id,
      flowId: input.flowId,
      initiatorId: input.initiatorId,
    });

    return { success: true, documentId: document.id, instanceId };
  } catch (error) {
    logger.error("Create document action failed", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function getDocumentAction(documentId: string) {
  try {
    const document = await db.document.findUniqueOrThrow({
      where: { id: documentId },
      include: {
        instances: {
          include: {
            tasks: {
              include: { assignedTo: true },
            },
            annotations: {
              include: { author: true },
            },
          },
        },
      },
    });

    return { success: true, document };
  } catch (error) {
    logger.error("Get document action failed", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function getDocumentsByDepartmentAction(departmentId: string) {
  try {
    const documents = await db.document.findMany({
      where: { departmentId },
      include: { instances: true },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, documents };
  } catch (error) {
    logger.error("Get documents action failed", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
