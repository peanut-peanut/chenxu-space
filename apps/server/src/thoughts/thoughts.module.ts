import { Module } from '@nestjs/common';
import { ThoughtsController } from './thoughts.controller';
import { ThoughtsService } from './thoughts.service';

@Module({
  controllers: [ThoughtsController],
  providers: [ThoughtsService],
})
export class ThoughtsModule {}
