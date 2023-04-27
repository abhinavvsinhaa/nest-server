import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressPeerServer, PeerServer } from 'peer';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('/api/v1');
  app.enableCors();
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );

  // const peerServer = PeerServer()
  // const peer = peerServer.listen(+(process.env.PEERJS_PORT), () => {
  //   console.log(`Peer server listening on port ${process.env.PEERJS_PORT}`);
  //   console.log(peer.address())

  // });
  await app.listen(process.env.PORT);
  console.log(`Server is listening at ${process.env.PORT}`);
}

bootstrap();
