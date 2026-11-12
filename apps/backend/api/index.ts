import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { assertRequiredEnv } from '../src/common/config/env';
import { corsOptions, isAllowedOrigin } from '../src/common/config/cors';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';

let app: any;

export default async function handler(req: any, res: any) {
  // CORS headers for the serverless function: only known frontends are echoed back.
  const origin = req.headers.origin;
  if (origin && isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, X-CSRF-Token');

  // Direct preflight handling for serverless functions
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (!app) {
    app = await NestFactory.create(AppModule, { rawBody: true });
    assertRequiredEnv();

    const prismaService = app.get(PrismaService);
    app.useGlobalFilters(new AllExceptionsFilter(prismaService));

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    app.enableCors(corsOptions);

    await app.init();
  }

  const instance = app.getHttpAdapter().getInstance();
  return instance(req, res);
}
