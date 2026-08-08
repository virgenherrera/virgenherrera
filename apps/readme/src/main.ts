import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ReadmeService } from './readme.service';
import { LinkedinModule } from './linkedin/linkedin.module';
import { LinkedinService } from './linkedin/linkedin.service';

async function bootstrap(): Promise<void> {
  const command = process.argv[2];

  if (command === 'linkedin') {
    const app = await NestFactory.createApplicationContext(LinkedinModule, {
      logger: ['error', 'warn', 'log'],
    });

    const service = app.get(LinkedinService);
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
