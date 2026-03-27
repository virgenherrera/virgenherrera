import { Module } from "@nestjs/common";
import { GenerateCommand } from "./commands/generate.command.ts";
import { ProfilePlugin } from "./plugins/plugin.abstract.ts";

@Module({
  providers: [
    GenerateCommand,
    {
      provide: ProfilePlugin,
      useValue: [],
    },
  ],
})
export class AppModule {}
