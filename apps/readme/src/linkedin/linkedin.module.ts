import { Module, Logger } from '@nestjs/common';
import { LinkedinService } from './linkedin.service';

@Module({
  providers: [LinkedinService, Logger],
})
export class LinkedinModule {}
