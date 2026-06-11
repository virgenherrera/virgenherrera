import { Module, Logger } from "@nestjs/common";
import { GitHubService } from "./github/github.service.ts";
import { RenderService } from "./render/render.service.ts";
import { ReadmeService } from "./readme.service.ts";

@Module({
  providers: [GitHubService, RenderService, ReadmeService, Logger],
})
export class AppModule {}
