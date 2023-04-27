import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ResponseType } from 'src/types';
import { FshareService } from './fshare.service';
import '@tensorflow/tfjs-node';
import * as toxicity from '@tensorflow-models/toxicity';
import { translate } from '@vitalets/google-translate-api';

type FileDownloadURL = {
  url: string;
};

@Controller('fshare')
export class FshareController {
  constructor(private fshareService: FshareService) {}

  @Post('/')
  @UseInterceptors(FileInterceptor('file'))
  async storeFileAndReturnDownloadURL(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ResponseType<any>> {
    if (file) {
      console.log(file);
      return this.fshareService.uploadFile(file);
    }
  }

  @Post('models')
  models(): string {
    console.log('received request');
    const labels: string[] = ['identity_attack', 'insult', 'threat'];
    toxicity.load(0.9, labels).then((model: any) => {
      const sentences = ['you suck', 'fuck it'];
      model.classify(sentences).then((predictions) => {
        predictions.map((prediction) => {
          console.log(prediction);
        });
      });
    });
    return 'hello';
  }

  @Post('translate')
  async translate(): Promise<any> {
    const { text } = await translate('hey there', { to: 'hi' });
    return text;
  }
}
