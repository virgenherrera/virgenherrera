import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.ts";
import { ReadmeService } from "./readme.service.ts";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ["error", "warn", "log"],
  });

  const service = app.get(ReadmeService);
  await service.generate();

  await app.close();
}

void bootstrap();
