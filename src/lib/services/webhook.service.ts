import { db } from "../db";
import { logger } from "../logger";
import { config } from "../config";

interface WebhookPayload {
  event: string;
  instanceId: string;
  documentId: string;
  data: Record<string, unknown>;
  timestamp: string;
}

export class WebhookService {
  async sendWebhook(url: string, payload: WebhookPayload, retryCount = 0): Promise<void> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.webhook.timeoutMs);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Event": payload.event,
          "X-Instance-Id": payload.instanceId,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      await db.webhookLog.create({
        data: {
          url,
          event: payload.event,
          payload,
          statusCode: response.status,
          response: await response.text(),
          retryCount,
          success: response.ok,
        },
      });

      if (!response.ok && retryCount < config.webhook.maxRetries) {
        logger.warn(`Webhook failed, scheduling retry ${retryCount + 1}/${config.webhook.maxRetries}`);
        await this.scheduleRetry(url, payload, retryCount + 1);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      await db.webhookLog.create({
        data: {
          url,
          event: payload.event,
          payload,
          statusCode: null,
          response: errorMessage,
          retryCount,
          success: false,
        },
      });

      if (retryCount < config.webhook.maxRetries) {
        logger.warn(`Webhook error, scheduling retry ${retryCount + 1}/${config.webhook.maxRetries}`, error);
        await this.scheduleRetry(url, payload, retryCount + 1);
      } else {
        logger.error(`Webhook failed after ${config.webhook.maxRetries} retries`, error);
      }
    }
  }

  private async scheduleRetry(url: string, payload: WebhookPayload, retryCount: number): Promise<void> {
    const delay = config.webhook.retryDelayMs * Math.pow(2, retryCount - 1);
    setTimeout(() => {
      this.sendWebhook(url, payload, retryCount).catch((error) => {
        logger.error("Scheduled webhook retry failed", error);
      });
    }, delay);
  }
}

export const webhookService = new WebhookService();
