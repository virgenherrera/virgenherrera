import { NestFactory } from '@nestjs/core';
import 'reflect-metadata';
import { z } from 'zod';
import { AppModule } from './app.module';
import { PlatformModule } from './platform/platform.module';
import { PlatformService } from './platform/platform.service';
import { ReadmeService } from './readme.service';

const CommandSchema = z.enum(['readme', 'profile']).default('readme');

const COMMAND_MAP = {
  readme: { module: AppModule, service: ReadmeService },
  profile: { module: PlatformModule, service: PlatformService },
} as const;

async function bootstrap(): Promise<void> {
  const command = CommandSchema.parse(process.argv[2]);
  const { module, service: ServiceClass } = COMMAND_MAP[command];

  const app = await NestFactory.createApplicationContext(module, {
    logger: ['error', 'warn', 'log'],
  });

  const service = app.get(ServiceClass);
  await service.generate();

  await app.close();
}

void bootstrap();
