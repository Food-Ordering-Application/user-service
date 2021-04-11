import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  // const app = await NestFactory.create(AppModule);
  // const config = app.get<ConfigService>(ConfigService);
  // app.connectMicroservice<MicroserviceOptions>({
  //   transport: Transport.RMQ,
  //   options: {
  //     urls: [config.get('AMWP_URL')],
  //     queue: config.get('AMWP_QUEUE'),
  //     queueOptions: {
  //       durable: false,
  //     },
  //   },
  // });
  // app.startAllMicroservices(() => Logger.log('Microservice has started...'));
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: ['amqp://admin:admin@rabbitmq:5672'],
        queue: 'cats_queue',
        queueOptions: {
          durable: false,
        },
      },
    },
  );
  app.listen(() => console.log('User microservice is listening'));
}
bootstrap();
