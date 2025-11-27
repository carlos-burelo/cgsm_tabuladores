"use server";

import { flowService } from "../services/flow.service";
import { logger } from "../logger";
import { FlowDefinition } from "../../types";

export async function createFlowAction(input: {
  name: string;
  description?: string;
  departmentId: string;
  definition: FlowDefinition;
}) {
  try {
    const flowId = await flowService.createFlow(input);
    return { success: true, flowId };
  } catch (error) {
    logger.error("Create flow action failed", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function updateFlowAction(input: {
  flowId: string;
  definition: FlowDefinition;
}) {
  try {
    await flowService.updateFlow(input.flowId, {
      definition: input.definition,
    });
    return { success: true };
  } catch (error) {
    logger.error("Update flow action failed", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function getFlowAction(flowId: string) {
  try {
    const flow = await flowService.getFlow(flowId);
    return { success: true, flow };
  } catch (error) {
    logger.error("Get flow action failed", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function getFlowsByDepartmentAction(departmentId: string) {
  try {
    const flows = await flowService.getFlowsByDepartment(departmentId);
    return { success: true, flows };
  } catch (error) {
    logger.error("Get flows action failed", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
