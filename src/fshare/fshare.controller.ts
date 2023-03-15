import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ResponseType } from 'src/types';
import { FshareService } from './fshare.service';

type FileDownloadURL = {
  url: string
}

@Controller('fshare')
export class FshareController {
  constructor(private fshareService: FshareService) {}

  @Post('/')
  @UseInterceptors(FileInterceptor('file')) 
  async storeFileAndReturnDownloadURL(@UploadedFile() file: Express.Multer.File): Promise<ResponseType<any>> {
    if (file) {
      console.log(file);
      return this.fshareService.uploadFile(file);
    }
  }
}
