import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AlertService } from '../alerts/alert.service';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly alerts: AlertService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = '服务器内部错误';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message =
        typeof res === 'string' ? res : (res as { message: string }).message;
    }

    this.alerts.notifyServerError({ status, message, exception, request });

    response.status(HttpStatus.OK).json({ code: status, message, data: null });
  }
}
