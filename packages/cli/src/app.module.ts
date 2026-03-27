import { Module } from "@nestjs/common";
import { ReadmeModule } from "@virgenherrera/plugin-readme";
import { GenerateCommand } from "./commands/generate.command.ts";

@Module({
  imports: [ReadmeModule],
  providers: [GenerateCommand],
})
export class AppModule {}
