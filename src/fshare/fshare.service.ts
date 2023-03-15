import { Injectable } from '@nestjs/common';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import { app } from 'src/config/firebase.config';
import { ResponseType } from 'src/types/Response';

type FileDownloadURL = {
  url: string;
};

@Injectable()
export class FshareService {
  private readonly storage: any;

  constructor() {
    this.storage = getStorage(app);
  }

  async uploadFile(file: Express.Multer.File): Promise<ResponseType<any>> {
    try {
      const timestamp = new Date();
      const name = file.originalname.split('.')[0];
      const type = file.originalname.split('.')[1];

      const fileName = `${name}_${type}_${timestamp}`;
      const storageRef = ref(this.storage, fileName);

      const bytes = new Uint8Array(file.buffer);

      // upload file to bucket
      await uploadBytes(storageRef, bytes);

      // get downloadable URL of uploaded file
      const url = await getDownloadURL(storageRef);

      const res: ResponseType<FileDownloadURL> = {
        success: true,
        error: null,
        path: 'fshare',
        data: {
          message: 'File uploaded.',
          body: {
            url,
          },
          statusCode: 201,
        },
        code: 201,
      };

      return res;
    } catch (error) {
      console.error(error);
      const res: ResponseType<any> = {
        success: false,
        error: {
          message: error,
          statusCode: 400,
        },
        path: 'fshare',
        data: null,
        code: 400,
      };

      return res;
    }
  }
}
