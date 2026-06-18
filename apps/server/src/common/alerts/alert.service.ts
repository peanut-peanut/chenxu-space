import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';
import type { Request } from 'express';

type AlertInput = {
  status: number;
  message: string | string[];
  exception: unknown;
  request: Request;
};

@Injectable()
export class AlertService {
  private readonly logger = new Logger(AlertService.name);
  private readonly lastSentAt = new Map<string, number>();

  constructor(private readonly config: ConfigService) {}

  notifyServerError(input: AlertInput) {
    const enabled = this.config.get('NODE_ENV') === 'production';
    const webhook = this.config.get<string>('FEISHU_ALERT_WEBHOOK');

    if (!enabled || !webhook || input.status < 500) return;

    const key = this.getRateLimitKey(input);
    const now = Date.now();
    const lastSentAt = this.lastSentAt.get(key) ?? 0;
    const intervalMs =
      Number(this.config.get('FEISHU_ALERT_INTERVAL_MS')) || 60_000;

    if (now - lastSentAt < intervalMs) return;
    this.lastSentAt.set(key, now);

    void this.sendFeishuAlert(webhook, input).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Feishu alert failed: ${message}`);
    });
  }

  private getRateLimitKey(input: AlertInput) {
    return [
      input.status,
      input.request.method,
      input.request.route?.path ?? input.request.path,
      this.getExceptionName(input.exception),
    ].join(':');
  }

  private async sendFeishuAlert(webhook: string, input: AlertInput) {
    const secret = this.config.get<string>('FEISHU_ALERT_SECRET');
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const payload: Record<string, unknown> = {
      msg_type: 'text',
      content: {
        text: this.buildAlertText(input),
      },
    };

    if (secret) {
      payload.timestamp = timestamp;
      payload.sign = this.createFeishuSign(timestamp, secret);
    }

    const response = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
  }

  private createFeishuSign(timestamp: string, secret: string) {
    const stringToSign = `${timestamp}\n${secret}`;
    return createHmac('sha256', stringToSign).update('').digest('base64');
  }

  private buildAlertText(input: AlertInput) {
    const req = input.request;
    const message = Array.isArray(input.message)
      ? input.message.join('; ')
      : input.message;
    const user = req.user as { id?: number; role?: string } | undefined;
    const stack =
      input.exception instanceof Error ? input.exception.stack : undefined;

    return [
      '接口异常告警',
      `环境：${this.config.get('NODE_ENV') ?? 'unknown'}`,
      `状态码：${input.status}`,
      `接口：${req.method} ${req.originalUrl ?? req.url}`,
      `用户：${user?.id ? `${user.id} / ${user.role ?? '-'}` : '-'}`,
      `错误：${message}`,
      `时间：${new Date().toISOString()}`,
      stack ? `堆栈：${stack.slice(0, 1200)}` : '',
    ]
      .filter(Boolean)
      .join('\n');
  }

  private getExceptionName(exception: unknown) {
    return exception instanceof Error ? exception.name : typeof exception;
  }
}
