import { Module, Logger } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GitHubService } from './github/github.service';
import { RenderService } from './render/render.service';
import { ReadmeService } from './readme.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000,
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'virgenherrera-cli',
      },
    }),
  ],
  providers: [GitHubService, RenderService, ReadmeService, Logger],
})
export class AppModule {}
