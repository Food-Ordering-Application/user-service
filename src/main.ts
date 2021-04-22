import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // microservice #1
  const userQueue = app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.AMQP_URL],
      queue: process.env.USERS_AMQP_QUEUE,
      queueOptions: {
        durable: false,
      },
    },
  });
  const restaurantEventQueue = app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.AMQP_URL],
      // TODO
      queue: 'restaurant_event_queue',
      queueOptions: {
        durable: false,
      },
    },
  });

  await app.startAllMicroservicesAsync();
  await app.listen(3001, () => console.log('User microservice is listening', process.env.RESTAURANT_EVENT_AMQP_QUEUE));
  // const app = await NestFactory.createMicroservice<MicroserviceOptions>(
  //   AppModule,
  //   {
  //     transport: Transport.RMQ,
  //     options: {
  //       urls: [process.env.AMQP_URL],
  //       queue: process.env.USERS_AMQP_QUEUE,
  //       queueOptions: {
  //         durable: false,
  //       },
  //     },
  //   },
  // );
  // app.listen(() => console.log('User microservice is listening'));
}
bootstrap();
