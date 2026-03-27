import "reflect-metadata";
import { CommandFactory } from "nest-commander";
import { AppModule } from "./app.module.ts";

async function bootstrap(): Promise<void> {
  await CommandFactory.run(AppModule, {
    logger: ["error", "warn"],
  });
}

void bootstrap();
