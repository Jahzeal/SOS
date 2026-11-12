import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';
import { assertRequiredEnv } from './common/config/env';
import { corsOptions } from './common/config/cors';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
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

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`NoxGuarda API server running on http://localhost:${port}`);
}
bootstrap();
