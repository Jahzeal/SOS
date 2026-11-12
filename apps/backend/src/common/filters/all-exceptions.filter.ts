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
      // Keep the real message for our own logs only (see internalMessage below).
      errorType = exception.name || 'Error';
    }

    // What we record internally. Unexpected errors can contain SQL, file paths
    // or other internals, so the client only ever sees a generic message for them.
    const internalMessage =
      exception instanceof HttpException
        ? message
        : exception instanceof Error
          ? exception.message
          : String(exception);

    const stack = exception instanceof Error ? exception.stack : null;
    const endpoint = request.originalUrl || request.url || 'UNKNOWN';
    const method = request.method || 'GET';
    const user = (request as any).user;
    const businessId = user?.businessId || null;
    const userEmail = user?.email || null;

    // 2. Console diagnostic output
    this.logger.error(
      `[${method} ${endpoint}] ${status} ${errorType}: ${internalMessage}`,
      stack || '',
    );

    // 3. Persist real faults only. Routine 4xx responses (bad password, not found,
    //    validation) are not faults, and logging them let anyone flood the table.
    if (status >= 500) {
      try {
        await this.prisma.errorLog.create({
          data: {
            endpoint,
            method,
            statusCode: status,
            errorType,
            message: String(internalMessage).slice(0, 2000),
            stack: stack ? String(stack).slice(0, 5000) : null,
            businessId,
            userEmail,
          },
        });
      } catch (dbErr: any) {
        this.logger.warn(`Failed to save error log to DB: ${dbErr?.message || dbErr}`);
      }
    }

    // 4. Return clean, consistent JSON response to client
    const res = exception instanceof HttpException ? exception.getResponse() : null;
    const code = res && typeof res === 'object' ? (res as any).code : undefined;

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: endpoint,
      errorType: status >= 500 ? 'InternalServerError' : errorType,
      message: status >= 500 ? 'Something went wrong on our side. Please try again.' : message,
      ...(code ? { code } : {}),
    });
  }
}
