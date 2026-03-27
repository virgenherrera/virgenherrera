import { Module } from "@nestjs/common";
import { ProfilePlugin } from "@virgenherrera/cli";
import { ReadmePlugin } from "./readme.plugin.ts";

@Module({
  providers: [
    ReadmePlugin,
    {
      provide: ProfilePlugin,
      useClass: ReadmePlugin,
    },
  ],
  exports: [ProfilePlugin, ReadmePlugin],
})
export class ReadmeModule {}
