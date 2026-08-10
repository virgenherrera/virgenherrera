import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ReadmeService } from './readme.service';
import { PlatformModule } from './platform/platform.module';
import { PlatformService } from './platform/platform.service';

async function bootstrap(): Promise<void> {
  const command = process.argv[2];

  if (command === 'profile') {
    const app = await NestFactory.createApplicationContext(PlatformModule, {
      logger: ['error', 'warn', 'log'],
    });

    const service = app.get(PlatformService);
    service.generate();

    await app.close();

    return;
  }

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const service = app.get(ReadmeService);
  await service.generate();

  await app.close();
}

void bootstrap();
