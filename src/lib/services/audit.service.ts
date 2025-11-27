import { db } from "../db";
import { logger } from "../logger";

interface AuditEntry {
  entity: string;
  entityId: string;
  action: string;
  actorId?: string;
  payload?: Record<string, unknown>;
}

export class AuditService {
  async log(entry: AuditEntry): Promise<void> {
    try {
      await db.auditLog.create({
        data: {
          entity: entry.entity,
          entityId: entry.entityId,
          action: entry.action,
          actorId: entry.actorId,
          payload: entry.payload || null,
        },
      });
    } catch (error) {
      logger.error("Failed to log audit entry", error);
      throw error;
    }
  }

  async getInstanceHistory(instanceId: string) {
    try {
      return await db.auditLog.findMany({
        where: {
          entityId: instanceId,
        },
        orderBy: {
          createdAt: "asc",
        },
      });
    } catch (error) {
      logger.error("Failed to fetch audit history", error);
      throw error;
    }
  }
}

export const auditService = new AuditService();
