import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('GlobalExceptionFilter');

  constructor(private readonly prisma: PrismaService) {}

  async catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // 1. Determine HTTP status code
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorType = 'InternalServerError';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        message = (res as any).message || (res as any).error || JSON.stringify(res);
        if (Array.isArray(message)) {
          message = message.join(', ');
        }
      }
      errorType = exception.name || 'HttpException';
    } else if (exception instanceof Error) {
      message = exception.message;
      errorType = exception.name || 'Error';
    } else if (typeof exception === 'string') {
      message = exception;
    }

    const stack = exception instanceof Error ? exception.stack : null;
    const endpoint = request.originalUrl || request.url || 'UNKNOWN';
    const method = request.method || 'GET';
    const user = (request as any).user;
    const businessId = user?.businessId || null;
    const userEmail = user?.email || null;

    // 2. Console diagnostic output
    this.logger.error(
      `[${method} ${endpoint}] ${status} ${errorType}: ${message}`,
      stack || '',
    );

    // 3. Asynchronously persist to database ErrorLog (only 4xx and 5xx errors)
    if (status >= 400) {
      this.prisma.errorLog
        .create({
          data: {
            endpoint,
            method,
            statusCode: status,
            errorType,
            message: String(message).slice(0, 2000),
            stack: stack ? String(stack).slice(0, 5000) : null,
            businessId,
            userEmail,
          },
        })
        .catch((dbErr) => {
          this.logger.warn(`Failed to save error log to DB: ${dbErr.message}`);
        });
    }

    // 4. Return clean, consistent JSON response to client
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: endpoint,
      errorType,
      message,
    });
  }
}
