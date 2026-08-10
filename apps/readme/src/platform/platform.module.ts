import { Module, Logger } from '@nestjs/common';
import { PlatformService } from './platform.service';

@Module({
  providers: [PlatformService, Logger],
})
export class PlatformModule {}
