import { Module } from '@nestjs/common';
import { FshareController } from './fshare.controller';
import { FshareService } from './fshare.service';

@Module({
  controllers: [FshareController],
  providers: [FshareService]
})
export class FshareModule {}
