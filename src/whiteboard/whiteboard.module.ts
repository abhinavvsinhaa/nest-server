import { Module } from '@nestjs/common';
import { WBController } from './whiteboard.controller';
import { WBService } from './whiteboard.service';

@Module({
    imports: [],
    controllers: [WBController],
    providers: [WBService]
})
export class WBModule { }
